/**
 * /services/[slug] — Dynamic page with content test
 * 
 * This is the pattern you'll use most in your headless WP app.
 * 
 * In production, replace the mock content below with your WP fetch:
 *   const page = await fetch(`${WP_URL}/wp-json/wp/v2/pages?slug=${slug}`);
 * 
 * The A/B variant is read from a cookie set by middleware.
 * If variant B has meta overrides, they take priority over WP content.
 */
import { getVariant, getVariantMeta } from '@/lib/ab';
import { TrackImpression } from '@/components/track';

// Mock WP content (replace with your actual WP fetch)
const mockContent: Record<string, { headline: string; description: string; bg: string }> = {
  web: {
    headline: 'Web Development',
    description: 'We build fast, modern websites that convert.',
    bg: 'https://picsum.photos/seed/web/1200/600',
  },
  app: {
    headline: 'App Development',
    description: 'Native and cross-platform mobile apps.',
    bg: 'https://picsum.photos/seed/app/1200/600',
  },
};

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const heroVariant = await getVariant('hero');
  const heroMeta = await getVariantMeta('hero');

  // Get "WordPress" content
  const wp = mockContent[slug] || { headline: slug, description: 'Service page', bg: '' };

  // Apply variant overrides (meta fields replace WP fields)
  const headline = heroMeta?.headline || wp.headline;
  const bg = heroMeta?.bg || wp.bg;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <TrackImpression testId="hero" variant={heroVariant || 'A'} slug={`/services/${slug}`} />

      <div className="mb-4 p-4 text-xs text-zinc-500 font-mono">
        hero test: variant {heroVariant} · slug: /services/{slug}
      </div>

      {/* Hero with variant bg */}
      <div className="relative h-72 overflow-hidden">
        {bg && <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />}
        <div className="relative z-10 flex items-center justify-center h-full">
          <h1 className="text-5xl font-bold text-center px-4">{headline}</h1>
        </div>
      </div>

      <div className="p-8 max-w-2xl mx-auto">
        <p className="text-lg text-zinc-400">{wp.description}</p>
      </div>
    </main>
  );
}
