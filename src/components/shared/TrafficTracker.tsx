'use client';

import { useEffect, useRef } from 'react';
import { incrementDailyView } from '@/lib/firebase/analytics';

export default function TrafficTracker() {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Prevent strict-mode double-firing in dev and check session
    if (hasTracked.current) return;
    const sessionFlag = sessionStorage.getItem('oh_session_tracked');
    
    if (!sessionFlag) {
      incrementDailyView();
      sessionStorage.setItem('oh_session_tracked', 'true');
      hasTracked.current = true;
    }
  }, []);

  return null; 
}