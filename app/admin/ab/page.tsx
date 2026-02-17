/**
 * /admin/ab — A/B Test Dashboard
 * 
 * Shows results for all active tests.
 * Pulls data from WordPress REST API: GET /wp-json/ab/v1/results
 * 
 * For the demo, uses the local /api/ab endpoint.
 * In production, point WP_URL to your WordPress site.
 */
'use client';

import { useEffect, useState } from 'react';

const WP_URL = process.env.NEXT_PUBLIC_WP_URL || '';

type VariantResult = {
  index: number;
  label: string;
  impressions: number;
  conversions: number;
  rate: string;
  events: Record<string, number>;
};

type TestResult = {
  post_id: number;
  title: string;
  slug: string;
  variants: VariantResult[];
};

export default function ABDashboard() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResults = async () => {
    try {
      // Production: fetch from WordPress
      // const res = await fetch(`${WP_URL}/wp-json/ab/v1/results`);
      
      // Demo: fetch from local API
      const res = await fetch('/api/ab');
      const data = await res.json();
      
      // Transform the local API format to match WP format
      if (Array.isArray(data)) {
        setResults(data);
      } else {
        // Local API returns { testId: { variant: { impressions, conversions, rate } } }
        const transformed: TestResult[] = Object.entries(data).map(([testId, variants]) => ({
          post_id: 0,
          title: testId,
          slug: testId,
          variants: Object.entries(variants as Record<string, { impressions: number; conversions: number; rate: string }>).map(([key, v], i) => ({
            index: i,
            label: i === 0 ? 'Control' : `Variant ${key}`,
            impressions: v.impressions,
            conversions: v.conversions,
            rate: v.rate,
            events: {},
          })),
        }));
        setResults(transformed);
      }
    } catch {
      console.error('Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
    const i = setInterval(fetchResults, 5000);
    return () => clearInterval(i);
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">A/B Tests</h1>
          <p className="text-zinc-500 text-sm mt-1">Results auto-refresh every 5 seconds</p>
        </div>
        <a href="/" className="text-sm text-zinc-400 hover:text-white">← Demo pages</a>
      </div>

      {loading && <p className="text-zinc-500">Loading...</p>}

      {!loading && results.length === 0 && (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-xl mb-2">No test data yet</p>
          <p>Visit the demo pages to generate impressions</p>
        </div>
      )}

      {results.map((test) => {
        // Find the best performing variant
        const rates = test.variants.map(v => 
          v.impressions > 0 ? v.conversions / v.impressions : 0
        );
        const bestIdx = rates.indexOf(Math.max(...rates));
        const totalImpressions = test.variants.reduce((s, v) => s + v.impressions, 0);

        return (
          <div key={test.post_id || test.title} className="mb-8 rounded-2xl bg-zinc-900 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{test.title}</h2>
                <span className="text-xs text-zinc-500 font-mono">/{test.slug} · {totalImpressions} total impressions</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active" />
            </div>

            {/* Variants grid */}
            <div className="grid gap-px bg-zinc-800" style={{ gridTemplateColumns: `repeat(${test.variants.length}, 1fr)` }}>
              {test.variants.map((v, i) => (
                <div key={i} className={`p-5 bg-zinc-900 ${i === bestIdx && totalImpressions > 20 ? 'ring-2 ring-emerald-500/50 ring-inset' : ''}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="font-semibold">{v.label}</span>
                    {i === bestIdx && totalImpressions > 20 && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">LEADING</span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-3xl font-bold">{v.impressions}</p>
                      <p className="text-xs text-zinc-500">Impressions</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{v.conversions}</p>
                      <p className="text-xs text-zinc-500">Conversions</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-emerald-400">{v.rate}</p>
                      <p className="text-xs text-zinc-500">Conversion Rate</p>
                    </div>
                  </div>

                  {/* Custom events */}
                  {Object.keys(v.events || {}).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-2 font-semibold">Events</p>
                      {Object.entries(v.events).map(([name, count]) => (
                        <div key={name} className="flex justify-between text-sm">
                          <span className="text-zinc-400">{name}</span>
                          <span className="font-mono">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </main>
  );
}
