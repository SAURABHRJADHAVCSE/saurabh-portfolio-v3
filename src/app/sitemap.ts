import type { MetadataRoute } from 'next';

/**
 * sitemap.xml — Search Engine URL Index
 * ======================================
 * Provides an authoritative list of public URLs so search-engine crawlers
 * can discover and index the site efficiently.
 *
 * Use cases:
 * - Faster discovery of new/updated pages by crawlers
 * - Communicating relative priority of pages (home > auth pages)
 * - Indicating how often pages change (monthly, yearly, etc.)
 * - Supports images, videos, and localised alternates (add as needed)
 *
 * Next.js auto-generates and caches the route at /sitemap.xml when this
 * file exists in `app/`. For large sites, use `generateSitemaps()` to
 * split across multiple files (Google limit: 50,000 URLs per sitemap).
 *
 * Add new public routes here as the app grows.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 * @see https://www.sitemaps.org/protocol.html
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const now = new Date();

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/forgot-password`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
