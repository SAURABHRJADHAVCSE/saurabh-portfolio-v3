/**
 * AI Adapter — Kie.AI Implementation (v3)
 *
 * Kie.AI is an async-task–based provider:
 *   1. POST /api/v1/jobs/createTask  → returns { taskId }
 *   2. GET  /api/v1/jobs/recordInfo?taskId=xxx  → poll until state === 'success'
 *
 * All image/video models follow the same createTask → poll pattern.
 * Chat/text uses an OpenAI-compatible endpoint per model.
 *
 * Features:
 *   - Full model catalog (22+ image, 24+ video, 5+ chat models)
 *   - Pricing info attached to every model
 *   - Sliding-window rate limiter (20 req / 10s default)
 *   - Circuit breaker: trips after 5 consecutive failures, blocks for 60 s
 *   - Hard timeout: AbortSignal-based timeout on every fetch (60 s)
 *   - Model validation against the catalog
 *
 * Docs: https://docs.kie.ai/
 */

import type { IAIAdapter } from '../adapter.interface';
import type {
  AICapability,
  AIProviderConfig,
  TextGenerationRequest,
  TextGenerationResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
  VideoGenerationRequest,
  VideoGenerationResponse,
  TaskState,
} from '../types';
import { AIAdapterError, CapabilityNotSupportedError } from '../types';
import { checkRateLimit } from '@/lib/rate-limit';
import { CircuitBreaker } from '../circuit-breaker';
import type { CircuitBreakerStatus } from '../circuit-breaker';
import {
  KIE_MODEL_MAP,
  KIE_ALL_MODELS,
  getKieModelsByCapability,
  getKieModelIds,
  isValidKieModel,
  getKieModelInfo,
} from '../kieai-models';
import type { KieModelInfo } from '../kieai-models';

// ─── Default models (can be overridden in config) ────────────────────────────

const DEFAULT_MODELS = {
  text: 'gemini-2.5-flash',           // Kie.AI hosts Gemini as a chat model
  image: 'flux-2/pro-text-to-image',  // Flux-2 for image generation
  video: 'kling/v2-1-pro',            // Kling for video generation
} as const;

// ─── Constants ───────────────────────────────────────────────────────────────

const KIE_BASE_URL = 'https://api.kie.ai';
const KIE_TASK_ENDPOINT = `${KIE_BASE_URL}/api/v1/jobs/createTask`;
const KIE_POLL_ENDPOINT = `${KIE_BASE_URL}/api/v1/jobs/recordInfo`;

/**
 * Flux-2 models require a `resolution` field with values like '1K' or '2K'.
 * Other image models (Seedream, Imagen, etc.) do NOT need this field.
 */
const FLUX_DEFAULT_RESOLUTION = '1K';

/** Check if a model ID belongs to the Flux-2 family */
function isFluxModel(modelId: string): boolean {
  return modelId.startsWith('flux');
}

// ─── Timeouts ────────────────────────────────────────────────────────────────

/** Hard timeout for individual fetch calls (text / createTask / polling) */
const FETCH_TIMEOUT_MS = 60_000; // 60 seconds

/** Hard timeout for the entire image/video poll loop */
const POLL_HARD_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

// ─── Adapter ─────────────────────────────────────────────────────────────────

export class KieAIAdapter implements IAIAdapter {
  readonly name = 'KieAI';
  readonly provider = 'kieai' as const;

  private readonly apiKey: string;
  private readonly models: { text: string; image: string; video: string };
  private readonly pollingInterval: number;
  private readonly maxPollingAttempts: number;
  private readonly providerRateLimit: { maxRequests: number; windowMs: number };
  private readonly circuitBreaker: CircuitBreaker;

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey;
    this.models = {
      text: config.models?.text ?? DEFAULT_MODELS.text,
      image: config.models?.image ?? DEFAULT_MODELS.image,
      video: config.models?.video ?? DEFAULT_MODELS.video,
    };
    this.pollingInterval = config.pollingInterval ?? 5_000;
    this.maxPollingAttempts = config.maxPollingAttempts ?? 60;

    // Provider-level rate limit config (enforced via Upstash Redis)
    this.providerRateLimit = {
      maxRequests: config.rateLimit?.maxRequests ?? 18,  // 20 official - 2 buffer
      windowMs: config.rateLimit?.windowMs ?? 10_000,
    };

