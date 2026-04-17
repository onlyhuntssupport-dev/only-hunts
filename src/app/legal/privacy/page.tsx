export const metadata = {
    title: 'Privacy Policy | Only-Hunts',
  };
  
  export default function PrivacyPage() {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-black text-olive dark:text-off-white">Privacy Policy</h1>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-sm text-muted-foreground mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-900/20">
            <h2 className="mt-0 text-xl font-bold text-amber-800 dark:text-amber-500">Legal Placeholder</h2>
            <p className="mb-0 text-amber-700 dark:text-amber-400">
              This document is currently pending review by our legal counsel. The official Privacy Policy outlining how we collect, store, and protect user and outfitter data will be published here prior to launch.
            </p>
          </div>
        </div>
      </div>
    );
  }