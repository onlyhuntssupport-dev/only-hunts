import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
      <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
      <h1 className="text-4xl font-headline font-bold text-destructive">Access Denied</h1>
      <p className="mt-4 text-lg text-muted-foreground max-w-md">
        You do not have the necessary permissions to view this page. Please contact an administrator if you believe this is an error.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Return to Homepage</Link>
      </Button>
    </div>
  );
}
