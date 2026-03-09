
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;

  // If no session cookie, redirect to login page.
  // The matcher ensures this only runs on protected routes.
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/hunter/dashboard/:path*', 
    '/outfitter/dashboard/:path*', 
    '/admin/:path*',
    '/profile/:path*'
  ],
};
