import AuthForm from '@/components/auth/AuthForm';

export const metadata = {
  title: 'Login or Sign Up | OnlyHunts',
  description: 'Sign in to book hunts or manage your outfitter dashboard.',
};

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center mb-4">
        <h1 className="text-4xl font-headline font-bold">Access Your Account</h1>
        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
          Join the premier marketplace connecting hunters with world-class outfitters.
        </p>
      </div>
      <AuthForm />
    </div>
  );
}
