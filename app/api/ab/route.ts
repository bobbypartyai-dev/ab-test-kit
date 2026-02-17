/**
 * /api/ab — Tracking + Results in ONE endpoint
 * 
 * POST /api/ab — Record an event (impression or conversion)
 *   Body: { testId: "pricing-redesign", variant: "0", event: "impression", slug: "/pricing" }
 * 
 * GET /api/ab — Get results for all tests
 *   Returns aggregated impressions, conversions, and conversion rates per variant
 * 
 * STORAGE: In-memory Map for this demo. In production, swap for Postgres:
 * 
 *   CREATE TABLE ab_events (
 *     id         serial PRIMARY KEY,
 *     test_id    text NOT NULL,
 *     variant    text NOT NULL,
 *     slug       text,
 *     event      text NOT NULL,  -- 'impression' or 'conversion'
 *     uid        text,           -- from ab-uid cookie
 *     created_at timestamptz DEFAULT now()
 *   );
 *   CREATE INDEX idx_ab_test ON ab_events(test_id, variant, event);
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory store (resets on deploy — use Postgres for real)
const events: { testId: string; variant: string; slug: string; event: string; ts: number }[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { testId, variant, event, slug } = body;

    if (!testId || variant === undefined || !event) {
      return NextResponse.json({ error: 'Missing testId, variant, or event' }, { status: 400 });
    }

    events.push({ testId, variant: String(variant), slug: slug || '', event, ts: Date.now() });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}

export async function GET() {
  // Aggregate events into results per test
  const results: Record<string, Record<string, { impressions: number; conversions: number }>> = {};

  for (const e of events) {
    if (!results[e.testId]) results[e.testId] = {};
    if (!results[e.testId][e.variant]) results[e.testId][e.variant] = { impressions: 0, conversions: 0 };

    if (e.event === 'impression') results[e.testId][e.variant].impressions++;
    if (e.event === 'conversion') results[e.testId][e.variant].conversions++;
  }

  // Calculate conversion rates
  const output: Record<string, Record<string, { impressions: number; conversions: number; rate: string }>> = {};
  for (const [testId, variants] of Object.entries(results)) {
    output[testId] = {};
    for (const [variant, data] of Object.entries(variants)) {
      output[testId][variant] = {
        ...data,
        rate: data.impressions > 0 ? (data.conversions / data.impressions * 100).toFixed(1) + '%' : '0%',
      };
    }
  }

  return NextResponse.json(output);
}
