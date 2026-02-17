import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">A/B Test Kit</h1>
      <p className="text-zinc-400 mb-8">Minimal A/B testing for headless Next.js + WordPress ACF. Zero flicker.</p>
      
      <div className="space-y-3">
        <Link href="/home" className="block p-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition">
          <span className="font-semibold">/home</span>
          <span className="text-zinc-500 ml-2">— content test (2 variants: headline + bg + CTA)</span>
        </Link>
        
        <Link href="/pricing" className="block p-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition">
          <span className="font-semibold">/pricing</span>
          <span className="text-zinc-500 ml-2">— content test + redirect test (3 variants)</span>
        </Link>
        
        <Link href="/services" className="block p-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition">
          <span className="font-semibold">/services</span>
          <span className="text-zinc-500 ml-2">— no test (control only)</span>
        </Link>

        <Link href="/admin/ab" className="block p-4 rounded-lg bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-800/50 transition">
          <span className="font-semibold text-emerald-400">/admin/ab</span>
          <span className="text-zinc-400 ml-2">— dashboard</span>
        </Link>
      </div>

      <div className="mt-10 space-y-6 text-sm text-zinc-500">
        <div className="p-4 rounded-lg bg-zinc-900">
          <p className="font-semibold text-zinc-300 mb-2">How it works</p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>In WordPress, add ACF variants to any page (title, bg, CTA overrides)</li>
            <li>Next.js middleware assigns each visitor a sticky variant</li>
            <li>Your page component reads the variant and renders accordingly</li>
            <li>Impressions + conversions track back to WordPress via REST API</li>
          </ol>
        </div>

        <div className="p-4 rounded-lg bg-zinc-900">
          <p className="font-semibold text-zinc-300 mb-2">Files</p>
          <div className="font-mono space-y-1 text-xs">
            <p><span className="text-emerald-400">wordpress/ab-testing/</span> — WP plugin (ACF fields + REST API + tracking table)</p>
            <p><span className="text-emerald-400">middleware.ts</span> — Edge: assigns user ID</p>
            <p><span className="text-emerald-400">lib/ab.ts</span> — Assigns variant in server components</p>
            <p><span className="text-emerald-400">lib/wp.ts</span> — Fetches pages + applies variant overrides</p>
            <p><span className="text-emerald-400">lib/track.ts</span> — Sends events to WordPress REST API</p>
            <p><span className="text-emerald-400">components/track.tsx</span> — TrackImpression + TrackableButton</p>
          </div>
        </div>
      </div>
    </main>
  );
}
