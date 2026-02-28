import type { MetadataRoute } from 'next';

/**
 * robots.txt — Search Engine Crawler Directives
 * ==============================================
 * Tells search-engine crawlers (Googlebot, Bingbot, etc.) which URLs
 * they are allowed or forbidden to request on this site.
 *
 * Use cases:
 * - Prevent indexing of private/authenticated pages (profile, settings)
 * - Block crawlers from hitting API routes and wasting server resources
 * - Point crawlers to the sitemap for efficient discovery of public pages
 * - Optionally set per-bot rules (e.g. allow Googlebot, block others)
 *
 * Next.js auto-generates and caches the route at /robots.txt when this
 * file exists in `app/`. No manual `<meta name="robots">` tag is needed.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 * @see https://developers.google.com/search/docs/crawling-indexing/robots/intro
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',            // API routes — no indexable content
          '/profile',         // Authenticated — user profile
          '/change-password', // Authenticated — password change
          '/delete-account',  // Authenticated — account deletion
          '/ai-test',         // Authenticated — AI playground
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
