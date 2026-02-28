import type { MetadataRoute } from 'next';

/**
 * Web App Manifest (manifest.webmanifest)
 * =======================================
 * Provides metadata about the web application for browsers and devices.
 *
 * Use cases:
 * - PWA "Add to Home Screen" — defines name, icons, theme shown on launch
 * - Controls how the app appears when installed (standalone, fullscreen, etc.)
 * - Sets the start URL, background colour, and theme colour
 * - Declares app icons at various sizes for different device contexts
 *
 * By using a .ts file in `app/`, Next.js auto-generates and caches the
 * manifest route — no manual `<link rel="manifest">` needed in layout.tsx.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
 * @see https://developer.mozilla.org/docs/Web/Manifest
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Next.js Starter Template',
    short_name: 'Starter',
    description:
      'Production-ready Next.js starter with Firebase Auth, AI adapters, and security hardening',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon-192x192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/icon-512x512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
    ],
  };
}
