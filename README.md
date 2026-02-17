# A/B Test Kit for Headless Next.js

Minimal, zero-flicker A/B testing that runs entirely in Edge Middleware. No external scripts, no client-side assignment, no WordPress plugin needed.

## Files

```
ab-tests.ts        ← Define your tests here (the only file you edit regularly)
middleware.ts       ← The engine (assigns variants at the edge)
lib/ab.ts          ← Read variants in your components
components/track.tsx ← Track impressions + conversions
app/api/ab/route.ts ← Tracking endpoint + results API
app/admin/ab/       ← Dashboard
```

## How it works

1. User visits `/pricing`
2. Edge Middleware runs BEFORE the page renders
3. Checks `ab-tests.ts` for matching tests
4. **Redirect test**: rewrites to a different URL (user doesn't see the URL change)
5. **Content test**: sets a cookie with the variant value
6. Page renders — zero flicker because the decision was already made

## Adding a test

Edit `ab-tests.ts`:

```ts
{
  id: 'my-test',
  type: 'redirect',       // or 'content'
  match: '/landing',       // exact URL, or '/blog/*' for wildcard, or '*' for all
  active: true,
  variants: [
    { weight: 50, url: '/landing' },
    { weight: 50, url: '/landing-v2' },
  ],
}
```

For content tests, read the variant in your component:

```tsx
import { getVariant, getVariantMeta } from '@/lib/ab';

export default async function Page() {
  const variant = await getVariant('my-test');     // "A" or "B"
  const meta = await getVariantMeta('my-test');    // { headline: "...", bg: "..." }
  
  return <h1>{meta?.headline || 'Default'}</h1>
}
```

## Adapting for WordPress

Nothing changes in WordPress. Your WP content is the **control** (variant A). Variant B overrides are defined in `ab-tests.ts`.

For **redirect tests**: create the variant page in WordPress as a normal page (e.g. `/pricing-v2`).

For **content tests**: read the cookie in your component and swap fields:

```tsx
const wp = await fetchWPPage(slug);  // Your existing WP fetch
const meta = await getVariantMeta('hero');

const headline = meta?.headline || wp.title.rendered;  // Override or default
```

## Tracking

Impressions fire automatically via `<TrackImpression>`.
Conversions: call `trackConversion()` on CTA clicks.

Data is in-memory for this demo. For production, use the Postgres schema in `app/api/ab/route.ts` comments.

## No WordPress plugin needed

The A/B system lives entirely in Next.js. WordPress is just the content source. The middleware intercepts requests before they reach your pages and handles all variant assignment.
