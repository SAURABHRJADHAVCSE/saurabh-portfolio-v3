/**
 * API Route: Set/Clear Authentication Session Cookie
 *
 * Security:
 *   - CSRF protection via double-submit cookie + Origin/Referer check
 *   - Token is verified server-side with Firebase Admin SDK before setting cookie
 *   - Session cookie is created with Firebase Admin createSessionCookie()
 *   - server.ts re-verifies the session cookie on every request via getCurrentUser()
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase/admin';
import { AUTH_TOKEN_COOKIE, AUTH_COOKIE_OPTIONS } from '@/lib/auth/server';
import { checkRateLimit } from '@/lib/rate-limit';

/** Session cookie expiry: 5 days (must match AUTH_COOKIE_OPTIONS.maxAge) */
const SESSION_COOKIE_EXPIRY_MS = 5 * 24 * 60 * 60 * 1000;

/** CSRF cookie name — client reads this and sends it back as a header */
const CSRF_COOKIE = 'csrf_token';
/** CSRF header name — must match the cookie value */
const CSRF_HEADER = 'x-csrf-token';

// ─── CSRF Helpers ────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random CSRF token (hex string).
 */
function generateCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate that the request originates from our own site.
 * Checks the Origin header first (preferred), then falls back to Referer.
 * In development, localhost origins are allowed.
 */
function isValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // At least one of the two headers must be present
  const source = origin || (referer ? new URL(referer).origin : null);
  if (!source) return false;

  // In production the origin must match the deployment URL
  const allowedOrigins = new Set<string>();

  if (process.env.NEXT_PUBLIC_APP_URL) {
    allowedOrigins.add(new URL(process.env.NEXT_PUBLIC_APP_URL).origin);
  }

  // Always allow the request's own host (covers Vercel preview deploys, etc.)
  const requestOrigin = new URL(request.url).origin;
  allowedOrigins.add(requestOrigin);

  // Dev convenience
  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.add('http://localhost:3000');
    allowedOrigins.add('http://127.0.0.1:3000');
  }

  return allowedOrigins.has(source);
}

/**
 * Validate the CSRF double-submit token.
 * The cookie value must match the x-csrf-token header value.
 */
function isValidCsrf(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);
  if (!cookieToken || !headerToken) return false;
  // Constant-time comparison is not critical here (tokens are random,
  // not secrets), but we still compare lengths first.
  return cookieToken.length === headerToken.length && cookieToken === headerToken;
}

// ─── GET: Issue CSRF token ───────────────────────────────────────────────────

/**
 * GET /api/auth/session — issues a new CSRF token cookie.
 * The client calls this once on app load, reads the cookie value, and
 * includes it as x-csrf-token on subsequent POST/DELETE requests.
 */
export async function GET() {
  const token = generateCsrfToken();
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: false,       // client JS must read it
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',    // strict prevents CSRF via cross-origin navigation too
    path: '/',
    maxAge: 60 * 60 * 24,  // 1 day
  });
  return NextResponse.json({ ok: true });
}

// ─── POST: Create Session ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting — 15 token-set attempts per minute per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? 'unknown';
    const { allowed, retryAfterSec } = await checkRateLimit(`session:${ip}`, 15, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
      );
    }

    // 2. CSRF checks — origin + double-submit token
    if (!isValidOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!isValidCsrf(request)) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    // 3. Parse body
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    // 3. Verify the token with Firebase Admin SDK
    //    This ensures we never store an untrusted / forged token.
    try {
      await getAdminAuth().verifyIdToken(token, /* checkRevoked */ true);
    } catch (err) {
      // Log the real reason so it appears in the dev terminal.
      // Common causes: FIREBASE_SERVICE_ACCOUNT_KEY not set (GCP ADC timeout),
      // mismatched project, or a genuinely revoked / expired token.
      console.error('[Session] verifyIdToken failed:', err instanceof Error ? err.message : err);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 4. Create a Firebase session cookie from the verified ID token.
    //    Session cookies are long-lived (5 days), support revocation,
    //    and are verified server-side with verifySessionCookie().
    let sessionCookie: string;
    try {
      sessionCookie = await getAdminAuth().createSessionCookie(token, {
        expiresIn: SESSION_COOKIE_EXPIRY_MS,
      });
    } catch (err) {
      console.error('[Session] createSessionCookie failed:', err instanceof Error ? err.message : err);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    const cookieStore = await cookies();
    cookieStore.set(AUTH_TOKEN_COOKIE, sessionCookie, AUTH_COOKIE_OPTIONS);

    return NextResponse.json({ success: true });
  } catch {
    console.warn('[Session] Failed to create session');
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ─── DELETE: Clear Session ───────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting — same budget as POST
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? 'unknown';
    const { allowed, retryAfterSec } = await checkRateLimit(`session-del:${ip}`, 15, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
      );
    }

    // CSRF checks — origin + double-submit token
    if (!isValidOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!isValidCsrf(request)) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    const cookieStore = await cookies();
    cookieStore.delete(AUTH_TOKEN_COOKIE);

    // Clean up legacy userData cookie if it still exists
    cookieStore.delete('userData');

    return NextResponse.json({ success: true });
  } catch {
    console.warn('[Session] Failed to clear session');
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
