import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 1. Grab the cookies we set in the API route
  const authToken = request.cookies.get('AuthToken')?.value;
  const userRole = request.cookies.get('UserRole')?.value?.toUpperCase();
  const path = request.nextUrl.pathname;

  // 2. If they are NOT logged in, kick them out of protected routes
  if (!authToken) {
    if (path.startsWith('/admin') || path.startsWith('/outfitter') || path.startsWith('/hunter')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // 3. ROLE-BASED ROUTING (They are logged in)
  
  // Prevent logged-in users from seeing the login page
  if (path.startsWith('/login') || path.startsWith('/signup')) {
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') return NextResponse.redirect(new URL('/admin', request.url));
    if (userRole === 'OUTFITTER') return NextResponse.redirect(new URL('/outfitter/dashboard', request.url));
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Admin Route Protection
  if (path.startsWith('/admin')) {
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Outfitter Route Protection
  if (path.startsWith('/outfitter')) {
    if (userRole !== 'OUTFITTER' && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Hunter Dashboard Protection (Optional, assuming Hunters have a dashboard)
  if (path.startsWith('/hunter')) {
    if (userRole !== 'HUNTER' && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// Ensure the middleware only runs on specific paths to save server costs
export const config = {
  matcher: [
    '/admin/:path*',
    '/outfitter/:path*',
    '/hunter/:path*',
    '/login',
    '/signup'
  ]
};