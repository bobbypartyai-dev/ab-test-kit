/**
 * lib/track.ts — Send tracking events to WordPress
 * 
 * All tracking data goes back to your WordPress database via the
 * REST API endpoint registered by the plugin.
 * 
 * Call from client components using sendBeacon (fire-and-forget).
 */

const WP_URL = process.env.NEXT_PUBLIC_WP_URL || '';

export type TrackEvent = {
  post_id: number;         // WordPress post/page ID
  variant_index: number;   // 0 = control, 1+ = variants
  event_type: 'impression' | 'conversion' | 'event';
  event_name?: string;     // For custom events: "cta_click", "form_submit", etc.
  slug?: string;           // The Next.js URL path
  uid?: string;            // From ab-uid cookie
};

/**
 * Track an event (calls WordPress REST API).
 * Uses sendBeacon for reliability — won't block page navigation.
 */
export function track(event: TrackEvent): void {
  const url = `${WP_URL}/wp-json/ab/v1/track`;
  
  // sendBeacon is fire-and-forget: doesn't block, survives page navigation
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon(url, JSON.stringify(event));
  } else {
    // Fallback for environments without sendBeacon
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      keepalive: true,
    }).catch(() => {}); // Silently fail — tracking should never break the site
  }
}

/**
 * Convenience: track an impression
 */
export function trackImpression(postId: number, variantIndex: number, slug?: string) {
  const uid = getCookie('ab-uid');
  track({ post_id: postId, variant_index: variantIndex, event_type: 'impression', slug, uid });
}

/**
 * Convenience: track a conversion (CTA click, form submit, etc.)
 */
export function trackConversion(postId: number, variantIndex: number, slug?: string) {
  const uid = getCookie('ab-uid');
  track({ post_id: postId, variant_index: variantIndex, event_type: 'conversion', slug, uid });
}

/**
 * Track a custom event (scroll depth, video play, etc.)
 */
export function trackEvent(postId: number, variantIndex: number, eventName: string, slug?: string) {
  const uid = getCookie('ab-uid');
  track({ post_id: postId, variant_index: variantIndex, event_type: 'event', event_name: eventName, slug, uid });
}

/** Read a cookie value */
function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : '';
}
