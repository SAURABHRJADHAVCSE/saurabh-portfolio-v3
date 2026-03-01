/**
 * Next.js 16 Proxy for Route Protection
 * Replaces middleware.ts - handles authentication checks before pages render
 * Updated to follow Next.js 16 conventions
 */

import { NextRequest, NextResponse } from 'next/server';

// Define route groups - Next.js 16 optimized
const PROTECTED_ROUTES = [
  '/profile',
  '/delete-account',
  '/change-password',
  '/ai-test',
] as const;

const AUTH_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
] as const;

// Constants for better performance
const LOGIN_URL = '/login';
const DEFAULT_REDIRECT = '/profile';

/**
 * Sanitise the ?redirect= parameter to prevent open-redirect attacks.
 *
 * Only relative paths that begin with a single '/' are allowed.
 * Protocol-relative URLs (//evil.com), absolute URLs, and empty values
 * all fall back to the DEFAULT_REDIRECT.
 */
function sanitizeRedirect(redirect: string | null): string {
  if (!redirect) return DEFAULT_REDIRECT;
  // Must start with '/' but NOT with '//' (protocol-relative URL)
  if (redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect;
  }
  return DEFAULT_REDIRECT;
}

/**
 * Check if user is authenticated based on cookies.
 * Supports both __Host-firebaseAuthToken (production) and firebaseAuthToken (dev).
 * Performs a lightweight JWT structure + expiry check (no crypto needed at
 * the edge). Full cryptographic verification happens server-side via
 * Firebase Admin SDK in getCurrentUser().
 */
function isAuthenticated(request: NextRequest): boolean {
  // Check both cookie names (__Host- prefix used in production)
  const authToken =
    request.cookies.get('__Host-firebaseAuthToken') ??
    request.cookies.get('firebaseAuthToken');
  if (!authToken?.value) return false;

  try {
    const parts = authToken.value.split('.');
    if (parts.length !== 3) return false;

    // Decode JWT payload (base64url → JSON) and check expiry
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
      return false; // Session cookie expired
    }
    return true;
  } catch {
    return false; // Malformed cookie
  }
}

/**
 * Check if the path starts with any of the route patterns
 */
function matchesRoutePattern(pathname: string, routes: readonly string[]): boolean {
  return routes.some(route => pathname.startsWith(route));
}

/**
 * Main proxy function - Next.js 16 optimized
 * Renamed from middleware to proxy per Next.js 16 convention
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  
  // Skip proxy for static assets and API routes (redundant with matcher but faster)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  const isUserAuthenticated = isAuthenticated(request);
  const isProtectedRoute = matchesRoutePattern(pathname, PROTECTED_ROUTES);
  const isAuthRoute = matchesRoutePattern(pathname, AUTH_ROUTES);
  
  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !isUserAuthenticated) {
    const loginUrl = new URL(LOGIN_URL, request.url);
    loginUrl.searchParams.set('redirect', pathname + search);
    loginUrl.searchParams.set('message', 'Please sign in to continue');
    
    return NextResponse.redirect(loginUrl);
  }
  
  // Redirect authenticated users from auth routes to profile
  if (isAuthRoute && isUserAuthenticated) {
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const safePath = sanitizeRedirect(redirectParam);
    const redirectUrl = new URL(safePath, request.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Continue to the requested page
  return NextResponse.next();
}

/**
 * Next.js 16 Proxy Config
 * Optimized matcher for better performance
 *
 * REGEX NOTES — The pattern below is a negative-lookahead (?!...) that excludes
 * static assets, API routes, and framework resources from proxying.
 *
 * Escaping rules for this string-based regex:
 *   - Literal dots must be escaped: \\. (double-backslash because it's in a string)
 *   - | separates alternatives inside the lookahead
 *   - The final segment .*\\.(ext|ext) catches any file with a static extension
 *
 * If you add new paths to exclude, escape dots properly and test with
 * `new RegExp(pattern)` in a Node REPL.
 */
export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|_next/webpack-hmr|favicon\\.ico|icon|apple-icon|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)).*)',
  ],
};
