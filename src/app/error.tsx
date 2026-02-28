'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-2">
          <CardTitle className="subheading">Something went wrong</CardTitle>
          <CardDescription className="muted">
            An unexpected error occurred.
            {error.digest && (
              <span className="block mt-1 text-xs font-mono">
                Error ID: {error.digest}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={reset}>Try Again</Button>
        </CardContent>
      </Card>
    </div>
  );
}
