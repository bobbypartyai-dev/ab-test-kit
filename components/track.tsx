/**
 * components/track.tsx — Lightweight impression + conversion tracking
 * 
 * Drop <TrackImpression> into any page to record a view.
 * Call trackConversion() on CTA clicks.
 * 
 * Uses sendBeacon (fire-and-forget, doesn't block navigation).
 */
'use client';

import { useEffect, useRef } from 'react';

export function TrackImpression({ testId, variant, slug }: { testId: string; variant: string; slug: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    // sendBeacon is fire-and-forget — won't slow down page load
    navigator.sendBeacon('/api/ab', JSON.stringify({
      testId,
      variant,
      slug,
      event: 'impression',
    }));
  }, [testId, variant, slug]);

  return null; // Renders nothing
}

/**
 * Call this on CTA clicks:
 *   <button onClick={() => trackConversion('cta', '1', '/pricing')}>Buy</button>
 */
export function trackConversion(testId: string, variant: string, slug: string) {
  navigator.sendBeacon('/api/ab', JSON.stringify({
    testId,
    variant,
    slug,
    event: 'conversion',
  }));
}
