/**
 * [slug]/page.tsx — Dynamic page with A/B testing
 * 
 * THIS IS THE KEY FILE. Here's the flow:
 * 
 * 1. Fetch the page from WordPress (with ACF fields including ab_variants)
 * 2. Count the variants (control + ACF variants)
 * 3. Assign this user to a variant (deterministic hash of their UID + post ID)
 * 4. If it's a redirect variant → rewrite (handled here or middleware)
 * 5. Apply content overrides from the variant
 * 6. Render — user sees their variant, zero flicker
 * 7. Track the impression
 * 
 * IN PRODUCTION: Replace getMockPage() with getPageBySlug() from lib/wp.ts
 */

import { assignVariant } from '@/lib/ab';
import { applyVariant, getRedirectUrl } from '@/lib/wp';
import { getMockPage } from '@/lib/mock-wp';
import { TrackImpression, TrackableButton } from '@/components/track';
import { redirect } from 'next/navigation';

export default async function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // ── Step 1: Fetch from WordPress ──────────────────────────
  // PRODUCTION: const page = await getPageBySlug(slug);
  const page = getMockPage(slug);
  if (!page) return <div className="p-8 text-white">Page not found</div>;

  // ── Step 2: Count variants ────────────────────────────────
  // Control (original) + ACF variants
  const variantCount = 1 + (page.acf?.ab_variants?.length || 0);
  const hasTest = variantCount > 1;

  // ── Step 3: Assign variant ────────────────────────────────
  const variantIndex = hasTest ? await assignVariant(page.id, variantCount) : 0;

  // ── Step 4: Check for redirect ────────────────────────────
  if (hasTest && variantIndex > 0) {
    const redirectUrl = getRedirectUrl(page, variantIndex);
    if (redirectUrl) {
      redirect(redirectUrl);
    }
  }

  // ── Step 5: Apply content overrides ───────────────────────
  const content = applyVariant(page, variantIndex);

  // ── Step 6: Render ────────────────────────────────────────
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Step 7: Track impression */}
      <TrackImpression postId={page.id} variantIndex={variantIndex} slug={`/${slug}`} />

      {/* Debug bar — remove in production */}
      <div className="bg-zinc-900 px-4 py-2 text-xs text-zinc-500 font-mono flex gap-4">
        <span>post_id: {page.id}</span>
        <span>variant: {variantIndex}/{variantCount - 1} ({content._variantName})</span>
        <span>test active: {hasTest ? 'yes' : 'no'}</span>
      </div>

      {/* Hero */}
      <div className="relative h-80 overflow-hidden">
        {content.acf?.hero_image && (
          <img
            src={content.acf.hero_image as string}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
        )}
        {content.acf?.hero_video && (
          <video
            src={content.acf.hero_video as string}
            autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
        )}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">{content.title.rendered}</h1>
          <p className="text-xl text-zinc-300 mb-8">
            {content.acf?.subtitle as string || content.excerpt.rendered}
          </p>
          {content.acf?.cta_text && (
            <TrackableButton
              postId={page.id}
              variantIndex={variantIndex}
              slug={`/${slug}`}
              eventName="cta_click"
              href={content.acf.cta_url as string}
              className="px-8 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-400 transition"
            >
              {content.acf.cta_text as string}
            </TrackableButton>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className="max-w-2xl mx-auto p-8 prose prose-invert"
        dangerouslySetInnerHTML={{ __html: content.content.rendered }}
      />
    </main>
  );
}
