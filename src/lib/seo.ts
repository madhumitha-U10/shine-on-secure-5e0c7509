/** Shared SEO helpers (canonical links + structured data). */

export function canonicalLink(origin: string | undefined, path: string) {
  if (!origin) return [];
  const clean = path.startsWith("/") ? path : `/${path}`;
  return [{ rel: "canonical", href: `${origin}${clean === "/" ? "" : clean}` }];
}

export function jsonLdScript(data: unknown) {
  return [{ type: "application/ld+json", children: JSON.stringify(data) }];
}

export function localBusinessSchema(input: {
  origin?: string | undefined;
  slug: string;
  name: string;
  description: string;
  area: string;
  city: string;
  image?: string | undefined;
  rating?: number | undefined;
  reviewCount?: number | undefined;
  priceFrom?: number | undefined;
  instagram?: string | undefined;
  phone?: string | undefined;
}) {
  const url = input.origin ? `${input.origin}/seller/${input.slug}` : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: input.name,
    description: input.description,
    ...(url ? { url, "@id": url } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.phone ? { telephone: `+${input.phone}` } : {}),
    ...(input.instagram ? { sameAs: [`https://instagram.com/${input.instagram}`] } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: input.area,
      addressRegion: "Tamil Nadu",
      addressCountry: "IN",
    },
    ...(input.priceFrom ? { priceRange: `From ₹${input.priceFrom}` } : {}),
    ...(input.rating && input.reviewCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: input.rating,
            reviewCount: input.reviewCount,
          },
        }
      : {}),
  };
}
