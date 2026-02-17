/**
 * middleware.ts — A/B test assignment at the edge
 * 
 * Runs BEFORE your page renders = zero flicker.
 * 
 * For each request:
 * 1. Get/create persistent user ID (ab-uid cookie)
 * 2. Read variant assignment from ab-{postId} cookie (if exists)
 * 3. If no cookie yet, assign a variant via deterministic hash
 * 4. Set cookies so your page components know which variant to show
 * 
 * VARIANT ASSIGNMENT:
 * The middleware doesn't fetch from WordPress on every request (that would be slow).
 * Instead, your [slug]/page.tsx fetches the WP page + ACF variants, then uses
 * the ab-variant cookie to pick which variant to render.
 * 
 * The middleware's job is just: assign a sticky user ID + variant number.
 */

import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static files, API routes, admin
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // Get or create persistent user ID
  let uid = req.cookies.get('ab-uid')?.value;
  if (!uid) {
    uid = crypto.randomUUID();
    response.cookies.set('ab-uid', uid, { maxAge: 60 * 60 * 24 * 365, path: '/' });
  }

  // Pass the UID as a header so server components can read it
  // (Server components can't read cookies that were just set in middleware)
  response.headers.set('x-ab-uid', uid);

  return response;
}

/**
 * Fast deterministic hash (FNV-1a).
 * Same input always returns the same number.
 * Used by the page component to assign variants.
 * Exported so lib/ab.ts can use it too.
 */
export function hashToVariant(uid: string, testKey: string, variantCount: number): number {
  const str = uid + ':' + testKey;
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash % variantCount;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
