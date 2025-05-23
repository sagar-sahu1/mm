import React, { useEffect, useRef, useState } from "react";

interface MotionDetectorProps {
  onPermissionDenied: () => void;
  onMotionWarning: (warningCount: number) => void;
  onMaxWarnings: () => void;
  cheatingLog: any;
  intervalMs?: number;
  maxWarnings?: number;
  motionThreshold?: number; // 0-255, higher = less sensitive
  showPreview?: boolean;
}

/**
 * MotionDetector: Hidden webcam-based motion detection for proctoring.
 * - Requests webcam access on mount.
 * - Calls onPermissionDenied if denied.
 * - Calls onMotionWarning on each motion detection.
 * - Calls onMaxWarnings after maxWarnings.
 * - Appends motion events to cheatingLog.
 */
const MotionDetector: React.FC<MotionDetectorProps> = ({
  onPermissionDenied,
  onMotionWarning,
  onMaxWarnings,
  cheatingLog,
  intervalMs = 2000, // 2 seconds
  maxWarnings = 3,
  motionThreshold = 40, // pixel diff threshold
  showPreview = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevImageData = useRef<ImageData | null>(null);
  const [motionWarnings, setMotionWarnings] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const intervalId = useRef<NodeJS.Timeout | null>(null);
  const [lastWarningTime, setLastWarningTime] = useState<number>(0);

  // Request webcam access on mount
  useEffect(() => {
    let active = true;
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      onPermissionDenied();
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
      .then((mediaStream) => {
        if (!active) return;
        setStream(mediaStream);
        setPreviewKey(prev => prev + 1);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        if (previewRef.current) {
          previewRef.current.srcObject = mediaStream;
        }
      })
      .catch(() => {
        if (active) onPermissionDenied();
      });
    return () => {
      active = false;
      if (intervalId.current) clearInterval(intervalId.current);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line
  }, []);

  // Start motion detection loop when stream is ready
  useEffect(() => {
    if (!stream || !videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let width = 320;
    let height = 240;
    video.width = width;
    video.height = height;
    canvas.width = width;
    canvas.height = height;

    let blankFrameCount = 0;
    const BLANK_FRAME_LIMIT = 3; // 3 intervals (6 seconds)
    let warningTimeout: NodeJS.Timeout | null = null;

    const detectMotion = () => {
      if (!canvas || !video) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, width, height);
      const currImageData = ctx.getImageData(0, 0, width, height);
      // Check for mostly black frame (user left camera or covered it)
      let blackPixels = 0;
      for (let i = 0; i < currImageData.data.length; i += 4) {
        const avg = (currImageData.data[i] + currImageData.data[i+1] + currImageData.data[i+2]) / 3;
        if (avg < 10) blackPixels++;
      }
      const now = Date.now();
      if (blackPixels > width * height * 0.85) { // >85% black
        blankFrameCount++;
        if (blankFrameCount >= BLANK_FRAME_LIMIT) {
          // Only allow one warning per 90 seconds
          if (now - lastWarningTime > 90000) {
            const newWarnings = motionWarnings + 1;
            setMotionWarnings(newWarnings);
            setLastWarningTime(now);
            if (cheatingLog && typeof cheatingLog === "object") {
              cheatingLog.motion = cheatingLog.motion || [];
              cheatingLog.motion.push({
                timestamp: now,
                type: 'blank_frame',
                blackPixels,
              });
            }
            onMotionWarning(newWarnings);
            if (newWarnings >= maxWarnings) {
              onMaxWarnings();
            }
            blankFrameCount = 0;
            // After a warning, pause detection for 90 seconds
            if (intervalId.current) clearInterval(intervalId.current);
            warningTimeout = setTimeout(() => {
              intervalId.current = setInterval(detectMotion, intervalMs);
            }, 90000);
          }
        }
        return;
      } else {
        blankFrameCount = 0;
      }
      prevImageData.current = currImageData;
    };
    intervalId.current = setInterval(detectMotion, intervalMs);
    return () => {
      if (intervalId.current) clearInterval(intervalId.current);
      if (warningTimeout) clearTimeout(warningTimeout);
    };
    // eslint-disable-next-line
  }, [stream, motionWarnings, lastWarningTime]);

  // Assign stream to both video elements whenever stream or refs change
  useEffect(() => {
    if (stream) {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
      }
    }
  }, [stream, videoRef, previewRef, previewKey]);

  // Hidden video/canvas, plus optional preview
  return (
    <>
      <div style={{ display: "none" }}>
        <video ref={videoRef} autoPlay playsInline muted />
        <canvas ref={canvasRef} />
      </div>
      {/* Always render preview video, but only show if showPreview is true */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 50, width: 120, height: 90, background: '#222', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.25)', display: showPreview ? 'block' : 'none', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        {stream ? (
          <video
            key={previewKey}
            ref={previewRef}
            autoPlay
            playsInline
            muted
            style={{ width: 120, height: 90, borderRadius: 12, objectFit: 'cover', background: '#222' }}
          />
        ) : (
          <div style={{ color: '#fff', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
            Camera not available
          </div>
        )}
      </div>
    </>
  );
};

export default MotionDetector; 