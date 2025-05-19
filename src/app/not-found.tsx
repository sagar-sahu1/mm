"use client";
import { Suspense } from "react";

function NotFoundContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-lg text-gray-500 mb-8">Sorry, the page you are looking for does not exist.</p>
      <a href="/" className="text-primary underline">Go back home</a>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={null}>
      <NotFoundContent />
    </Suspense>
  );
} 