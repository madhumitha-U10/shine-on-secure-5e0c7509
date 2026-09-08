import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { useState } from "react";

import { SellerCard } from "@/components/site/SellerCard";
import { PageHeading, SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { useStoreData } from "@/hooks/use-store-data";
import { approvedSellers } from "@/lib/api";

const NEIGHBOURHOODS = [
  "Mylapore",
  "Adyar",
  "Besant Nagar",
  "T Nagar",
  "Anna Nagar",
  "Velachery",
  "Kodambakkam",
  "Villivakkam",
];

export const Route = createFileRoute("/near-me")({
  head: () => ({
    meta: [
      { title: "Near Me — Sellers by Chennai Neighbourhood | NammaSpot" },
      {
        name: "description",
        content:
          "Pick your Chennai neighbourhood — Mylapore, Adyar, T Nagar, Anna Nagar, Velachery — and see local makers who deliver or visit nearby.",
      },
      { property: "og:title", content: "Near Me — NammaSpot" },
      {
        property: "og:description",
        content: "Local Chennai sellers sorted by neighbourhood and city-wide delivery.",
      },
    ],
  }),
  component: NearMe,
});

function NearMe() {
  const [area, setArea] = useState("Mylapore");
  const { data: sellers } = useStoreData(approvedSellers);

  const inArea = (sellers ?? []).filter((s) => s.area === area);
  const nearby = (sellers ?? []).filter((s) => s.area !== area && s.deliversAcrossCity);

  return (
    <SiteShell>
      <PageHeading
        eyebrow="Near Me"
        title="Who's close by?"
        subtitle="Pick your area — we show sellers in the neighbourhood first, then those who deliver across the city."
      />
      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
        <div className="flex flex-wrap gap-2">
          {NEIGHBOURHOODS.map((n) => (
            <Button
              key={n}
              size="sm"
              variant={n === area ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setArea(n)}
            >
              <MapPin className="size-3.5" /> {n}
            </Button>
          ))}
        </div>

        <h2 className="mt-8 text-lg font-extrabold">In {area}</h2>
        {inArea.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No seller listed in {area} yet — check the city-wide list below.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inArea.map((s) => (
              <SellerCard key={s.id} seller={s} />
            ))}
          </div>
        )}

        <h2 className="mt-10 text-lg font-extrabold">Delivers across Chennai</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {nearby.map((s) => (
            <SellerCard key={s.id} seller={s} />
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
