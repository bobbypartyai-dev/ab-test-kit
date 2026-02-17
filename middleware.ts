/**
 * middleware.ts — The entire A/B testing engine
 * 
 * Runs at the edge BEFORE your page renders. This means:
 * - No flicker (variant is chosen before any HTML is sent)
 * - No client-side JS needed for assignment
 * - Works with Server Components, ISR, SSR, static — everything
 * 
 * HOW IT WORKS:
 * 1. User hits /pricing
 * 2. Middleware checks if they have an `ab-uid` cookie (if not, creates one)
 * 3. For each active test matching this URL:
 *    - Hashes uid + testId → deterministic number 0-99
 *    - Maps to a variant based on weights
 *    - REDIRECT test: rewrites the request to the variant URL
 *    - CONTENT test: sets a cookie `ab-{testId}={value}`
 * 4. Page renders with the right content. Zero flicker.
 * 
 * SAME USER = SAME VARIANT (always, because the hash is deterministic)
 */

import { NextRequest, NextResponse } from 'next/server';
import { tests } from './ab-tests';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static files, API routes, and admin dashboard
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get or create a persistent user ID
  let uid = req.cookies.get('ab-uid')?.value;
  const isNewUser = !uid;
  if (!uid) uid = crypto.randomUUID();

  // Find all active tests that match this URL
  const matchingTests = tests.filter(t => t.active && matchUrl(pathname, t.match));

  if (matchingTests.length === 0) {
    // No tests for this URL — pass through
    const res = NextResponse.next();
    if (isNewUser) res.cookies.set('ab-uid', uid, { maxAge: 60 * 60 * 24 * 365, path: '/' });
    return res;
  }

  // Check for redirect tests first (only one redirect per request makes sense)
  const redirectTest = matchingTests.find(t => t.type === 'redirect');
  let response: NextResponse;

  if (redirectTest) {
    const variant = assignVariant(uid, redirectTest.id, redirectTest.variants.map(v => v.weight));
    const chosenUrl = redirectTest.variants[variant].url!;

    if (chosenUrl !== pathname) {
      // Rewrite (not redirect) — URL bar stays the same, content changes
      const url = req.nextUrl.clone();
      url.pathname = chosenUrl;
      response = NextResponse.rewrite(url);
    } else {
      response = NextResponse.next();
    }

    // Set cookie so the page/tracking knows which variant this user got
    response.cookies.set(`ab-${redirectTest.id}`, String(variant), { maxAge: 60 * 60 * 24 * 30, path: '/' });
  } else {
    response = NextResponse.next();
  }

  // Apply all content tests (set cookies)
  for (const test of matchingTests.filter(t => t.type === 'content')) {
    const variant = assignVariant(uid, test.id, test.variants.map(v => v.weight));
    const value = test.variants[variant].value || String(variant);
    response.cookies.set(`ab-${test.id}`, value, { maxAge: 60 * 60 * 24 * 30, path: '/' });

    // If variant has meta, store it as JSON in a separate cookie
    // Your component reads this to get headline overrides, bg images, etc.
    const meta = test.variants[variant].meta;
    if (meta) {
      response.cookies.set(`ab-${test.id}-meta`, JSON.stringify(meta), { maxAge: 60 * 60 * 24 * 30, path: '/' });
    }
  }

  // Persist the user ID
  if (isNewUser) response.cookies.set('ab-uid', uid, { maxAge: 60 * 60 * 24 * 365, path: '/' });

  return response;
}

/**
 * Match a URL against a pattern.
 * - Exact: "/pricing" matches only "/pricing"
 * - Wildcard: "/services/*" matches "/services/web", "/services/app", etc.
 * - Global: "*" matches everything
 */
function matchUrl(pathname: string, pattern: string): boolean {
  if (pattern === '*') return true;
  if (pattern.endsWith('/*')) {
    const base = pattern.slice(0, -2);
    return pathname === base || pathname.startsWith(base + '/');
  }
  return pathname === pattern;
}

/**
 * Deterministic variant assignment.
 * Same uid + testId always returns the same variant index.
 * Uses a simple string hash (works at the edge, no Node.js crypto needed).
 */
function assignVariant(uid: string, testId: string, weights: number[]): number {
  const hash = simpleHash(uid + ':' + testId);
  const bucket = hash % 100; // 0-99

  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (bucket < cumulative) return i;
  }
  return weights.length - 1; // fallback
}

/**
 * Fast string hash (FNV-1a).
 * Deterministic, well-distributed, works on edge runtime.
 */
function simpleHash(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
