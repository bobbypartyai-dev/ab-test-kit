/**
 * lib/ab.ts — Read A/B test variants in your components
 * 
 * USAGE IN A SERVER COMPONENT:
 * 
 *   import { getVariant, getVariantMeta } from '@/lib/ab';
 * 
 *   export default async function Page() {
 *     const variant = await getVariant('hero');        // "A" or "B"
 *     const meta = await getVariantMeta('hero');       // { headline: "...", bg: "..." } or null
 *     
 *     return <h1>{meta?.headline || 'Default Headline'}</h1>
 *   }
 * 
 * USAGE IN A CLIENT COMPONENT:
 *   Just read the cookie directly:
 *   document.cookie → "ab-hero=B; ab-hero-meta={...}"
 *   Or pass variant as a prop from a server component (preferred, no flicker)
 */

import { cookies } from 'next/headers';

/** Get the variant value for a test (e.g. "A", "B", or "0", "1" for redirects) */
export async function getVariant(testId: string): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(`ab-${testId}`)?.value || null;
}

/** Get the meta overrides for a test (headline, bg, ctaText, etc.) */
export async function getVariantMeta(testId: string): Promise<Record<string, string> | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(`ab-${testId}-meta`)?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
