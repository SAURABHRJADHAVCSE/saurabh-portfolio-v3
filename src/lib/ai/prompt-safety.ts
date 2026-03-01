/**
 * AI Adapter — Prompt Safety Filter
 *
 * Server-side pre-screening of prompts before they reach the AI provider.
 * Catches known jailbreak patterns, prompt injection vectors, and
 * content-policy violations BEFORE burning an API call.
 *
 * This is a defense-in-depth measure — the provider's own safety filters
 * are the primary gate, but rejecting early saves cost and latency.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PromptCheckResult {
  /** Whether the prompt is allowed */
  safe: boolean;
  /** Human-readable reason if blocked */
  reason?: string;
  /** Which rule triggered */
  rule?: string;
}

// ─── Jailbreak / Injection Patterns ──────────────────────────────────────────
// Each entry: [regex, ruleId, human-readable reason]
// Patterns are case-insensitive and matched against the full prompt.

const BLOCKED_PATTERNS: Array<[RegExp, string, string]> = [
  // ── Classic jailbreak frames ──
  [
    /\b(?:DAN|do\s*anything\s*now|developer\s*mode|jailbreak)\b/i,
    'JAILBREAK_DAN',
    'Prompt contains a known jailbreak pattern (DAN / developer mode).',
  ],
  [
    /\bignore\s+(?:all\s+)?(?:previous|above|prior|earlier)\s+(?:instructions|rules|prompts?|guidelines)\b/i,
    'INJECTION_IGNORE',
    'Prompt attempts to override system instructions.',
  ],
  [
    /\b(?:you\s+are\s+now|from\s+now\s+on\s+you\s+(?:are|will))\s/i,
    'INJECTION_PERSONA',
    'Prompt attempts to reassign the model\'s identity.',
  ],
  [
    /\b(?:bypass|disable|circumvent|turn\s+off)\s+(?:safety|content|filter|moderation|guard)/i,
    'INJECTION_BYPASS_SAFETY',
    'Prompt attempts to disable safety filters.',
  ],
  [
    /\bsystem\s*:\s*you\s+(?:are|will|must)\b/i,
    'INJECTION_FAKE_SYSTEM',
    'Prompt contains a fake system-level instruction.',
  ],

  // ── Indirect prompt injection vectors ──
  [
    /\bpretend\s+(?:there\s+are\s+)?no\s+(?:rules|restrictions|limits|boundaries|safety)\b/i,
    'INJECTION_PRETEND_NO_RULES',
    'Prompt asks the model to pretend there are no rules.',
  ],
  [
    /\b(?:roleplay|role\s+play)\s+as\s+(?:a\s+)?(?:hacker|attacker|malware|evil)/i,
    'INJECTION_MALICIOUS_ROLE',
    'Prompt asks for a malicious roleplay scenario.',
  ],

  // ── Data exfiltration / side-channel ──
  [
    /\b(?:repeat|output|print|echo|show|reveal|display|dump)\s+(?:the\s+)?(?:system\s+prompt|instructions|api\s*key|secret|password|token|credentials?)\b/i,
    'EXFIL_SYSTEM_PROMPT',
    'Prompt attempts to extract system prompts or credentials.',
  ],

  // ── Direct harmful content requests ──
  [
    /\b(?:how\s+to\s+(?:make|build|create)\s+(?:a\s+)?(?:bomb|weapon|explosive|poison))\b/i,
    'HARMFUL_WEAPONS',
    'Prompt requests instructions for creating weapons or harmful substances.',
  ],
  [
    /\b(?:synthesize|manufacture|produce)\s+(?:illegal\s+)?(?:drugs?|methamphetamine|fentanyl)\b/i,
    'HARMFUL_DRUGS',
    'Prompt requests drug synthesis instructions.',
  ],

  // ── Encoding evasion attacks ──
  [
    /\\x[0-9a-f]{2}|\\u[0-9a-f]{4}|%[0-9a-f]{2}/i,
    'ENCODING_ESCAPE',
    'Prompt contains suspicious encoded sequences.',
  ],
  [
    /\b(?:base64|atob|btoa)\s*(?:\(|decode|encode)/i,
    'ENCODING_BASE64',
    'Prompt attempts to use encoding-based evasion.',
  ],
  [
    /\b(?:rot13|caesar\s+cipher)\b/i,
    'ENCODING_ROT13',
    'Prompt references encoding evasion techniques.',
  ],

  // ── Multi-language jailbreak patterns (Hindi/Hinglish) ──
  [
    /(?:सभी|सारे)\s+(?:नियम|नियमों)\s+(?:को\s+)?(?:भूल|अनदेखा|हटा|तोड़)/i,
    'JAILBREAK_HINDI',
    'Prompt attempts jailbreak in Hindi.',
  ],
  [
    /\b(?:sab|sabhi|saare)\s+(?:rules?|niyam)\s+(?:bhool|ignore|hata|tod)\b/i,
    'JAILBREAK_HINGLISH',
    'Prompt attempts jailbreak in Hinglish.',
  ],

  // ── Prompt length anomaly with repetition markers ──
  [
    /(.)\1{50,}/,
    'REPETITION_FLOOD',
    'Prompt contains excessive character repetition.',
  ],

  // ── HTML/script injection in prompt (potential XSS in rendered outputs) ──
  [
    /<script[\s>]|javascript\s*:|on(?:load|error|click)\s*=/i,
    'XSS_INJECTION',
    'Prompt contains script injection patterns.',
  ],
];

// ─── System Instruction Specific Patterns ────────────────────────────────────

const SYSTEM_INSTRUCTION_BLOCKED: Array<[RegExp, string, string]> = [
  [
    /\bignore\s+(?:all\s+)?(?:safety|content|moderation)\b/i,
    'SYSINST_BYPASS_SAFETY',
    'System instruction attempts to override safety measures.',
  ],
  [
    /\bno\s+(?:restrictions|limits|rules|filters)\b/i,
    'SYSINST_NO_RESTRICTIONS',
    'System instruction attempts to remove restrictions.',
  ],
  [
    /\byou\s+(?:can|are\s+allowed\s+to|should|must)\s+(?:generate|produce|create)\s+(?:any|all)\s+(?:content|output)/i,
    'SYSINST_UNRESTRICTED_OUTPUT',
    'System instruction attempts to allow unrestricted content generation.',
  ],
];

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Normalize a string for safety checking.
 *
 * Attackers can use Unicode tricks to bypass regex filters:
 *   - Homoglyphs: replacing Latin chars with Cyrillic look-alikes
 *   - Zero-width characters: invisible chars inserted between words
 *   - NFKD decomposition: accented chars that look like ASCII
 *
 * This normalizes the input so our regex patterns can match reliably.
 */
function normalizeForSafety(input: string): string {
  return (
    input
      // NFKD (compatibility decomposition) — turns ℹ → i, ﬁ → fi, etc.
      .normalize('NFKD')
      // Strip zero-width characters (ZWJ, ZWNJ, ZWSP, word joiner, soft hyphen)
      // eslint-disable-next-line no-control-regex
      .replace(/[\u200B-\u200F\u2028-\u202F\u2060-\u206F\uFEFF\u00AD]/g, '')
      // Strip combining diacritical marks left after NFKD
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0300-\u036F]/g, '')
  );
}

