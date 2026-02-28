/**
 * Rate Limiter — Upstash Redis (all environments)
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  WHY RATE LIMITING?                                                │
 * │                                                                    │
 * │  Rate limiting prevents abuse by capping how many requests a       │
 * │  single client (identified by a key, usually an IP) can make in    │
 * │  a given time window.  Without it, a bad actor can:                │
 * │    • brute-force login credentials                                 │
 * │    • trigger expensive AI/API calls at your cost                   │
 * │    • DDoS your app by flooding it with requests                    │
 * │                                                                    │
 * │  This module provides a single `checkRateLimit()` function that    │
 * │  uses Upstash Redis as a distributed sliding-window rate limiter.  │
 * │  If Upstash env vars are missing, all requests are allowed         │
 * │  (rate limiting is effectively disabled).                          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * HOW IT WORKS — SLIDING WINDOW via Upstash Redis
 * ────────────────────────────────────────────────
 *
 * Upstash is a serverless Redis provider with a REST API.  Because
 * Vercel serverless functions are stateless (each request can be
 * handled by a different instance), we need an external store that
 * every instance can talk to.  Upstash Redis is that store.
 *
 * The *sliding window* algorithm works like this:
 *   - Imagine a 60-second window that "slides" forward with time.
 *   - Each request increments a counter in Redis.
 *   - If the counter exceeds `maxRequests` within the window → blocked.
 *   - The window smoothly advances, so there are no sudden resets.
 *   - Unlike a fixed window, there's no burst at window boundaries.
 *
 * Requires two env vars (server-only, never prefix with NEXT_PUBLIC_):
 *   UPSTASH_REDIS_REST_URL   — your Upstash Redis REST endpoint
 *   UPSTASH_REDIS_REST_TOKEN — your Upstash Redis REST token
 *
 * USAGE
 * ─────
 * ```ts
 * import { checkRateLimit } from '@/lib/rate-limit';
 *
 * // In an API route handler:
 * export async function POST(req: Request) {
 *   const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
 *
 *   // Allow 10 requests per 60 seconds per IP
 *   const { allowed, retryAfterSec } = await checkRateLimit(
 *     `auth:${ip}`,   // unique key — prefix groups related limits
 *     10,             // max requests per window
 *     60_000,         // window duration in milliseconds (60 s)
 *   );
 *
 *   if (!allowed) {
 *     return Response.json(
 *       { error: 'Too many requests' },
 *       {
 *         status: 429,
 *         headers: { 'Retry-After': String(retryAfterSec) },
 *       },
 *     );
 *   }
 *
 *   // … handle request
 * }
 * ```
 *
 * KEY NAMING CONVENTION
 * ─────────────────────
 * Use a `prefix:identifier` format so limits for different features
 * don't collide:
 *   • `auth:${ip}`     — login / signup attempts
 *   • `ai:${userId}`   — AI prompt calls per user
 *   • `api:${ip}`      — general API endpoints
 *
 * Upstash API Key (for reference):
 * 
 *
 * TESTING THE RATE LIMITER
 * ────────────────────────
 *
 * 1. **Set up Upstash env vars** in `.env.local`:
 *      UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
 *      UPSTASH_REDIS_REST_TOKEN=AX...your-token
 *
 * 2. **Start the dev server**: `npm run dev`
 *
 * 3. **Spam the rate-limited endpoint** using curl or a browser.
 *    The session API (`/api/auth/session`) uses `checkRateLimit`
 *    with a limit of 15 requests per 60 seconds:
 *
 *    ```bash
 *    # PowerShell — hit POST /api/auth/session 20 times rapidly:
 *    1..20 | ForEach-Object {
 *      $r = Invoke-WebRequest -Uri http://localhost:3000/api/auth/session `
 *        -Method POST -ContentType 'application/json' -Body '{}'
 *      Write-Host "Request $_: Status $($r.StatusCode)"
 *    }
 *    ```
 *
 *    After 15 requests you should get `429 Too Many Requests` with a
 *    `Retry-After` header indicating how many seconds to wait.
 *
 * 4. **Verify in Upstash dashboard**: Go to https://console.upstash.com,
 *    open your database, and check the rate-limit analytics to see the
 *    blocked vs allowed request counts.
 *
 * 5. **Without Upstash env vars**: If the env vars are missing,
 *    `checkRateLimit` returns `{ allowed: true }` for every call
 *    (rate limiting is disabled — no crash, no error).
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  /** Whether the request is allowed (true = under the limit). */
  allowed: boolean;
  /** Seconds the client should wait before retrying. 0 when `allowed` is true. */
  retryAfterSec: number;
  /** How many requests the client has left in the current window. */
  remaining: number;
}

// ─── Upstash Redis ───────────────────────────────────────────────────────────
//
// `upstashReady` is true only when *both* env vars are present.
// When false, `checkRateLimit()` allows all requests (rate limiting disabled).

const upstashReady = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

/**
 * Cache of Ratelimit instances keyed by `${maxRequests}:${windowMs}`.
 *
 * Why cache?  Creating a `Ratelimit` instance sets up internal Lua scripts
 * in Redis.  Re-using instances avoids redundant setup on every request
 * while keeping different rate-limit configurations (e.g. 10/min for auth,
 * 100/min for general API) properly separated.
 */
const limiters = new Map<string, Ratelimit>();

/**
 * Returns (or creates) an Upstash `Ratelimit` instance for the given config.
 *
 * Under the hood:
 * 1. `Redis.fromEnv()` reads `UPSTASH_REDIS_REST_URL` and
 *    `UPSTASH_REDIS_REST_TOKEN` to create a REST-based Redis client.
 * 2. `Ratelimit.slidingWindow(maxRequests, windowStr)` configures the
 *    sliding-window algorithm described above.
 * 3. `analytics: true` enables the Upstash rate-limit analytics dashboard
 *    at https://console.upstash.com (optional — safe to disable).
 */
function getLimiter(maxRequests: number, windowMs: number): Ratelimit {
  const cacheKey = `${maxRequests}:${windowMs}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs} ms`),
      analytics: true,
      prefix: 'ratelimit',
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Check (and increment) the rate-limit counter for a given key.
 *
 * Uses Upstash Redis sliding-window when configured.
 * If Upstash env vars are missing, all requests are allowed (no-op).
 *
 * @param key         - Unique identifier (e.g. `auth:192.168.1.1`)
 * @param maxRequests - Maximum requests allowed within the window
 * @param windowMs    - Window duration in milliseconds (e.g. `60_000` = 1 minute)
 * @returns           - `{ allowed, retryAfterSec, remaining }`
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<RateLimitResult> {
  // Upstash not configured → allow everything (rate limiting disabled)
  if (!upstashReady) {
    return { allowed: true, retryAfterSec: 0, remaining: maxRequests };
  }

  const limiter = getLimiter(maxRequests, windowMs);
  const { success, remaining, reset } = await limiter.limit(key);
  return {
    allowed: success,
    retryAfterSec: success ? 0 : Math.ceil((reset - Date.now()) / 1000),
    remaining,
  };
}
