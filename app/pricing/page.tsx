/**
 * /pricing — Pricing page with A/B test
 * 
 * This page has 3 variants defined in WordPress ACF:
 * 0: Control (original pricing page)
 * 1: "Free trial emphasis" (different headline + CTA)
 * 2: Redirect to /pricing-v2 (completely different page)
 * 
 * The variant is assigned in lib/ab.ts using the user's UID cookie.
 * In production, fetch the page + ACF fields from WordPress.
 */
import { assignVariant } from '@/lib/ab';
import { applyVariant, getRedirectUrl } from '@/lib/wp';
import { getMockPage } from '@/lib/mock-wp';
import { TrackImpression, TrackableButton } from '@/components/track';
import { redirect } from 'next/navigation';

export default async function Pricing() {
  const page = getMockPage('pricing');
  if (!page) return null;

  const variantCount = 1 + (page.acf?.ab_variants?.length || 0);
  const variantIndex = await assignVariant(page.id, variantCount);

  // Check for redirect
  const redirectUrl = getRedirectUrl(page, variantIndex);
  if (redirectUrl) redirect(redirectUrl);

  const content = applyVariant(page, variantIndex);

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8 max-w-2xl mx-auto">
      <TrackImpression postId={page.id} variantIndex={variantIndex} slug="/pricing" />

      <div className="mb-4 text-xs text-zinc-500 font-mono">
        variant {variantIndex}/{variantCount - 1} ({content._variantName})
      </div>

      <h1 className="text-4xl font-bold mb-4">{content.title.rendered}</h1>
      <p className="text-zinc-400 mb-8">
        {content.acf?.subtitle as string || content.excerpt.rendered}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="p-6 rounded-xl bg-zinc-900">
          <h2 className="text-xl font-bold">Starter</h2>
          <p className="text-3xl font-bold mt-2">$29<span className="text-lg text-zinc-500">/mo</span></p>
          <TrackableButton
            postId={page.id}
            variantIndex={variantIndex}
            slug="/pricing"
            eventName="cta_click_starter"
            href={content.acf?.cta_url as string}
            className="mt-4 w-full py-3 rounded-lg bg-emerald-500 font-semibold hover:bg-emerald-400 transition"
          >
            {content.acf?.cta_text as string || 'Get Started'}
          </TrackableButton>
        </div>
        <div className="p-6 rounded-xl bg-zinc-900 ring-2 ring-emerald-500">
          <h2 className="text-xl font-bold">Pro</h2>
          <p className="text-3xl font-bold mt-2">$79<span className="text-lg text-zinc-500">/mo</span></p>
          <TrackableButton
            postId={page.id}
            variantIndex={variantIndex}
            slug="/pricing"
            eventName="cta_click_pro"
            href={content.acf?.cta_url as string}
            className="mt-4 w-full py-3 rounded-lg bg-emerald-500 font-semibold hover:bg-emerald-400 transition"
          >
            {content.acf?.cta_text as string || 'Get Started'}
          </TrackableButton>
        </div>
      </div>
    </main>
  );
}
