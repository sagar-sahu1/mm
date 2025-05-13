
"use client";

import { useEffect } from 'react';
import { initializeClientAnalytics } from '@/lib/firebase';

export function ClientAnalyticsInitializer() {
  useEffect(() => {
    initializeClientAnalytics();
  }, []);

  return null; // This component doesn't render anything
}
