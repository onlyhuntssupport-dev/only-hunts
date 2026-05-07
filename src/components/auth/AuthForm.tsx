'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/auth';
import { syncUserProfile } from '@/app/actions/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Target, Compass, ShieldCheck, ArrowRight, Eye, EyeOff } from "lucide-react";
import type { UserRole } from '@/types/auth';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('HUNTER');
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [error, setError] = useState('');
  
  // SYNCHRONOUS GUARD: Blocks double-submissions before React state updates
  const isSubmittingRef = useRef(false);
  
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Instantly kill duplicate events
    if (isSubmittingRef.current) return;
    
    isSubmittingRef.current = true;
    setError('');
    setIsEmailLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      const syncResult = await syncUserProfile({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
      } as any);

      if (!syncResult.success) throw new Error(syncResult.error || 'Failed to retrieve profile data.');

      const idToken = await user.getIdToken();
      const sessionResponse = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to establish secure session.');
      }
      
      toast({ title: "Login Successful", description: "Welcome back!" });

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
      
    } catch (err: any) {
      console.error("FULL LOGIN ERROR:", err); 
      
      if (['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password'].includes(err.code)) {
         setError('Invalid email or password. Please try again.');
      } else {
        setError(`Error: ${err.message || 'An unexpected error occurred.'}`); 
      }
    } finally {
      isSubmittingRef.current = false;
      setIsEmailLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Instantly kill duplicate events
    if (isSubmittingRef.current) return;
    
    setError('');

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters long.");
    }

    isSubmittingRef.current = true;
    setIsEmailLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      const syncResult = await syncUserProfile({
        uid: user.uid,
        email: user.email,
        displayName: name,
        photoURL: null,
        role: "HUNTER", 
        termsAccepted: termsAccepted,
        termsAcceptedAt: new Date().toISOString(),
        termsVersion: "1.0",
      });

      if (!syncResult.success) throw new Error(syncResult.error || 'Profile sync failed');

      const idToken = await user.getIdToken();
      const sessionResponse = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to establish secure session.');
      }

      toast({ title: "Account Created", description: "Welcome to Only-Hunts!" });
      
      router.push('/hunter/dashboard');
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Try logging in.");
      } else {
        setError(err.message || 'An error occurred during sign up.');
      }
    } finally {
      isSubmittingRef.current = false;
      setIsEmailLoading(false);
    }
  };

  const isSignUpDisabled = !isLogin && !termsAccepted && role === 'HUNTER';

  return (
    <div className="w-full max-w-md mx-auto p-6 relative">
      
      <div className="flex justify-center space-x-4 mb-6 border-b border-kalahari/20 dark:border-kalahari/30 pb-2">
        <button 
          type="button"
          suppressHydrationWarning
          className={`pb-2 font-bold text-lg transition-colors ${isLogin ? 'border-b-4 border-kalahari text-olive dark:text-off-white' : 'text-olive/50 dark:text-off-white/50 hover:text-olive dark:hover:text-off-white'}`}
          onClick={() => { setIsLogin(true); setError(''); }}
        >
          Login
        </button>
        <button 
          type="button"
          suppressHydrationWarning
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
        <div className="flex p-1 space-x-1 bg-kalahari/10 dark:bg-black/40 rounded-xl mb-6 transition-colors">
          <button
            type="button"
            suppressHydrationWarning
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
            suppressHydrationWarning
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
      )}

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-800 font-bold text-sm flex items-start gap-3 transition-colors">
          {error}
        </div>
      )}

      {(!isLogin && role === "OUTFITTER") ? (
        <div className="bg-kalahari/5 dark:bg-kalahari/10 border-2 border-kalahari/20 p-6 rounded-2xl text-center mt-4">
          <ShieldCheck className="h-12 w-12 text-kalahari mx-auto mb-4" />
          <h3 className="text-lg font-black text-olive dark:text-white mb-2">Professional Partner Network</h3>
          <p className="text-sm text-olive/70 dark:text-white/70 font-medium mb-6">
            To protect our community, all outfitter accounts require business verification and permit uploads. 
          </p>
          <Button 
            suppressHydrationWarning
            onClick={() => router.push('/outfitter/register')}
            className="w-full bg-olive dark:bg-kalahari text-kalahari dark:text-olive hover:bg-olive/90 dark:hover:bg-kalahari/90 font-black h-14 text-lg shadow-md transition-all rounded-xl"
          >
            Apply as Outfitter <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      ) : (
        <form onSubmit={isLogin ? handleEmailLogin : handleEmailSignUp} className="space-y-4" suppressHydrationWarning>
          
          {!isLogin && (
            <div className="mb-6 bg-kalahari/5 dark:bg-black/40 p-4 rounded-xl border border-kalahari/20 dark:border-kalahari/30">
              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  id="legal-terms"
                  suppressHydrationWarning
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
          )}

          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-olive dark:text-off-white transition-colors">Full Name</label>
              <Input 
                name="name" 
                required 
                suppressHydrationWarning
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="John Doe" 
                className="h-12 border-kalahari/40 dark:border-kalahari/30 focus-visible:ring-olive dark:focus-visible:ring-kalahari font-medium bg-off-white dark:bg-black/50 dark:text-white transition-colors"
                disabled={isEmailLoading || isSignUpDisabled}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-olive dark:text-off-white transition-colors">Email Address</label>
            <Input 
              type="email" 
              suppressHydrationWarning
              placeholder={isLogin ? "user@example.com" : "hunter@example.com"} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 border-kalahari/40 dark:border-kalahari/30 focus-visible:ring-olive dark:focus-visible:ring-kalahari font-medium bg-off-white dark:bg-black/50 dark:text-white transition-colors"
              disabled={isEmailLoading || isSignUpDisabled}
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
            <div className="relative">
              <Input 
                type={showPassword ? "text" : "password"}
                suppressHydrationWarning
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 pr-10 border-kalahari/40 dark:border-kalahari/30 focus-visible:ring-olive dark:focus-visible:ring-kalahari font-medium bg-off-white dark:bg-black/50 dark:text-white transition-colors"
                disabled={isEmailLoading || isSignUpDisabled}
              />
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                disabled={isEmailLoading || isSignUpDisabled}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-olive dark:text-off-white transition-colors">Confirm Password</label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"}
                  suppressHydrationWarning
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12 pr-10 border-kalahari/40 dark:border-kalahari/30 focus-visible:ring-olive dark:focus-visible:ring-kalahari font-medium bg-off-white dark:bg-black/50 dark:text-white transition-colors"
                  disabled={isEmailLoading || isSignUpDisabled}
                />
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                  disabled={isEmailLoading || isSignUpDisabled}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            suppressHydrationWarning
            className="w-full bg-olive dark:bg-kalahari hover:bg-olive/90 dark:hover:bg-kalahari/90 text-kalahari dark:text-olive font-black h-14 text-lg mt-6 shadow-md transition-all rounded-xl" 
            disabled={isEmailLoading || isSignUpDisabled}
          >
            {isEmailLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Hunter Account')}
          </Button>
        </form>
      )}
    </div>
  );
}