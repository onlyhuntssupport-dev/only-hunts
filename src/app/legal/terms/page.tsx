export const metadata = {
    title: 'Terms of Service | Only-Hunts',
  };
  
  export default function TermsPage() {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-black text-olive dark:text-off-white">Terms of Service</h1>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-sm text-muted-foreground mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-900/20">
            <h2 className="mt-0 text-xl font-bold text-amber-800 dark:text-amber-500">Legal Placeholder</h2>
            <p className="mb-0 text-amber-700 dark:text-amber-400">
              This document is currently pending review by our legal counsel. The official Terms of Service, including the Assumption of Risk clauses for hunting activities, will be published here prior to the platform's public launch.
            </p>
          </div>
        </div>
      </div>
    );
  }