/**
 * Server-Side Authentication Utilities
 *
 * For use in Server Components, Server Actions, and API routes.
 *
 * Security model:
 *   1. Client gets a Firebase ID token from Firebase Auth
 *   2. Client sends it to /api/auth/session
 *   3. Session route verifies the ID token, creates a Firebase session cookie,
 *      and stores it in an httpOnly cookie (lasts 5 days, supports revocation)
 *   4. getCurrentUser() verifies the session cookie on every request
 *      using Firebase Admin SDK — no trust placed on client-supplied data
 *
 * This replaces the previous implementation that trusted an unverified
 * userData JSON cookie (auth bypass vulnerability).
 */

import 'server-only';

import { cookies } from 'next/headers';
import { cache, experimental_taintUniqueValue } from 'react';
import { getAdminAuth } from '@/lib/firebase/admin';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ServerUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

// ─── Cookie Constants ────────────────────────────────────────────────────────

/** Name of the httpOnly cookie that stores the raw Firebase ID token.
 *  Uses __Host- prefix in production to enforce Secure + Path=/ + no Domain,
 *  preventing subdomain attacks. In dev (HTTP), __Host- is not supported.
 */
export const AUTH_TOKEN_COOKIE =
  process.env.NODE_ENV === 'production'
    ? '__Host-firebaseAuthToken'
    : 'firebaseAuthToken';

/** Cookie options shared between set/delete.
 *  Note: __Host- prefix requires secure=true, path='/', and NO domain attribute.
 */
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  // 5 days — matches Firebase session cookie expiry. AuthContext refreshes
  // periodically while the app is open to extend the session.
  maxAge: 5 * 24 * 60 * 60,
  // No `domain` attribute — required by __Host- prefix to prevent subdomain attacks
};

// ─── Token Verification ──────────────────────────────────────────────────────

/**
 * Verify a Firebase session cookie using the Admin SDK.
 * Returns the decoded token claims on success, or null on any failure.
 *
 * The `checkRevoked` flag ensures that if the user signs out on another
 * device, or the token is manually revoked, it is rejected here.
 */
async function verifySessionCookie(token: string): Promise<ServerUser | null> {
  try {
    const decoded = await getAdminAuth().verifySessionCookie(token, /* checkRevoked */ true);

    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      displayName: decoded.name ?? null,
      photoURL: decoded.picture ?? null,
      emailVerified: decoded.email_verified ?? false,
    };
  } catch {
    // Token expired, revoked, malformed, or wrong project — all treated as unauthenticated
    return null;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get the authenticated user for the current request.
 *
 * Uses React `cache()` so multiple calls within the same server render
 * only verify the token ONCE.
 *
 * Returns null if:
 *   - No auth cookie present
 *   - Token is expired / revoked / malformed
 *   - Firebase Admin SDK is not configured
 */
export const getCurrentUser = cache(async (): Promise<ServerUser | null> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    if (!token) {
      return null;
    }

    // Taint the raw token value so React will throw a build-time error if
    // any Server Component accidentally passes it to a Client Component.
    // Requires experimental.taint = true in next.config.ts.
    experimental_taintUniqueValue(
      'Firebase ID token must never be passed to a Client Component.',
      cookieStore,
      token,
    );

    // Cryptographically verify the session cookie with Firebase Admin SDK
    return await verifySessionCookie(token);
  } catch (error) {
    // During build, cookies() throws DYNAMIC_SERVER_USAGE — expected
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      (error as { digest: string }).digest === 'DYNAMIC_SERVER_USAGE'
    ) {
      return null;
    }

    // Sanitized log — never include token value or user PII
    console.warn('[Auth] Token verification failed');
    return null;
  }
});

/**
 * Require authentication — throws if not authenticated.
 * Use in server components / actions that must have a logged-in user.
 */
export async function requireAuth(): Promise<ServerUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Check if the current request is authenticated.
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}
