'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { toast } from 'sonner';

/** Dismissed flag persists for the session so the prompt isn't annoying. */
const DISMISS_KEY = 'pwa-prompt-dismissed';
/** Delay (ms) before showing the banner after page load. */
const SHOW_DELAY = 3_000;

/**
 * Extends the standard Event with the Chrome `beforeinstallprompt` shape.
 * @see https://developer.mozilla.org/docs/Web/API/BeforeInstallPromptEvent
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Detect browser for manual-install instructions. */
function getManualInstallHint(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua))
    return 'Tap the Share button, then "Add to Home Screen".';
  if (/Android/i.test(ua))
    return 'Tap ⋮ menu → "Add to Home screen" or "Install app".';
  if (/Edg\//i.test(ua))
    return 'Click ⋯ menu → Apps → "Install this site as an app".';
  if (/Chrome/i.test(ua))
    return 'Click ⋮ menu → "Install DevStudio…" (or "Cast, save, and share" → Install).';
  if (/Firefox/i.test(ua))
    return 'Firefox doesn\'t support PWA install natively. Try Chrome or Edge.';
  return 'Check your browser menu for an "Install" or "Add to Home screen" option.';
}

/**
 * Non-blocking bottom banner that suggests installing the PWA.
 * Unlike a modal Dialog, this does NOT block interaction with the page.
 */
export default function PwaInstallPrompt() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already running as installed PWA or user previously dismissed
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      sessionStorage.getItem(DISMISS_KEY)
    )
      return;

    // Capture the native install event if/when it fires
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Show the banner after a short delay
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const install = useCallback(async () => {
    const prompt = deferredPrompt.current;

    // Native install prompt available → trigger it
    if (prompt) {
      const { outcome } = await prompt.prompt();
      deferredPrompt.current = null;
      if (outcome === 'accepted') {
        setVisible(false);
        return;
      }
      // User dismissed the native prompt — keep banner visible
      return;
    }

    // No native prompt (dev mode, iOS, Firefox, etc.)
    // → show browser-specific manual instructions
    toast.info(getManualInstallHint(), { duration: 8_000 });
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    sessionStorage.setItem(DISMISS_KEY, '1');
    deferredPrompt.current = null;
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Download className="size-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight">Install App</p>
          <p className="text-xs text-muted-foreground truncate">
            Add to home screen for an app-like experience
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" onClick={install}>
            Install
          </Button>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
