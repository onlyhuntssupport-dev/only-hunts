import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('__session')?.value;

  // Simple route protection logic
  if (!session && request.nextUrl.pathname.startsWith('/outfitter/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (!session && request.nextUrl.pathname.startsWith('/profile')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/outfitter/dashboard/:path*', '/profile/:path*'],
};
