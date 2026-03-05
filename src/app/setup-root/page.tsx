'use client';

import { useState } from 'react';
import { seedMasterAdmin } from '@/app/actions/adminSetup';
import { Button } from '@/components/ui/button';

export default function PublicSetupPage() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    setStatus('Creating master admin account...');
    
    const res = await seedMasterAdmin();
    
    if (res.success) {
      setStatus('✅ Admin created successfully! You can now delete this file and go to /login.');
    } else {
      setStatus('❌ Error: ' + res.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 border rounded-xl shadow-sm text-center bg-card">
        <h1 className="text-2xl font-bold mb-4">Master Admin Setup</h1>
        <p className="text-muted-foreground mb-8">
          Initial Root Account Creation for KrisMason.
        </p>
        <Button onClick={handleSeed} disabled={loading} className="w-full text-md py-6">
          {loading ? 'Processing...' : 'Initialize Admin'}
        </Button>
        {status && (
          <div className="mt-6 p-4 bg-muted rounded-lg text-sm font-medium">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