    // Circuit breaker — trips after consecutive failures to avoid wasting quota
    this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);

    // Warn (but don't crash) if configured models aren't in the catalog
    this.validateConfiguredModels();
  }

  // ── Capability discovery ─────────────────────────────────────────────────

  getSupportedCapabilities(): AICapability[] {
    return ['text', 'image', 'video'];
  }

  supportsCapability(capability: AICapability): boolean {
    return this.getSupportedCapabilities().includes(capability);
  }

  // ── Model Discovery (unique to KieAI adapter) ───────────────────────────

  /**
   * List all available models, optionally filtered by capability.
   */
  getAvailableModels(capability?: AICapability): KieModelInfo[] {
    if (capability) {
      return getKieModelsByCapability(capability);
    }
    return [...KIE_ALL_MODELS];
  }

  /**
   * Get model IDs for a capability.
   */
  getModelIds(capability: AICapability): string[] {
    return getKieModelIds(capability);
  }

  /**
   * Get detailed info about a specific model.
   */
  getModelInfo(modelId: string): KieModelInfo | undefined {
    return getKieModelInfo(modelId);
  }

  /**
   * Check rate limiter config.
   */
  getRateLimitStatus(): { maxRequests: number; windowMs: number } {
    return { ...this.providerRateLimit };
  }

  /**
   * Check circuit breaker status.
   */
  getCircuitBreakerStatus(): CircuitBreakerStatus {
    return this.circuitBreaker.getStatus();
  }

  /**
   * Get the currently configured default models.
   */
  getConfiguredModels(): { text: string; image: string; video: string } {
    return { ...this.models };
  }

  // ── Text Generation ──────────────────────────────────────────────────────

  async generateText(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    if (!this.supportsCapability('text')) {
      throw new CapabilityNotSupportedError('kieai', 'text');
    }

    this.circuitBreaker.guardRequest('kieai');

    try {
      // Rate limit check (Upstash Redis — distributed)
      await this.enforceProviderRateLimit();

      const model = this.models.text;
      const url = `${KIE_BASE_URL}/${model}/v1/chat/completions`;

      // Build messages array (OpenAI-compatible format used by kie.ai chat models)
      const messages: Array<{ role: string; content: string }> = [];

      if (request.systemInstruction) {
        messages.push({ role: 'system', content: request.systemInstruction });
      }
      messages.push({ role: 'user', content: request.prompt });

      const body = {
        messages,
        stream: false,
        ...(request.temperature !== undefined && { temperature: request.temperature }),
        ...(request.maxTokens !== undefined && { max_tokens: request.maxTokens }),
      };

      const res = await this.fetchJSON<KieChatResponse>(url, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const content = res.choices?.[0]?.message?.content ?? '';

      this.circuitBreaker.recordSuccess();

      return {
        text: content,
        model: res.model ?? model,
        provider: 'kieai',
        usage: res.usage
          ? {
              promptTokens: res.usage.prompt_tokens,
              completionTokens: res.usage.completion_tokens,
              totalTokens: res.usage.total_tokens,
            }
          : undefined,
      };
    } catch (error) {
      if (error instanceof AIAdapterError) {
        this.circuitBreaker.recordFailure();
        throw error;
      }
      this.circuitBreaker.recordFailure();
      throw this.wrapError(error, 'TEXT_GENERATION_FAILED');
    }
  }

  // ── Image Generation ─────────────────────────────────────────────────────

  async generateImage(
    request: ImageGenerationRequest,
  ): Promise<ImageGenerationResponse> {
    if (!this.supportsCapability('image')) {
      throw new CapabilityNotSupportedError('kieai', 'image');
    }

    const model = this.models.image;
    this.assertValidModel(model, 'image');

    this.circuitBreaker.guardRequest('kieai');

    try {
      // Rate limit check (Upstash Redis — distributed)
      await this.enforceProviderRateLimit();

      const taskBody = {
        model,
        input: {
          prompt: request.prompt,
          aspect_ratio: request.aspectRatio ?? '1:1',
          // Flux-2 models require 'resolution' (e.g. '1K', '2K'); other models don't.
          ...(isFluxModel(model) && { resolution: FLUX_DEFAULT_RESOLUTION }),
          ...(request.negativePrompt && { negative_prompt: request.negativePrompt }),
        },
      };

      const { taskId } = await this.createTask(taskBody);
      const result = await this.pollUntilDone(taskId);

      this.circuitBreaker.recordSuccess();

      return {
        images: (result.resultUrls ?? []).map((url) => ({
          url,
          mimeType: 'image/png',
        })),
        model,
        provider: 'kieai',
      };
    } catch (error) {
      if (error instanceof AIAdapterError) {
        this.circuitBreaker.recordFailure();
        throw error;
      }
      this.circuitBreaker.recordFailure();
      throw this.wrapError(error, 'IMAGE_GENERATION_FAILED');
    }
  }

  // ── Video Generation ─────────────────────────────────────────────────────

  async generateVideo(
    request: VideoGenerationRequest,
  ): Promise<VideoGenerationResponse> {
    if (!this.supportsCapability('video')) {
      throw new CapabilityNotSupportedError('kieai', 'video');
    }

    const model = this.models.video;
    this.assertValidModel(model, 'video');

    this.circuitBreaker.guardRequest('kieai');

    try {
      // Rate limit check (Upstash Redis — distributed)
      await this.enforceProviderRateLimit();

      const taskBody = {
        model,
        input: {
          prompt: request.prompt,
          // Kie.AI requires aspect_ratio — default to 16:9 for video
          aspect_ratio: request.aspectRatio ?? '16:9',
          ...(request.imageUrl && { image_url: request.imageUrl }),
          ...(request.durationSeconds && { duration: String(request.durationSeconds) }),
          ...(request.negativePrompt && { negative_prompt: request.negativePrompt }),
        },
      };

      const { taskId } = await this.createTask(taskBody);
      const result = await this.pollUntilDone(taskId);

      this.circuitBreaker.recordSuccess();

      return {
        videos: (result.resultUrls ?? []).map((url) => ({
          url,
          mimeType: 'video/mp4',
        })),
        model,
        provider: 'kieai',
      };
    } catch (error) {
      if (error instanceof AIAdapterError) {
        this.circuitBreaker.recordFailure();
        throw error;
      }
      this.circuitBreaker.recordFailure();
      throw this.wrapError(error, 'VIDEO_GENERATION_FAILED');
    }
  }

  // ── Internals ────────────────────────────────────────────────────────────

  /**
   * Enforce provider-level rate limiting via Upstash Redis.
   * Distributed across all serverless instances — no cold-start reset issue.
   */
  private async enforceProviderRateLimit(): Promise<void> {
    const { allowed } = await checkRateLimit(
      `provider:kieai`,
      this.providerRateLimit.maxRequests,
      this.providerRateLimit.windowMs,
    );
    if (!allowed) {
      throw new AIAdapterError(
        `Provider rate limit exceeded (${this.providerRateLimit.maxRequests} requests per ${this.providerRateLimit.windowMs}ms). Try again later.`,
        'kieai',
        'RATE_LIMITED',
        429,
      );
    }
  }

  /**
   * POST /api/v1/jobs/createTask
   * Returns the taskId for async polling.
   */
  private async createTask(body: Record<string, unknown>): Promise<{ taskId: string }> {
    const res = await this.fetchJSON<KieCreateTaskResponse>(KIE_TASK_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (res.code !== 200 || !res.data?.taskId) {
      throw new AIAdapterError(
        `Failed to create task: ${res.msg ?? 'unknown error'}`,
        'kieai',
        'TASK_CREATION_FAILED',
        res.code,
      );
    }

    return { taskId: res.data.taskId };
  }

  /**
   * GET /api/v1/jobs/recordInfo?taskId=xxx
   * Polls until state === 'success' or 'fail'.
   * Polling calls are NOT rate-limited (they're lightweight status checks).
   *
   * Has a hard deadline to prevent infinite polling if the provider hangs.
   */
  private async pollUntilDone(taskId: string): Promise<KiePollResult> {
    const deadline = Date.now() + POLL_HARD_TIMEOUT_MS;

    for (let attempt = 0; attempt < this.maxPollingAttempts; attempt++) {
      if (Date.now() >= deadline) {
        throw new AIAdapterError(
          `Task ${taskId} exceeded hard time limit (${POLL_HARD_TIMEOUT_MS / 1000}s)`,
          'kieai',
          'TASK_TIMEOUT',
        );
      }

      const res = await this.fetchJSON<KiePollResponse>(
        `${KIE_POLL_ENDPOINT}?taskId=${taskId}`,
        { method: 'GET' },
      );

      const state: TaskState = res.data?.state as TaskState;

      if (state === 'success') {
        // Safely parse resultJson — may be malformed
        let parsed: { resultUrls?: string[] } = { resultUrls: [] };
        if (res.data?.resultJson) {
          try {
            parsed = JSON.parse(res.data.resultJson) as { resultUrls?: string[] };
          } catch {
            throw new AIAdapterError(
              `Task ${taskId} returned invalid result JSON`,
              'kieai',
              'INVALID_RESULT',
            );
          }
        }

        return { state: 'success', resultUrls: parsed.resultUrls ?? [] };
      }

      if (state === 'fail') {
        throw new AIAdapterError(
          `Task ${taskId} failed: ${res.data?.failMsg ?? 'unknown'}`,
          'kieai',
          'TASK_FAILED',
        );
      }

      // Still processing → wait
      await this.sleep(this.pollingInterval);
    }

    throw new AIAdapterError(
      `Task ${taskId} timed out after ${this.maxPollingAttempts} attempts`,
      'kieai',
      'TASK_TIMEOUT',
    );
  }

  /**
   * Validate configured models against the catalog on construction.
   * Logs warnings but does not throw — the model might be newly added.
   */
  private validateConfiguredModels(): void {
    for (const [capability, modelId] of Object.entries(this.models)) {
      if (!isValidKieModel(modelId)) {
        console.warn(
          `[KieAI] Model "${modelId}" for ${capability} is not in the catalog. ` +
          `It may be a new model not yet cataloged, or a typo. ` +
          `Available ${capability} models: ${getKieModelIds(capability as AICapability).join(', ')}`,
        );
      }
    }
  }

  /**
   * Assert that a model ID is valid for its capability before making an API call.
   * Throws if the model is known but assigned to the wrong capability.
   */
  private assertValidModel(modelId: string, expectedCapability: AICapability): void {
    const info = KIE_MODEL_MAP.get(modelId);
    if (info && info.capability !== expectedCapability) {
      throw new AIAdapterError(
        `Model "${modelId}" is a ${info.capability} model, ` +
        `but was used for ${expectedCapability} generation. ` +
        `Use one of: ${getKieModelIds(expectedCapability).slice(0, 5).join(', ')}…`,
        'kieai',
        'MODEL_CAPABILITY_MISMATCH',
      );
    }
    // If model is not in the catalog at all, we allow it through (might be new)
  }

  /** Generic fetch wrapper with auth headers and hard timeout */
  private async fetchJSON<T>(url: string, init: RequestInit): Promise<T> {
    const response = await this.withTimeout(
      fetch(url, {
        ...init,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...(init.headers as Record<string, string>),
        },
      }),
      FETCH_TIMEOUT_MS,
      `Request to ${new URL(url).pathname} timed out`,
    );

    if (!response.ok) {
      // Handle rate limit responses from the server itself
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new AIAdapterError(
          `Rate limited by Kie.AI (429). Retry after ${retryAfter ?? 'unknown'} seconds.`,
          'kieai',
          'PROVIDER_RATE_LIMITED',
          429,
        );
      }

      throw new AIAdapterError(
        `HTTP ${response.status}: ${response.statusText}`,
        'kieai',
        'HTTP_ERROR',
        response.status,
      );
    }

    return (await response.json()) as T;
  }

  /**
   * Race a promise against a hard timeout.
   * Prevents any single fetch call from hanging forever.
   */
  private withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new AIAdapterError(message, 'kieai', 'TIMEOUT')),
        ms,
      );
      promise
        .then((val) => { clearTimeout(timer); resolve(val); })
        .catch((err) => { clearTimeout(timer); reject(err); });
    });
  }

  /**
   * Wrap an unknown error into a sanitized AIAdapterError.
   * Strips SDK internals, internal URLs, and sensitive details.
   */
  private wrapError(error: unknown, code: string): AIAdapterError {
    if (error instanceof AIAdapterError) return error;

    const raw = error instanceof Error ? error.message : String(error);
    const sanitized = this.sanitizeMessage(raw);
    return new AIAdapterError(sanitized, 'kieai', code);
  }

  /**
   * Remove internal details from error messages before they reach the user.
   */
  private sanitizeMessage(message: string): string {
    return message
      // Windows paths
      .replace(/[A-Za-z]:\\[^\s]*/g, '[path]')
      // Unix paths
      .replace(/(?:^|\s)\/(?:home|usr|var|tmp|etc|opt)[^\s]*/g, ' [path]')
      // Internal API URLs
      .replace(/https?:\/\/api\.kie\.ai[^\s]*/gi, '[internal-url]')
      // API key values
      .replace(/Bearer\s+[A-Za-z0-9_.-]{20,}/g, 'Bearer [redacted]')
      // Truncate
      .slice(0, 500);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ─── Kie.AI Response Types ──────────────────────────────────────────────────

interface KieChatResponse {
  id?: string;
  object?: string;
  model?: string;
  choices?: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

interface KieCreateTaskResponse {
  code: number;
  msg?: string;
  data?: { taskId: string };
}

interface KiePollResponse {
  code: number;
  message?: string;
  data?: {
    taskId: string;
    model: string;
    state: string;
    resultJson?: string;
    failCode?: string;
    failMsg?: string;
  };
}

interface KiePollResult {
  state: 'success';
  resultUrls: string[];
}
