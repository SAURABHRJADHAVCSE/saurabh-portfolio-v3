/**
 * Rate Limiter — Upstash Redis (production) / In-Memory (development)
 *
 * On Vercel, uses @upstash/ratelimit + @upstash/redis for a distributed
 * sliding-window rate limiter that survives cold starts and works across
 * all serverless instances.
 *
 * Falls back to an in-memory fixed-window limiter when the UPSTASH env
 * vars are not set (local development).
 *
 * Usage:
 * ```ts
 * const { allowed, retryAfterSec } = await checkRateLimit(`auth:${ip}`, 10, 60_000);
 * if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 * ```
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  /** Whether the request is allowed. */
  allowed: boolean;
  /** Seconds until the rate limit window resets. 0 when allowed. */
  retryAfterSec: number;
  /** Remaining allowed requests in the current window. */
  remaining: number;
}

// ─── Upstash (production) ────────────────────────────────────────────────────

const useUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

/**
 * Cache of Ratelimit instances keyed by `${maxRequests}:${windowMs}` so we
 * don't create a new one on every call.
 */
const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(maxRequests: number, windowMs: number): Ratelimit {
  const cacheKey = `${maxRequests}:${windowMs}`;
  let limiter = upstashLimiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs} ms`),
      analytics: true,
      prefix: 'ratelimit',
    });
    upstashLimiters.set(cacheKey, limiter);
  }
  return limiter;
}

// ─── In-Memory fallback (development) ────────────────────────────────────────

interface MemoryEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();

// Periodically evict expired entries (dev only)
if (!useUpstash && typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore.entries()) {
      if (now >= entry.resetAt) memoryStore.delete(key);
    }
  }, 5 * 60 * 1000);
}

function checkMemory(key: string, maxRequests: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now >= entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0, remaining: maxRequests - 1 };
  }
  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000), remaining: 0 };
  }
  entry.count += 1;
  return { allowed: true, retryAfterSec: 0, remaining: maxRequests - entry.count };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Check and increment the rate limit counter for a given key.
 *
 * @param key         - Unique key (e.g. `auth:${ip}`)
 * @param maxRequests - Max requests allowed per window
 * @param windowMs    - Window duration in milliseconds
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<RateLimitResult> {
  if (useUpstash) {
    const limiter = getUpstashLimiter(maxRequests, windowMs);
    const { success, remaining, reset } = await limiter.limit(key);
    return {
      allowed: success,
      retryAfterSec: success ? 0 : Math.ceil((reset - Date.now()) / 1000),
      remaining,
    };
  }
  return checkMemory(key, maxRequests, windowMs);
}
