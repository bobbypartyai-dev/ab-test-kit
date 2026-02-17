/**
 * components/track.tsx — A/B tracking components
 * 
 * <TrackImpression> — drop into any page, fires once on mount
 * <TrackableButton> — CTA button that tracks conversions + custom events
 */
'use client';

import { useEffect, useRef } from 'react';
import { trackImpression, trackConversion, trackEvent } from '@/lib/track';

/** Fires an impression event once when the component mounts */
export function TrackImpression({ postId, variantIndex, slug }: {
  postId: number;
  variantIndex: number;
  slug?: string;
}) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackImpression(postId, variantIndex, slug);
  }, [postId, variantIndex, slug]);
  return null;
}

/** Button that tracks a conversion on click */
export function TrackableButton({ postId, variantIndex, slug, eventName, children, className, href, onClick }: {
  postId: number;
  variantIndex: number;
  slug?: string;
  eventName?: string;    // Optional custom event name (e.g. "cta_click", "signup_click")
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
}) {
  const handleClick = () => {
    // Always track conversion
    trackConversion(postId, variantIndex, slug);
    
    // Track custom event if specified
    if (eventName) {
      trackEvent(postId, variantIndex, eventName, slug);
    }

    onClick?.();

    // Navigate if href provided (small delay to let beacon fire)
    if (href) {
      setTimeout(() => { window.location.href = href; }, 100);
    }
  };

  return (
    <button className={className} onClick={handleClick}>
      {children}
    </button>
  );
}
