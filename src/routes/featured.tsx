import { createFileRoute } from "@tanstack/react-router";

import { SellerCard } from "@/components/site/SellerCard";
import { PageHeading, SiteShell } from "@/components/site/SiteShell";
import { useStoreData } from "@/hooks/use-store-data";
import { approvedSellers, categoryById, inr } from "@/lib/api";

export const Route = createFileRoute("/featured")({
  head: () => ({
    meta: [
      { title: "Featured Chennai Makers — NammaSpot" },
      {
        name: "description",
        content:
          "This week's featured Chennai small businesses on NammaSpot — hand-picked bakers, mehendi artists, bridal studios and craft makers.",
      },
      { property: "og:title", content: "Featured Chennai Makers — NammaSpot" },
      {
        property: "og:description",
        content: "Hand-picked local sellers, reviewed by the NammaSpot team.",
      },
    ],
  }),
  component: Featured,
});

function Featured() {
  const { data: sellers } = useStoreData(approvedSellers);
  const featured = (sellers ?? []).filter((s) => s.featured);
  const topRated = (sellers ?? [])
    .slice()
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  return (
    <SiteShell>
      <PageHeading
        eyebrow="Featured"
        title="Hand-picked this week"
        subtitle="Chosen for craft, consistency and how they treat customers."
      />
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((s) => (
            <SellerCard key={s.id} seller={s} />
          ))}
        </div>

        <h2 className="mt-12 text-xl font-extrabold">Top rated overall</h2>
        <div className="card-soft mt-4 divide-y divide-border">
          {topRated.map((s, i) => (
            <div
              key={s.id}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3"
            >
              <span className="w-6 shrink-0 font-display text-lg font-extrabold text-primary">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{s.businessName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {categoryById(s.categoryId)?.name} · {s.area}
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-primary">
                {s.rating ? s.rating.toFixed(1) : "New"} · {inr(s.priceFrom)}+
              </span>
            </div>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
