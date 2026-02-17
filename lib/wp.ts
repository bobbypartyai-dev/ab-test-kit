/**
 * lib/wp.ts — Fetch pages + A/B variants from WordPress
 * 
 * SETUP: Set your WordPress URL in .env.local:
 *   NEXT_PUBLIC_WP_URL=https://your-site.com
 * 
 * This fetches the page content AND any ACF A/B variants in one call.
 * The ACF fields are registered by the WordPress plugin.
 */

const WP_URL = process.env.NEXT_PUBLIC_WP_URL || 'https://your-wordpress-site.com';

export type ABVariant = {
  ab_variant_name: string;
  ab_title: string;
  ab_description: string;
  ab_bg_image: string | false;    // ACF image returns URL string or false
  ab_bg_video: string;
  ab_cta_text: string;
  ab_cta_url: string;
  ab_redirect_url: string;
};

export type WPPage = {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  featured_media: number;
  // ACF fields (requires ACF to REST API plugin or ACF PRO)
  acf: {
    ab_variants?: ABVariant[];
    // Add your other ACF fields here
    hero_image?: string;
    hero_video?: string;
    subtitle?: string;
    cta_text?: string;
    cta_url?: string;
    [key: string]: unknown;
  };
};

/**
 * Fetch a page by slug, including ACF fields.
 * Returns null if not found.
 */
export async function getPageBySlug(slug: string): Promise<WPPage | null> {
  const res = await fetch(
    `${WP_URL}/wp-json/wp/v2/pages?slug=${encodeURIComponent(slug)}&acf_format=standard&_fields=id,slug,title,content,excerpt,featured_media,acf`,
    { next: { revalidate: 60 } } // ISR: revalidate every 60s
  );

  if (!res.ok) return null;
  const pages = await res.json();
  return pages[0] || null;
}

/**
 * Fetch all pages that have A/B tests active.
 * Used by middleware to know which URLs to intercept.
 */
export async function getActiveTests(): Promise<{ post_id: number; slug: string; variants: number }[]> {
  const res = await fetch(`${WP_URL}/wp-json/ab/v1/tests`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  return res.json();
}

/**
 * Apply variant overrides to WordPress content.
 * 
 * variant_index 0 = control (original WP content, no changes)
 * variant_index 1+ = use the ACF variant fields as overrides
 * 
 * Empty fields in the variant = keep original WP value.
 */
export function applyVariant(page: WPPage, variantIndex: number): WPPage & { _variant: number; _variantName: string } {
  const result = { ...page, _variant: variantIndex, _variantName: 'Control' };

  if (variantIndex === 0 || !page.acf?.ab_variants?.length) {
    return result;
  }

  const variant = page.acf.ab_variants[variantIndex - 1]; // -1 because 0 is control
  if (!variant) return result;

  result._variantName = variant.ab_variant_name || `Variant ${variantIndex}`;

  // Override title if set
  if (variant.ab_title) {
    result.title = { rendered: variant.ab_title };
  }

  // Override description/excerpt if set
  if (variant.ab_description) {
    result.excerpt = { rendered: variant.ab_description };
  }

  // Override ACF fields if set
  result.acf = { ...result.acf };
  if (variant.ab_bg_image) result.acf.hero_image = variant.ab_bg_image as string;
  if (variant.ab_bg_video) result.acf.hero_video = variant.ab_bg_video;
  if (variant.ab_cta_text) result.acf.cta_text = variant.ab_cta_text;
  if (variant.ab_cta_url) result.acf.cta_url = variant.ab_cta_url;

  return result;
}

/**
 * Check if a page's variant is a redirect test.
 * Returns the redirect URL or null.
 */
export function getRedirectUrl(page: WPPage, variantIndex: number): string | null {
  if (variantIndex === 0 || !page.acf?.ab_variants?.length) return null;
  const variant = page.acf.ab_variants[variantIndex - 1];
  return variant?.ab_redirect_url || null;
}
