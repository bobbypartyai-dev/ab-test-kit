/**
 * /admin/ab — Simple dashboard showing test results
 * 
 * In production, protect this route (check auth in middleware).
 */
'use client';

import { useEffect, useState } from 'react';
import { tests } from '@/ab-tests';

type Results = Record<string, Record<string, { impressions: number; conversions: number; rate: string }>>;

export default function ABDashboard() {
  const [results, setResults] = useState<Results>({});

  useEffect(() => {
    fetch('/api/ab').then(r => r.json()).then(setResults);
    const i = setInterval(() => fetch('/api/ab').then(r => r.json()).then(setResults), 5000);
    return () => clearInterval(i);
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">A/B Test Dashboard</h1>
      <p className="text-zinc-500 mb-8 text-sm">Auto-refreshes every 5s. Data resets on deploy (use Postgres for persistent storage).</p>

      {tests.map(test => (
        <div key={test.id} className="mb-8 p-6 rounded-xl bg-zinc-900">
          <div className="flex items-center gap-3 mb-4">
            <span className={`w-2 h-2 rounded-full ${test.active ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
            <h2 className="text-xl font-bold">{test.id}</h2>
            <span className="text-xs text-zinc-500 font-mono">{test.type} · {test.match}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {test.variants.map((v, i) => {
              const key = test.type === 'content' ? (v.value || String(i)) : String(i);
              const data = results[test.id]?.[key];

              return (
                <div key={i} className="p-4 rounded-lg bg-zinc-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">
                      {i === 0 ? 'Control' : `Variant ${key}`}
                    </span>
                    <span className="text-xs text-zinc-500">{v.weight}%</span>
                  </div>
                  {v.url && <p className="text-xs text-zinc-500 mb-2 font-mono">{v.url}</p>}
                  {v.meta && <p className="text-xs text-zinc-500 mb-2 font-mono">{JSON.stringify(v.meta)}</p>}
                  
                  <div className="grid grid-cols-3 gap-2 text-center mt-3">
                    <div>
                      <p className="text-2xl font-bold">{data?.impressions || 0}</p>
                      <p className="text-xs text-zinc-500">Views</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{data?.conversions || 0}</p>
                      <p className="text-xs text-zinc-500">Conversions</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-400">{data?.rate || '0%'}</p>
                      <p className="text-xs text-zinc-500">CVR</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </main>
  );
}
