
'use client';

import { useEffect } from 'react';
import { analytics } from '@/firebase/config';
import { logEvent } from 'firebase/analytics';
import type { Analytics as FirebaseAnalytics } from 'firebase/analytics';

interface AnalyticsEventTrackerProps {
  hunt: {
    id: string;
    title: string;
    province: string;
  }
}

export default function AnalyticsEventTracker({ hunt }: AnalyticsEventTrackerProps) {
  useEffect(() => {
    if (!hunt) return;

    const trackView = async () => {
      const analyticsInstance = await analytics;
      if (analyticsInstance) {
        logEvent(analyticsInstance as FirebaseAnalytics, 'view_item', {
          item_id: hunt.id,
          item_name: hunt.title,
          item_category: hunt.province,
        });
      }
    };

    trackView();
  }, [hunt]);

  return null; // This component doesn't render anything
}
