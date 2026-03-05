'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, signInWithGoogle } from '@/lib/firebase/auth';
import { syncUserProfile } from '@/app/actions/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@/types/auth';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('HUNTER');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const user = await signInWithGoogle();
      if (!user) throw new Error('Authentication failed');

      const syncResult = await syncUserProfile({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: isLogin ? 'HUNTER' : role,
      });

      if (!syncResult.success) throw new Error(syncResult.error || 'Profile sync failed');

      if (syncResult.role === 'OUTFITTER') {
        router.push('/outfitter/dashboard');
      } else if (syncResult.role === 'ADMIN') {
        router.push('/admin');
      }
      else {
        router.push('/hunts');
      }
      router.refresh(); 

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsEmailLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const idToken = await user.getIdToken();

      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      
      const tokenResult = await user.getIdTokenResult();
      const role = tokenResult.claims.role;

      toast({ title: "Login Successful", description: "Welcome back!" });

      if (role === 'ADMIN') {
        router.push('/admin');
      } else if (role === 'OUTFITTER') {
        router.push('/outfitter/dashboard');
      } else {
        router.push('/hunts');
      }
      
      router.refresh();

    } catch (err: any) {
      console.error('Login error:', err.code);
      if (['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password'].includes(err.code)) {
         setError('Invalid email or password. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-card border rounded-lg shadow-sm mt-10">
      <div className="flex justify-center space-x-4 mb-6 border-b pb-2">
        <button 
          className={`pb-2 font-medium ${isLogin ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setIsLogin(true)}
        >
          Login
        </button>
        <button 
          className={`pb-2 font-medium ${!isLogin ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setIsLogin(false)}
        >
          Sign Up
        </button>
      </div>

      <h2 className="text-2xl font-bold font-headline mb-2 text-center">
        {isLogin ? 'Welcome Back' : 'Create an Account'}
      </h2>
      
      {!isLogin && (
        <div className="mb-6 mt-4">
          <label className="block text-sm font-medium mb-2">I am a...</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole('HUNTER')}
              className={`p-2 border rounded-md text-sm ${role === 'HUNTER' ? 'bg-primary/10 border-primary font-bold' : 'bg-background hover:bg-muted'}`}
            >
              Hunter
            </button>
            <button
              type="button"
              onClick={() => setRole('OUTFITTER')}
              className={`p-2 border rounded-md text-sm ${role === 'OUTFITTER' ? 'bg-primary/10 border-primary font-bold' : 'bg-background hover:bg-muted'}`}
            >
              Outfitter
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4 mt-4">
        <Button 
          onClick={handleGoogleAuth} 
          disabled={isLoading || isEmailLoading} 
          variant="outline" 
          className="w-full py-6 text-md font-medium flex items-center justify-center gap-2"
        >
          {isLoading ? 'Connecting...' : 'Continue with Google'}
        </Button>
      </div>

      {isLogin && (
        <>
          <div className="my-4 flex items-center before:flex-1 before:border-t before:border-muted after:flex-1 after:border-t after:border-muted">
            <p className="text-center text-sm text-muted-foreground mx-4">OR</p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium sr-only">Email address</label>
              <Input 
                type="email" 
                placeholder="Email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isEmailLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium sr-only">Password</label>
              <Input 
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isEmailLoading}
              />
            </div>

            <Button type="submit" className="w-full py-6" disabled={isEmailLoading || isLoading}>
              {isEmailLoading ? 'Signing in...' : 'Sign in with Email'}
            </Button>
          </form>
        </>
      )}

      {error && <p className="text-destructive text-sm mt-4 text-center">{error}</p>}
    </div>
  );
}
