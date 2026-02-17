/**
 * /pricing — Control version
 * 
 * This also has a CONTENT test (cta) running on it.
 * The middleware sets ab-cta=A or ab-cta=B as a cookie.
 * We read it here to swap the CTA button.
 */
import { getVariant, getVariantMeta } from '@/lib/ab';
import { TrackImpression } from '@/components/track';

export default async function Pricing() {
  const ctaVariant = await getVariant('cta');
  const ctaMeta = await getVariantMeta('cta');
  const pricingVariant = await getVariant('pricing-redesign');

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8 max-w-2xl mx-auto">
      <TrackImpression testId="pricing-redesign" variant={pricingVariant || '0'} slug="/pricing" />
      <TrackImpression testId="cta" variant={ctaVariant || 'A'} slug="/pricing" />

      <div className="mb-4 text-xs text-zinc-500 font-mono">
        pricing-redesign: variant {pricingVariant || '0'} (control) · cta: variant {ctaVariant}
      </div>

      <h1 className="text-4xl font-bold mb-4">Pricing</h1>
      <p className="text-zinc-400 mb-8">Simple, transparent pricing for teams of all sizes.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="p-6 rounded-xl bg-zinc-900">
          <h2 className="text-xl font-bold">Starter</h2>
          <p className="text-3xl font-bold mt-2">$29<span className="text-lg text-zinc-500">/mo</span></p>
          <button
            className="mt-4 w-full py-3 rounded-lg font-semibold transition"
            style={{ backgroundColor: ctaMeta?.ctaColor || '#3B82F6' }}
          >
            {ctaMeta?.ctaText || 'Get Started'}
          </button>
        </div>
        <div className="p-6 rounded-xl bg-zinc-900 ring-2 ring-emerald-500">
          <h2 className="text-xl font-bold">Pro</h2>
          <p className="text-3xl font-bold mt-2">$79<span className="text-lg text-zinc-500">/mo</span></p>
          <button
            className="mt-4 w-full py-3 rounded-lg font-semibold transition"
            style={{ backgroundColor: ctaMeta?.ctaColor || '#3B82F6' }}
          >
            {ctaMeta?.ctaText || 'Get Started'}
          </button>
        </div>
      </div>
    </main>
  );
}
