/**
 * Next.js Instrumentation — runs once when the server starts.
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * NOTE: The punycode DEP0040 warning comes from Firebase Admin SDK internals.
 * It is harmless and cannot be fixed in user code. To hide it in dev:
 *   $env:NODE_OPTIONS="--no-deprecation"; npm run dev
 */
export function register() {
  // placeholder — add startup tasks here (e.g. OpenTelemetry, DB warm-up)
}
