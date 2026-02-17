/**
 * lib/mock-wp.ts — Simulates WordPress REST API responses
 * 
 * DELETE THIS FILE when connecting to real WordPress.
 * Replace getPageBySlug() calls with actual WP REST API fetches.
 */

import type { WPPage } from './wp';

const mockPages: Record<string, WPPage> = {
  home: {
    id: 1,
    slug: 'home',
    title: { rendered: 'Welcome to Our Agency' },
    content: { rendered: '<p>We help businesses grow with modern web solutions.</p>' },
    excerpt: { rendered: 'Full-service digital agency' },
    featured_media: 0,
    acf: {
      hero_image: 'https://picsum.photos/seed/home/1200/600',
      subtitle: 'Full-service digital agency',
      cta_text: 'Get a Quote',
      cta_url: '/contact',
      ab_variants: [
        {
          ab_variant_name: 'Shorter headline',
          ab_title: 'We Build What Matters',
          ab_description: 'Modern web. Real results.',
          ab_bg_image: 'https://picsum.photos/seed/home-b/1200/600',
          ab_bg_video: '',
          ab_cta_text: 'Start a Project',
          ab_cta_url: '/contact',
          ab_redirect_url: '',
        },
      ],
    },
  },
  pricing: {
    id: 2,
    slug: 'pricing',
    title: { rendered: 'Pricing Plans' },
    content: { rendered: '<p>Simple, transparent pricing.</p>' },
    excerpt: { rendered: 'Choose the right plan for your team' },
    featured_media: 0,
    acf: {
      hero_image: 'https://picsum.photos/seed/pricing/1200/600',
      subtitle: 'Choose the right plan for your team',
      cta_text: 'Get Started',
      cta_url: '/signup',
      ab_variants: [
        {
          ab_variant_name: 'Free trial emphasis',
          ab_title: 'Start Free, Scale Fast',
          ab_description: 'No credit card required. Upgrade when you\'re ready.',
          ab_bg_image: 'https://picsum.photos/seed/pricing-b/1200/600',
          ab_bg_video: '',
          ab_cta_text: 'Start Free Trial',
          ab_cta_url: '/signup?trial=true',
          ab_redirect_url: '',
        },
        {
          ab_variant_name: 'Redirect to new pricing page',
          ab_title: '',
          ab_description: '',
          ab_bg_image: false,
          ab_bg_video: '',
          ab_cta_text: '',
          ab_cta_url: '',
          ab_redirect_url: '/pricing-v2',
        },
      ],
    },
  },
  services: {
    id: 3,
    slug: 'services',
    title: { rendered: 'Our Services' },
    content: { rendered: '<p>From strategy to execution, we do it all.</p>' },
    excerpt: { rendered: 'Web, mobile, and cloud solutions' },
    featured_media: 0,
    acf: {
      hero_image: 'https://picsum.photos/seed/services/1200/600',
      subtitle: 'Web, mobile, and cloud solutions',
      cta_text: 'Learn More',
      cta_url: '/contact',
      ab_variants: [], // No test on this page
    },
  },
};

export function getMockPage(slug: string): WPPage | null {
  return mockPages[slug] || null;
}
