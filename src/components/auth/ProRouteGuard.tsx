'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, Timestamp } from 'firebase/firestore';

// Exact import from your config file
import { firebaseApp } from '@/firebase/config'; 

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export default function ProRouteGuard({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!firebaseApp || Object.keys(firebaseApp).length === 0) {
      console.warn("Firebase app not initialized. Bypassing guard for safety.");
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const docRef = doc(db, 'outfitters', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const tier = data.tier;
          const subEndsAt = data.subscriptionEndsAt as Timestamp | null;
          const isAdminOverride = data.isAdminOverride;

          const now = new Date();
          const expirationDate = subEndsAt ? subEndsAt.toDate() : null;

          const isPro = tier === 'pro_tier' && expirationDate && expirationDate > now;
          const isFreeTrial = tier === 'free_trial' && expirationDate && expirationDate > now;
          const hasAdminAccess = isAdminOverride === true;

          if (isPro || isFreeTrial || hasAdminAccess) {
            setIsAuthorized(true);
          } else {
            // FIX: Kick unauthorized users directly to the upgrade pitch
            router.push('/outfitter/tiers');
          }
        } else {
          router.push('/outfitter/tiers');
        }
      } catch (error) {
        console.error("Error checking outfitter tier:", error);
        router.push('/outfitter/tiers');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
}