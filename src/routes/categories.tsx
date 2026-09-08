import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeading, SiteShell } from "@/components/site/SiteShell";
import { useStoreData } from "@/hooks/use-store-data";
import { approvedSellers, categories, categoryById } from "@/lib/api";
import { imageForCategorySlug } from "@/lib/images";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Categories — Bakers, Mehendi, Bridal & Crafts | NammaSpot" },
      {
        name: "description",
        content:
          "Browse NammaSpot categories: home bakers, mehendi artists, bridal makeup, crochet, artists, boutiques, handmade decor and wedding gifting in Chennai.",
      },
      { property: "og:title", content: "Categories — NammaSpot" },
      {
        property: "og:description",
        content: "Eight local craft categories across Chennai and Tamil Nadu.",
      },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { data: sellers } = useStoreData(approvedSellers);
  const { data: cats } = useStoreData(categories);

  const count = (categoryId: string) =>
    (sellers ?? []).filter((s) => s.categoryId === categoryId).length;

  return (
    <SiteShell>
      <PageHeading
        eyebrow="Categories"
        title="Crafts of Chennai"
        subtitle="Every category is run by real people you can message directly."
      />
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:grid-cols-2 lg:grid-cols-3 lg:px-6">
        {(cats ?? []).map((c) => (
          <Link
            key={c.id}
            to="/explore"
            search={{ category: c.slug }}
            className="group card-soft overflow-hidden hover:border-primary"
          >
            <img
              src={imageForCategorySlug(c.slug)}
              alt={c.name}
              loading="lazy"
              className="h-36 w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-base font-bold">{c.name}</h2>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {count(c.id)} sellers
                </span>
              </div>
              <p className="mt-0.5 text-xs text-primary/80">{c.tamilName}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{c.blurb}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-8 lg:px-6">
        <h2 className="text-xl font-extrabold">Popular right now</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {(sellers ?? [])
            .slice()
            .sort((a, b) => b.reviewCount - a.reviewCount)
            .slice(0, 6)
            .map((s) => (
              <li key={s.id}>
                <Link
                  to="/seller/$slug"
                  params={{ slug: s.slug }}
                  className="card-soft flex items-center justify-between gap-3 px-4 py-3 text-sm hover:border-primary"
                >
                  <span className="min-w-0 truncate font-semibold">{s.businessName}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {categoryById(s.categoryId)?.name}
                  </span>
                </Link>
              </li>
            ))}
        </ul>
      </div>
    </SiteShell>
  );
}