/**
 * Check a user prompt for known jailbreak / injection patterns.
 * Returns `{ safe: true }` if the prompt passes all checks.
 */
export function checkPromptSafety(prompt: string): PromptCheckResult {
  if (!prompt || typeof prompt !== 'string') {
    return { safe: true }; // Empty prompts are handled elsewhere
  }

  const normalized = normalizeForSafety(prompt);

  for (const [pattern, rule, reason] of BLOCKED_PATTERNS) {
    if (pattern.test(normalized)) {
      return { safe: false, reason, rule };
    }
  }

  return { safe: true };
}

/**
 * Check a system instruction for injection vectors.
 * Separate from prompt checking because the threat model is different
 * (system instructions have higher privilege in the model's context).
 */
export function checkSystemInstructionSafety(instruction: string): PromptCheckResult {
  if (!instruction || typeof instruction !== 'string') {
    return { safe: true };
  }

  const normalized = normalizeForSafety(instruction);

  // Check system-instruction-specific patterns
  for (const [pattern, rule, reason] of SYSTEM_INSTRUCTION_BLOCKED) {
    if (pattern.test(normalized)) {
      return { safe: false, reason, rule };
    }
  }

  // Also check general jailbreak patterns in system instructions
  for (const [pattern, rule, reason] of BLOCKED_PATTERNS) {
    if (pattern.test(normalized)) {
      return { safe: false, reason, rule };
    }
  }

  return { safe: true };
}

/**
 * Combined check — runs both prompt and optional system instruction.
 * Returns the first failure found, or `{ safe: true }`.
 */
export function checkAllInputsSafety(
  prompt: string,
  systemInstruction?: string,
): PromptCheckResult {
  const promptResult = checkPromptSafety(prompt);
  if (!promptResult.safe) return promptResult;

  if (systemInstruction) {
    return checkSystemInstructionSafety(systemInstruction);
  }

  return { safe: true };
}
