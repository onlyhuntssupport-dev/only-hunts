'use client';

import { useState } from 'react';
import { seedMasterAdmin } from '@/app/actions/adminSetup';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setResult(null);
    const response = await seedMasterAdmin();
    if (response.success) {
      setResult({ success: true, message: response.message || 'Success!' });
    } else {
      setResult({ success: false, message: response.error || 'An unknown error occurred.' });
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Master Admin Setup</CardTitle>
          <CardDescription>
            This is a one-time action to create the first administrative user in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the button below to create or verify the master admin account with the credentials specified in the server action.
            </p>
            <Button onClick={handleSeed} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding...
                </>
              ) : (
                'Seed Master Admin Account'
              )}
            </Button>
            {result && (
              <div className={`mt-4 p-4 rounded-md text-sm ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <div className="flex items-start gap-3">
                    {result.success ? <ShieldCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                    <div className="flex-1">
                        <p className="font-bold">{result.success ? 'Success' : 'Error'}</p>
                        <p className="mt-1">{result.message}</p>
                    </div>
                </div>
              </div>
            )}
             <p className="text-xs text-muted-foreground pt-4 border-t">
              This page should be deleted or protected after the initial setup is complete.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
