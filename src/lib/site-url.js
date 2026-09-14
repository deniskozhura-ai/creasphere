/**
 * Returns the canonical base URL for the site.
 * Prioritizes NEXT_PUBLIC_SITE_URL, then VERCEL_URL, and falls back to production domain.
 */
export function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
  }
  if (process.env.VERCEL_URL) {
    const host = process.env.VERCEL_URL.replace(/\/+$/, '');
    return host.startsWith('http') ? host : `https://${host}`;
  }
  return 'https://creasphere.vercel.app';
}
