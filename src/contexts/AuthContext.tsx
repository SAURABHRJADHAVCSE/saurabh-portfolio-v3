/**
 * Authentication Context Provider
 * Manages global authentication state using Firebase Auth
 */

'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook to access authentication context
 * Must be used within AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 * Wraps app to provide real-time auth state
 */
/** How often to proactively refresh the session cookie (4 hours — session cookies last 5 days) */
const TOKEN_REFRESH_INTERVAL_MS = 4 * 60 * 60 * 1000;

/**
 * Read the CSRF double-submit cookie value.
 * Returns null if not yet set (GET /api/auth/session will issue one).
 */
function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match?.[1] ?? null;
}

/**
 * Ensure a CSRF token cookie exists by calling GET /api/auth/session.
 * Subsequent calls are no-ops if the cookie is already present.
 */
async function ensureCsrfToken(): Promise<string | null> {
  if (getCsrfToken()) return getCsrfToken();
  try {
    await fetch('/api/auth/session', { method: 'GET' });
  } catch { /* ignore */ }
  return getCsrfToken();
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Tracks whether we've ever seen a logged-in user this session.
   *  Prevents a pointless DELETE on initial load when nobody is signed in. */
  const hadUserRef = useRef(false);

  /**
   * Sync the Firebase ID token to the server-side httpOnly session cookie.
   * Returns true if the session is good, false if the user was signed out
   * (e.g. Admin SDK rejected the token) — caller must NOT call setLoading(false)
   * in that case because onAuthStateChanged(null) is already in flight.
   */
  const syncSession = useCallback(async (firebaseUser: User | null): Promise<boolean> => {
    try {
      const csrfToken = await ensureCsrfToken();
      const csrfHeaders: Record<string, string> = csrfToken
        ? { 'x-csrf-token': csrfToken }
        : {};

      if (firebaseUser) {
        const token = await firebaseUser.getIdToken(/* forceRefresh */ true);
        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...csrfHeaders },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          await signOut(auth);
          return false;
        }
        hadUserRef.current = true;
        return true;
      } else {
        // Only call DELETE if we previously had a session, otherwise it's
        // a no-op initial load with nobody signed in.
        if (hadUserRef.current) {
          hadUserRef.current = false;
          await fetch('/api/auth/session', { method: 'DELETE', headers: csrfHeaders });
        }
        return true;
      }
    } catch {
      // Network error — assume session is ok, let next interval retry.
      return true;
    }
  }, []);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // syncSession FIRST — cookie must be written before loading clears
      // and user state is set. setUser is deferred until AFTER the session
      // is confirmed, preventing isAuthenticated from briefly being true
      // while the server-side cookie doesn’t exist yet.
      if (firebaseUser) {
        const ok = await syncSession(firebaseUser);
        if (!ok) return;
      } else {
        await syncSession(null);
      }

      setUser(firebaseUser);
      setLoading(false);

      // Clear any previous refresh timer
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }

      // Set up proactive token refresh while logged in
      if (firebaseUser) {
        refreshTimerRef.current = setInterval(async () => {
          try {
            const freshToken = await firebaseUser.getIdToken(/* forceRefresh */ true);
            const csrf = getCsrfToken();
            await fetch('/api/auth/session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(csrf ? { 'x-csrf-token': csrf } : {}),
              },
              body: JSON.stringify({ token: freshToken }),
            });
          } catch {
            // Retry on next interval
          }
        }, TOKEN_REFRESH_INTERVAL_MS);
      }
    });

    return () => {
      unsubscribe();
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [syncSession]);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
