import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-olive text-off-white px-4 text-center">
      <h2 className="text-5xl md:text-7xl font-black font-headline mb-4 text-orange-500 drop-shadow-lg">404</h2>
      <p className="text-lg md:text-xl text-kalahari font-bold uppercase tracking-widest mb-8">
        The trail goes cold here. This page doesn't exist.
      </p>
      <Link 
        href="/" 
        className="bg-orange-500 hover:bg-orange-600 text-white font-black text-sm px-8 py-3 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center border-2 border-orange-400"
      >
        Return to Basecamp
      </Link>
    </div>
  );
}