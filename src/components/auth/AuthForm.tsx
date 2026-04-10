'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, signInWithGoogle, signInWithApple } from '@/lib/firebase/auth';
import { syncUserProfile } from '@/app/actions/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Target, Compass, ShieldCheck } from "lucide-react";
import type { UserRole } from '@/types/auth';

const AppleIcon = () => (
  <svg viewBox="0 0 384 512" fill="currentColor" className="h-5 w-5">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
  </svg>
);

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('HUNTER');
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleProviderAuth = async (provider: 'google' | 'apple') => {
    provider === 'google' ? setIsGoogleLoading(true) : setIsAppleLoading(true);
    setError('');
    
    try {
      const user = provider === 'google' ? await signInWithGoogle() : await signInWithApple();
      if (!user) throw new Error('Authentication failed or was cancelled.');

      const syncPayload: any = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };

      if (!isLogin) {
        syncPayload.role = role;
        syncPayload.termsAccepted = termsAccepted;
        syncPayload.termsAcceptedAt = new Date().toISOString();
        syncPayload.termsVersion = "1.0";
      }

      const syncResult = await syncUserProfile(syncPayload);

      if (!syncResult.success) throw new Error(syncResult.error || 'Profile sync failed');

      // STRICT ROUTING (Updated for SUPER_ADMIN)
      const userRole = syncResult.role?.toUpperCase();

      if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        router.push('/admin');
      } else if (userRole === 'OUTFITTER') {
        router.push('/outfitter/dashboard');
      } else if (userRole === 'HUNTER') {
        router.push('/hunter/dashboard');
      } else {
        router.push('/');
      }
      
      router.refresh(); 

    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError(''); 
        return; 
      }
      console.error("Provider auth error:", err);
      setError(err.message || 'An error occurred during sign in.');
    } finally {
      setIsGoogleLoading(false);
      setIsAppleLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsEmailLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // FIX: Added 'as any' to bypass the strict role requirement during login
      const syncResult = await syncUserProfile({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
      } as any);

      if (!syncResult.success) throw new Error(syncResult.error || 'Failed to retrieve profile data.');

      const idToken = await user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      
      toast({ title: "Login Successful", description: "Welcome back!" });

      // STRICT ROUTING (Updated for SUPER_ADMIN)
      const userRole = syncResult.role?.toUpperCase();

      if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        router.push('/admin');
      } else if (userRole === 'OUTFITTER') {
        router.push('/outfitter/dashboard');
      } else if (userRole === 'HUNTER') {
        router.push('/hunter/dashboard');
      } else {
        router.push('/'); 
      }
      
      router.refresh();
    } catch (err: any) {
      if (['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password'].includes(err.code)) {
         setError('Invalid email or password. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters long.");
    }

    setIsEmailLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const syncResult = await syncUserProfile({
        uid: user.uid,
        email: user.email,
        displayName: name,
        photoURL: null,
        role: role,
        termsAccepted: termsAccepted,
        termsAcceptedAt: new Date().toISOString(),
        termsVersion: "1.0",
      });

      if (!syncResult.success) throw new Error(syncResult.error || 'Profile sync failed');

      const idToken = await user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      toast({ title: "Account Created", description: "Welcome to Only-Hunts!" });

      // STRICT ROUTING (Updated for SUPER_ADMIN)
      const userRole = syncResult.role?.toUpperCase();

      if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        router.push('/admin');
      } else if (userRole === 'OUTFITTER') {
        router.push('/outfitter/dashboard');
      } else if (userRole === 'HUNTER') {
        router.push('/hunter/dashboard');
      } else {
        router.push('/');
      }
      
      router.refresh();
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Try logging in.");
      } else {
        setError(err.message || 'An error occurred during sign up.');
      }
    } finally {
      setIsEmailLoading(false);
    }
  };

  const isAnyLoading = isGoogleLoading || isAppleLoading || isEmailLoading;
  const isSignUpDisabled = !isLogin && !termsAccepted;

  return (
    <div className="w-full max-w-md mx-auto p-6 relative" suppressHydrationWarning>
      
      <div className="flex justify-center space-x-4 mb-6 border-b border-kalahari/20 dark:border-kalahari/30 pb-2">
        <button 
          type="button"
          className={`pb-2 font-bold text-lg transition-colors ${isLogin ? 'border-b-4 border-kalahari text-olive dark:text-off-white' : 'text-olive/50 dark:text-off-white/50 hover:text-olive dark:hover:text-off-white'}`}
          onClick={() => { setIsLogin(true); setError(''); }}
        >
          Login
        </button>
        <button 
          type="button"
          className={`pb-2 font-bold text-lg transition-colors ${!isLogin ? 'border-b-4 border-kalahari text-olive dark:text-off-white' : 'text-olive/50 dark:text-off-white/50 hover:text-olive dark:hover:text-off-white'}`}
          onClick={() => { setIsLogin(false); setError(''); }}
        >
          Sign Up
        </button>
      </div>

      <h2 className="text-2xl font-black font-headline mb-4 text-center text-olive dark:text-off-white">
        {isLogin ? 'Welcome Back' : 'Join Only-Hunts'}
      </h2>
      
      {!isLogin && (
        <>
          <div className="flex p-1 space-x-1 bg-kalahari/10 dark:bg-black/40 rounded-xl mb-6 transition-colors">
            <button
              type="button"
              onClick={() => setRole('HUNTER')}
              className={`w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${
                role === 'HUNTER' 
                  ? "bg-white dark:bg-olive text-olive dark:text-off-white shadow-sm border border-kalahari/20 dark:border-kalahari/40" 
                  : "text-olive dark:text-off-white/60 hover:text-olive dark:hover:text-off-white hover:bg-white/50 dark:hover:bg-white/5"
              }`}
            >
              <Target className="h-4 w-4" /> Hunter
            </button>
            <button
              type="button"
              onClick={() => setRole('OUTFITTER')}
              className={`w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${
                role === 'OUTFITTER' 
                  ? "bg-white dark:bg-olive text-olive dark:text-off-white shadow-sm border border-kalahari/20 dark:border-kalahari/40" 
                  : "text-olive dark:text-off-white/60 hover:text-olive dark:hover:text-off-white hover:bg-white/50 dark:hover:bg-white/5"
              }`}
            >
              <Compass className="h-4 w-4" /> Outfitter
            </button>
          </div>

          <div className="mb-6 bg-kalahari/5 dark:bg-black/40 p-4 rounded-xl border border-kalahari/20 dark:border-kalahari/30">
            <div className="flex items-start gap-3">
              <input 
                type="checkbox" 
                id="legal-terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
              />
              <div className="text-sm text-olive dark:text-off-white/80 leading-relaxed font-medium">
                <label htmlFor="legal-terms" className="cursor-pointer">
                  I have read and agree to the Only-Hunts{' '}
                </label>
                <Link href="/legal" target="_blank" className="text-kalahari hover:text-kalahari/80 font-bold transition-colors">
                  Terms of Service
                </Link>
                ,{' '}
                <Link href="/legal" target="_blank" className="text-kalahari hover:text-kalahari/80 font-bold transition-colors">
                  Privacy Policy
                </Link>
                , and Assumption of Risk.
              </div>
            </div>
          </div>
        </>
      )}

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-800 font-bold text-sm flex items-start gap-3 transition-colors">
          {error}
        </div>
      )}

      <div className="space-y-3 mb-6">
        <Button 
          type="button"
          onClick={() => handleProviderAuth('google')} 
          disabled={isAnyLoading || isSignUpDisabled} 
          className={`w-full py-6 text-md font-bold flex items-center justify-center gap-2 bg-white dark:bg-white hover:bg-gray-50 dark:hover:bg-gray-100 text-black dark:text-black border border-gray-200 shadow-sm transition-colors ${isSignUpDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </Button>

        <Button 
          type="button"
          onClick={() => handleProviderAuth('apple')} 
          disabled={isAnyLoading || isSignUpDisabled} 
          className={`w-full py-6 text-md font-bold flex items-center justify-center gap-2 bg-black hover:bg-black/80 text-white dark:bg-white dark:hover:bg-white/80 dark:text-black shadow-sm transition-colors ${isSignUpDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <AppleIcon /> Continue with Apple
        </Button>
      </div>

      <div className="my-6 flex items-center before:flex-1 before:border-t before:border-kalahari/20 dark:before:border-kalahari/30 after:flex-1 after:border-t after:border-kalahari/20 dark:after:border-kalahari/30">
        <p className="text-center text-sm font-bold text-olive dark:text-off-white/60 mx-4">OR EMAIL</p>
      </div>

      <form onSubmit={isLogin ? handleEmailLogin : handleEmailSignUp} className="space-y-4">
        
        {!isLogin && (
          <div className="space-y-2">
            <label className="text-sm font-bold text-olive dark:text-off-white transition-colors">
              {role === "HUNTER" ? "Full Name" : "Company / Outfitter Name"}
            </label>
            <Input 
              name="name" 
              required 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder={role === "HUNTER" ? "John Doe" : "Safari Adventures LLC"} 
              className="h-12 border-kalahari/40 dark:border-kalahari/30 focus-visible:ring-olive dark:focus-visible:ring-kalahari font-medium bg-off-white dark:bg-black/50 dark:text-white transition-colors"
              disabled={isAnyLoading || isSignUpDisabled}
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-bold text-olive dark:text-off-white transition-colors">Email Address</label>
          <Input 
            type="email" 
            placeholder="hunter@example.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 border-kalahari/40 dark:border-kalahari/30 focus-visible:ring-olive dark:focus-visible:ring-kalahari font-medium bg-off-white dark:bg-black/50 dark:text-white transition-colors"
            disabled={isAnyLoading || isSignUpDisabled}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-bold text-olive dark:text-off-white transition-colors">Password</label>
            {isLogin && (
              <a href="#" className="text-sm font-bold text-kalahari hover:text-kalahari/80 transition-colors">
                Forgot password?
              </a>
            )}
          </div>
          <Input 
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-12 border-kalahari/40 dark:border-kalahari/30 focus-visible:ring-olive dark:focus-visible:ring-kalahari font-medium bg-off-white dark:bg-black/50 dark:text-white transition-colors"
            disabled={isAnyLoading || isSignUpDisabled}
          />
        </div>

        {!isLogin && (
          <div className="space-y-2">
            <label className="text-sm font-bold text-olive dark:text-off-white transition-colors">Confirm Password</label>
            <Input 
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-12 border-kalahari/40 dark:border-kalahari/30 focus-visible:ring-olive dark:focus-visible:ring-kalahari font-medium bg-off-white dark:bg-black/50 dark:text-white transition-colors"
              disabled={isAnyLoading || isSignUpDisabled}
            />
          </div>
        )}

        {!isLogin && role === "OUTFITTER" && (
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800 flex gap-3 mt-4 transition-colors">
            <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-amber-800 dark:text-amber-400 leading-relaxed">
              Outfitter accounts require manual verification by our admin team before you can publish hunts to the marketplace.
            </p>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full bg-olive dark:bg-kalahari hover:bg-olive/90 dark:hover:bg-kalahari/90 text-kalahari dark:text-olive font-black h-14 text-lg mt-6 shadow-md transition-all rounded-xl" 
          disabled={isAnyLoading || isSignUpDisabled}
        >
          {isEmailLoading ? 'Processing...' : (isLogin ? 'Sign In' : `Create ${role === 'HUNTER' ? 'Hunter' : 'Outfitter'} Account`)}
        </Button>
      </form>

    </div>
  );
}