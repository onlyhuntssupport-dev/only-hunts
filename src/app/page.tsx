import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-4xl font-bold tracking-tight">KM Hunts Platform</h1>
        <p className="text-gray-500 text-lg dark:text-gray-400">
          Secure administration and outfitter management gateway.
        </p>
        <div className="pt-4">
          <Link 
            href="/login" 
            className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Enter Portal
          </Link>
        </div>
      </div>
    </main>
  );
}