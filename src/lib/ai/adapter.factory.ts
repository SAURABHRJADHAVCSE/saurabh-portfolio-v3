/**
 * AI Adapter - Factory (Singleton-cached)
 *
 * Creates the correct adapter instance based on the provider config.
 * This is the ONLY place that imports concrete adapters.
 * The rest of the app imports from the barrel `@/lib/ai` and uses the interface.
 *
 * SINGLETON CACHING
 * ─────────────────
 * Adapters are cached by `provider:apiKey` so that rate limiter and circuit
 * breaker state persists across requests within the same serverless cold-start.
 * Without caching, every request would create a fresh adapter — resetting
 * the in-memory rate limiter window and circuit breaker failure count.
 *
 * In serverless (Vercel), a cold start resets the cache, which is fine —
 * the circuit breaker and rate limiter gracefully restart from zero.
 */

import type { IAIAdapter } from './adapter.interface';
import type { AIProvider, AIProviderConfig } from './types';
import { GeminiAdapter } from './adapters/gemini.adapter';
import { KieAIAdapter } from './adapters/kieai.adapter';

/** Registry of adapter constructors keyed by provider name */
const ADAPTER_REGISTRY: Record<AIProvider, new (config: AIProviderConfig) => IAIAdapter> = {
  gemini: GeminiAdapter,
  kieai: KieAIAdapter,
};

/**
 * Module-level cache of adapter singletons.
 * Key: `${provider}:${apiKey}` — ensures different API keys get separate instances.
 */
const adapterCache = new Map<string, IAIAdapter>();

/**
 * Build the cache key from a config.
 * Uses provider + apiKey so switching keys (e.g. test vs prod) gets a fresh adapter.
 */
function cacheKey(config: AIProviderConfig): string {
  return `${config.provider}:${config.apiKey}`;
}

/**
 * Get (or create) an AI adapter for the given config.
 *
 * Returns a cached singleton if one already exists for the same provider + API key.
 * This preserves rate limiter windows and circuit breaker state across requests
 * within the same serverless instance lifetime.
 *
 * @example
 * ```ts
 * import { createAIAdapter } from '@/lib/ai';
 * import { getAIConfig } from '@/lib/firebase/config/environments';
 *
 * const adapter = createAIAdapter(getAIConfig());
 * const result = await adapter.generateText({ prompt: 'Hello!' });
 * ```
 */
export function createAIAdapter(config: AIProviderConfig): IAIAdapter {
  const key = cacheKey(config);

  // Return cached instance if available
  const cached = adapterCache.get(key);
  if (cached) return cached;

  const AdapterClass = ADAPTER_REGISTRY[config.provider];

  if (!AdapterClass) {
    throw new Error(
      `Unknown AI provider "${config.provider}". ` +
      `Supported providers: ${Object.keys(ADAPTER_REGISTRY).join(', ')}`,
    );
  }

  const adapter = new AdapterClass(config);
  adapterCache.set(key, adapter);
  return adapter;
}

/**
 * Get a list of all registered provider keys.
 * Useful for validation or UI dropdowns.
 */
export function getAvailableProviders(): AIProvider[] {
  return Object.keys(ADAPTER_REGISTRY) as AIProvider[];
}

/**
 * Clear the adapter cache. Useful for testing or when rotating API keys.
 */
export function clearAdapterCache(): void {
  adapterCache.clear();
}
