import React, { useEffect, useRef, useState } from "react";

interface MotionDetectorProps {
  onPermissionDenied: () => void;
  onMotionWarning: (warningCount: number) => void;
  onMaxWarnings: () => void;
  cheatingLog: any;
  intervalMs?: number;
  maxWarnings?: number;
  motionThreshold?: number; // 0-255, higher = less sensitive
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
  intervalMs = 2000,
  maxWarnings = 3,
  motionThreshold = 40, // pixel diff threshold
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevImageData = useRef<ImageData | null>(null);
  const [motionWarnings, setMotionWarnings] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const intervalId = useRef<NodeJS.Timeout | null>(null);

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
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
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

    const detectMotion = () => {
      if (!canvas || !video) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, width, height);
      const currImageData = ctx.getImageData(0, 0, width, height);
      if (prevImageData.current) {
        let diff = 0;
        for (let i = 0; i < currImageData.data.length; i += 4) {
          // Simple grayscale diff
          const currGray = (currImageData.data[i] + currImageData.data[i+1] + currImageData.data[i+2]) / 3;
          const prevGray = (prevImageData.current.data[i] + prevImageData.current.data[i+1] + prevImageData.current.data[i+2]) / 3;
          if (Math.abs(currGray - prevGray) > motionThreshold) diff++;
        }
        // If more than 1% of pixels changed, count as motion
        if (diff > (width * height * 0.01)) {
          const newWarnings = motionWarnings + 1;
          setMotionWarnings(newWarnings);
          // Log event
          if (cheatingLog && typeof cheatingLog === "object") {
            cheatingLog.motion = cheatingLog.motion || [];
            cheatingLog.motion.push({
              timestamp: Date.now(),
              diffPixels: diff,
            });
          }
          onMotionWarning(newWarnings);
          if (newWarnings >= maxWarnings) {
            onMaxWarnings();
          }
        }
      }
      prevImageData.current = currImageData;
    };
    intervalId.current = setInterval(detectMotion, intervalMs);
    return () => {
      if (intervalId.current) clearInterval(intervalId.current);
    };
    // eslint-disable-next-line
  }, [stream, motionWarnings]);

  // Hidden video/canvas
  return (
    <div style={{ display: "none" }}>
      <video ref={videoRef} autoPlay playsInline muted />
      <canvas ref={canvasRef} />
    </div>
  );
};

export default MotionDetector; 