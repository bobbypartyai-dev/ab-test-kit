import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">A/B Test Kit</h1>
      <p className="text-zinc-400 mb-8">Minimal A/B testing for headless Next.js. Zero flicker. Edge middleware.</p>
      
      <div className="space-y-4">
        <Link href="/pricing" className="block p-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition">
          <span className="font-semibold">/pricing</span>
          <span className="text-zinc-500 ml-2">→ redirect test (50% see /pricing-v2)</span>
        </Link>
        
        <Link href="/services/web" className="block p-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition">
          <span className="font-semibold">/services/web</span>
          <span className="text-zinc-500 ml-2">→ content test (headline swap)</span>
        </Link>
        
        <Link href="/services/app" className="block p-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition">
          <span className="font-semibold">/services/app</span>
          <span className="text-zinc-500 ml-2">→ content test (same test, different page)</span>
        </Link>

        <Link href="/admin/ab" className="block p-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition">
          <span className="font-semibold">/admin/ab</span>
          <span className="text-zinc-500 ml-2">→ dashboard</span>
        </Link>
      </div>

      <div className="mt-12 p-4 rounded-lg bg-zinc-900 text-sm text-zinc-400">
        <p className="font-semibold text-zinc-300 mb-2">How it works:</p>
        <ol className="list-decimal pl-4 space-y-1">
          <li>Edit <code className="text-emerald-400">ab-tests.ts</code> to define tests</li>
          <li><code className="text-emerald-400">middleware.ts</code> assigns variants at the edge (before render)</li>
          <li>Read variants in components via <code className="text-emerald-400">getVariant()</code> / <code className="text-emerald-400">getVariantMeta()</code></li>
          <li>Track events via <code className="text-emerald-400">POST /api/ab</code></li>
        </ol>
      </div>
    </main>
  );
}
