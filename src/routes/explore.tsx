import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { SellerCard } from "@/components/site/SellerCard";
import { PageHeading, SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SellerCardSkeleton } from "@/components/ui/SellerCardSkeleton";
import { useStoreData } from "@/hooks/use-store-data";
import { areas, categories, searchSellers, type SearchFilters } from "@/lib/api";

type ExploreSearch = {
  q?: string | undefined;
  category?: string | undefined;
  area?: string | undefined;
  minRating?: number | undefined;
  maxPrice?: number | undefined;
  sort?: NonNullable<SearchFilters["sort"]> | undefined;
};

export const Route = createFileRoute("/explore")({
  validateSearch: (search: Record<string, unknown>): ExploreSearch => ({
    q: typeof search["q"] === "string" && search["q"] ? search["q"] : undefined,
    category: typeof search["category"] === "string" ? search["category"] : undefined,
    area: typeof search["area"] === "string" ? search["area"] : undefined,
    minRating: search["minRating"] ? Number(search["minRating"]) : undefined,
    maxPrice: search["maxPrice"] ? Number(search["maxPrice"]) : undefined,
    sort: (search["sort"] as ExploreSearch["sort"]) ?? undefined,
  }),

  head: () => ({
    meta: [
      { title: "Explore Chennai Sellers — NammaSpot" },
      {
        name: "description",
        content:
          "Search and filter Chennai's home bakers, mehendi artists, bridal makeup studios, boutiques and handmade creators by category, area, rating and price.",
      },
      { property: "og:title", content: "Explore Chennai Sellers — NammaSpot" },
      {
        property: "og:description",
        content:
          "Filter local Tamil Nadu makers by craft, neighbourhood, rating and starting price.",
      },
    ],
  }),
  component: Explore,
});

const ALL = "all";

function Explore() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data: catsData } = useStoreData(categories);
  const cats = catsData ?? [];
  const { data: areaList } = useStoreData(areas);

  const set = (patch: Partial<ExploreSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const { data: results } = useStoreData(() => searchSellers(search));
  const list = results ?? null;
  const activeCount = [search.category, search.area, search.minRating, search.maxPrice].filter(
    Boolean,
  ).length;

  return (
    <SiteShell>
      <PageHeading
        eyebrow="Explore"
        title="Find your maker"
        subtitle="Search by name, craft, product or neighbourhood — then narrow it down."
      />

      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
        <div className="card-soft p-3 sm:p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search.q ?? ""}
              onChange={(e) => set({ q: e.target.value || undefined })}
              placeholder="Search sellers, products or areas"
              className="h-11 rounded-full pl-9"
              aria-label="Search"
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Select
              value={search.category ?? ALL}
              onValueChange={(v) => set({ category: v === ALL ? undefined : v })}
            >
              <SelectTrigger aria-label="Category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All categories</SelectItem>
                {cats.map((c) => (
                  <SelectItem key={c.id} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={search.area ?? ALL}
              onValueChange={(v) => set({ area: v === ALL ? undefined : v })}
            >
              <SelectTrigger aria-label="Area">
                <SelectValue placeholder="Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All areas</SelectItem>
                {(areaList ?? []).map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={search.minRating ? String(search.minRating) : ALL}
              onValueChange={(v) => set({ minRating: v === ALL ? undefined : Number(v) })}
            >
              <SelectTrigger aria-label="Rating">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any rating</SelectItem>
                <SelectItem value="4.5">4.5+</SelectItem>
                <SelectItem value="4">4.0+</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={search.sort ?? "featured"}
              onValueChange={(v) => set({ sort: v as ExploreSearch["sort"] })}
            >
              <SelectTrigger aria-label="Sort">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured first</SelectItem>
                <SelectItem value="rating">Top rated</SelectItem>
                <SelectItem value="price-low">Price: low to high</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Select
              value={search.maxPrice ? String(search.maxPrice) : ALL}
              onValueChange={(v) => set({ maxPrice: v === ALL ? undefined : Number(v) })}
            >
              <SelectTrigger aria-label="Budget">
                <SelectValue placeholder="Budget" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any budget</SelectItem>
                <SelectItem value="500">Starts under ₹500</SelectItem>
                <SelectItem value="2000">Starts under ₹2,000</SelectItem>
                <SelectItem value="15000">Starts under ₹15,000</SelectItem>
              </SelectContent>
            </Select>
            {activeCount > 0 && (
              <Button
                variant="ghost"
                className="justify-start gap-2 text-primary"
                onClick={() => navigate({ search: { q: search.q, sort: search.sort } })}
              >
                <X className="size-4" /> Clear {activeCount} filter{activeCount > 1 ? "s" : ""}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <SlidersHorizontal className="size-4" aria-hidden />
          {list ? `${list.length} seller${list.length === 1 ? "" : "s"} found` : "Loading sellers…"}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list === null
            ? [...Array(6)].map((_, i) => <SellerCardSkeleton key={`explore-skeleton-${i}`} />)
            : list.map((s) => <SellerCard key={s.id} seller={s} />)}
        </div>

        {list && list.length === 0 && (
          <div className="card-soft mt-4 p-8 text-center">
            <p className="font-semibold">No sellers match that yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a broader area or clear the filters.
            </p>
          </div>
        )}
      </div>
    </SiteShell>
  );
}
