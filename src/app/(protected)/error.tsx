'use client';

import Link from 'next/link';

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <div className="max-w-md space-y-4 text-center">
        <h2 className="text-lg font-semibold sm:text-xl">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          We encountered an error loading this page.
          {error.digest && (
            <span className="mt-1 block font-mono text-xs">Error ID: {error.digest}</span>
          )}
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
