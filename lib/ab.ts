/**
 * lib/ab.ts — Variant assignment for server components
 * 
 * Call assignVariant() in your [slug]/page.tsx to determine which
 * variant to show. Uses the same deterministic hash as middleware.
 * 
 * The variant is based on:
 * - User's ab-uid cookie (persistent across sessions)
 * - The post ID (so each test is independent)
 * - Number of variants from ACF
 */

import { cookies, headers } from 'next/headers';

/**
 * Get the assigned variant index for a page.
 * 
 * @param postId - WordPress post/page ID
 * @param variantCount - Total variants INCLUDING control (e.g. 3 = control + 2 variants)
 * @returns variant index: 0 = control, 1+ = ACF variants
 */
export async function assignVariant(postId: number, variantCount: number): Promise<number> {
  if (variantCount <= 1) return 0; // No variants = always control

  // Get UID from header (set by middleware) or cookie
  const headerStore = await headers();
  const cookieStore = await cookies();
  const uid = headerStore.get('x-ab-uid') || cookieStore.get('ab-uid')?.value || 'anonymous';

  return hashToVariant(String(uid), String(postId), variantCount);
}

/** FNV-1a hash — must match middleware.ts exactly */
function hashToVariant(uid: string, testKey: string, variantCount: number): number {
  const str = uid + ':' + testKey;
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash % variantCount;
}
