
'use client';

import { useEffect, useRef } from 'react';
import { logEvent } from 'firebase/analytics';
import { analytics } from '@/firebase/config';
import type { Analytics as FirebaseAnalytics } from 'firebase/analytics';

interface AnalyticsTrackerProps {
  huntId: string;
}

export default function AnalyticsTracker({ huntId }: AnalyticsTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current && huntId) {
      const trackView = async () => {
        const analyticsInstance = await analytics;
        if (analyticsInstance) {
          logEvent(analyticsInstance as FirebaseAnalytics, 'view_item', {
            item_id: huntId,
            item_category: 'hunt',
          });
        }
      };
      
      trackView();
      hasTracked.current = true;
    }
  }, [huntId]);

  return null;
}
