'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { setUserRole } from '@/app/actions/auth';
import { useUser } from '@/firebase';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'HUNTER' | 'OUTFITTER'>('HUNTER');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError('');
    
    const user = await signInWithGoogle();
    
    if (user) {
      if (!isLogin) {
        // If it's a new sign-up, set their role based on the selection
        const roleResult = await setUserRole(user.uid, role);
        if (!roleResult.success) {
            setError(roleResult.error || 'Could not set user role.');
            setIsLoading(false);
            return;
        }
      }
      // Redirect after login/signup
      router.push('/hunts');
      router.refresh();
    } else {
      setError('Failed to authenticate with Google. Please try again.');
      setIsLoading(false);
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
              className={`p-2 border rounded-md text-sm ${role === 'HUNTER' ? 'bg-primary/10 border-primary font-bold' : 'bg-background'}`}
            >
              Hunter
            </button>
            <button
              type="button"
              onClick={() => setRole('OUTFITTER')}
              className={`p-2 border rounded-md text-sm ${role === 'OUTFITTER' ? 'bg-primary/10 border-primary font-bold' : 'bg-background'}`}
            >
              Outfitter
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-destructive text-sm mb-4 text-center">{error}</p>}

      <div className="space-y-4 mt-4">
        <Button 
          onClick={handleGoogleAuth} 
          disabled={isLoading} 
          variant="outline" 
          className="w-full py-6 text-md font-medium flex items-center justify-center gap-2"
        >
          {isLoading ? 'Connecting...' : 'Continue with Google'}
        </Button>
      </div>
    </div>
  );
}
