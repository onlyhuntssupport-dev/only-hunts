export const metadata = {
    title: 'PAIA Manual | Only-Hunts',
  };
  
  export default function PaiaPage() {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-black text-olive dark:text-off-white">PAIA Manual</h1>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-sm text-muted-foreground mb-8">Prepared in accordance with section 51 of the Promotion of Access to Information Act, No. 2 of 2000.</p>
          
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-900/20">
            <h2 className="mt-0 text-xl font-bold text-amber-800 dark:text-amber-500">Legal Placeholder</h2>
            <p className="mb-0 text-amber-700 dark:text-amber-400">
              This manual is currently being drafted. The complete PAIA manual for Only-Hunts (Pty) Ltd will be available here shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }