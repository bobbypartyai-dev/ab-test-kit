/**
 * ab-tests.ts — Your A/B test definitions
 * 
 * This is the ONLY file you edit to create/manage tests.
 * 
 * TWO TEST TYPES:
 * 
 * 1. REDIRECT — sends users to a different URL
 *    Use when: you have two completely different page designs
 *    WordPress: create the variant page as a normal WP page
 *    Example: /pricing → 50% see /pricing, 50% see /pricing-v2
 * 
 * 2. CONTENT — same URL, different content via cookie
 *    Use when: you want to swap headlines, images, CTAs on the same page
 *    WordPress: nothing needed, you read the cookie in your component
 *    Example: /services/* → 50% see headline A, 50% see headline B
 */

export type ABTest = {
  id: string;                    // Unique test ID (used in cookies + tracking)
  type: 'redirect' | 'content';
  match: string;                 // URL pattern: exact "/pricing" or wildcard "/blog/*"
  active: boolean;               // Flip to false to stop the test
  variants: {
    weight: number;              // Percentage (all weights should sum to 100)
    url?: string;                // For redirect tests: where to send them
    value?: string;              // For content tests: cookie value (e.g. "A", "B")
    meta?: Record<string, string>; // Optional: any extra data you want to pass
  }[];
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * DEFINE YOUR TESTS HERE
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export const tests: ABTest[] = [

  // EXAMPLE 1: Redirect test
  // 50% of /pricing visitors get rewritten to /pricing-v2
  // The URL bar still shows /pricing (it's a rewrite, not a redirect)
  // You need /pricing-v2 to exist as a page (in WP or Next.js)
  {
    id: 'pricing-redesign',
    type: 'redirect',
    match: '/pricing',
    active: true,
    variants: [
      { weight: 50, url: '/pricing' },       // Control: original page
      { weight: 50, url: '/pricing-v2' },     // Challenger: new design
    ],
  },

  // EXAMPLE 2: Content test with wildcard
  // All /services/* pages get a cookie "ab-hero=A" or "ab-hero=B"
  // Your component reads this cookie server-side to pick the headline
  {
    id: 'hero',
    type: 'content',
    match: '/services/*',
    active: true,
    variants: [
      { weight: 50, value: 'A' },  // Control
      { weight: 50, value: 'B', meta: { headline: 'We build what matters', bg: '/hero-alt.jpg' } },
    ],
  },

  // EXAMPLE 3: Content test on a specific page
  {
    id: 'cta',
    type: 'content',
    match: '/pricing',
    active: true,
    variants: [
      { weight: 50, value: 'A' },  // "Get Started" (default)
      { weight: 50, value: 'B', meta: { ctaText: 'Start Free Trial', ctaColor: '#10B981' } },
    ],
  },

];
