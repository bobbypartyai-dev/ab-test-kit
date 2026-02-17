/**
 * /pricing-v2 — Challenger version (redirect test)
 * 
 * Users never see "/pricing-v2" in their browser — the middleware
 * does a rewrite, so the URL bar still shows "/pricing".
 * 
 * This is a completely different page. Design it however you want.
 * In WordPress: just create a new page with slug "pricing-v2".
 */
import { getVariant } from '@/lib/ab';
import { TrackImpression } from '@/components/track';

export default async function PricingV2() {
  const variant = await getVariant('pricing-redesign');

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-950 to-zinc-950 text-white p-8 max-w-2xl mx-auto">
      <TrackImpression testId="pricing-redesign" variant={variant || '1'} slug="/pricing" />

      <div className="mb-4 text-xs text-zinc-500 font-mono">
        pricing-redesign: variant {variant} (challenger v2)
      </div>

      <h1 className="text-4xl font-bold mb-4">Choose your plan</h1>
      <p className="text-emerald-300 mb-8">Start free. Upgrade when you&apos;re ready. Cancel anytime.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="p-6 rounded-xl bg-white/5 backdrop-blur">
          <h2 className="text-xl font-bold">Starter</h2>
          <p className="text-3xl font-bold mt-2">Free</p>
          <p className="text-zinc-400 text-sm mt-1">then $29/mo</p>
          <button className="mt-4 w-full py-3 rounded-lg bg-emerald-500 font-semibold hover:bg-emerald-400 transition">
            Start Free
          </button>
        </div>
        <div className="p-6 rounded-xl bg-white/5 backdrop-blur ring-2 ring-emerald-400">
          <h2 className="text-xl font-bold">Pro</h2>
          <p className="text-3xl font-bold mt-2">$79<span className="text-lg text-zinc-500">/mo</span></p>
          <p className="text-emerald-400 text-sm mt-1">Most popular</p>
          <button className="mt-4 w-full py-3 rounded-lg bg-emerald-500 font-semibold hover:bg-emerald-400 transition">
            Start Free
          </button>
        </div>
      </div>
    </main>
  );
}
