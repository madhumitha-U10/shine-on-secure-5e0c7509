import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Instagram, Search, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";

import { SellerCard } from "@/components/site/SellerCard";
import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SellerCardSkeleton } from "@/components/ui/SellerCardSkeleton";
import { useStoreData } from "@/hooks/use-store-data";
import { approvedSellers, categories, stories } from "@/lib/api";
import { heroImages } from "@/lib/images";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NammaSpot — Chennai's Local Makers, Bakers & Artists" },
      {
        name: "description",
        content:
          "Discover Chennai and Tamil Nadu's Instagram-based home bakers, mehendi artists, bridal makeup studios, crochet makers and boutiques. Search, view catalogues and send enquiries directly.",
      },
      { property: "og:title", content: "NammaSpot — Chennai's Local Makers, Bakers & Artists" },
      {
        property: "og:description",
        content:
          "Namma Ooru. Namma People. Namma Spot. A local marketplace for Chennai's small businesses and handmade creators.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [q, setQ] = useState("");
  const { data: sellers } = useStoreData(approvedSellers);
  const featured = (sellers ?? []).filter((s) => s.featured).slice(0, 4);
  const { data: catsData } = useStoreData(categories);
  const cats = catsData ?? [];
  const storyList = stories().slice(0, 3);

  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="pointer-events-none absolute inset-0 kolam-grid" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:px-6 lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              Chennai · Tamil Nadu
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              Namma Ooru.
              <br />
              Namma People.
              <br />
              <span className="text-primary">Namma Spot.</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              Discover the authentic flavours, crafts and talents of Chennai's vibrant local scene.
              Handcrafted by the community, for the community.
            </p>

            <form
              className="mt-7 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Try 'bridal mehendi Adyar' or 'eggless cake'"
                  className="h-12 rounded-full bg-background pl-9"
                  aria-label="Search sellers"
                />
              </div>
              <Button asChild size="lg" className="h-12 rounded-full">
                <Link to="/explore" search={{ q }}>
                  Search
                </Link>
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap gap-2">
              {cats.slice(0, 5).map((c) => (
                <Link
                  key={c.id}
                  to="/explore"
                  search={{ category: c.slug }}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <img
              src={heroImages.mehendi}
              alt="Mehendi artist applying bridal henna in Chennai"
              width={900}
              height={1100}
              className="col-span-1 row-span-2 h-full w-full rounded-2xl object-cover shadow-[var(--shadow-lift)]"
            />
            <img
              src={heroImages.bakes}
              alt="Handmade bakes from a Chennai home baker"
              width={900}
              height={640}
              loading="lazy"
              className="h-40 w-full rounded-2xl object-cover shadow-[var(--shadow-soft)] sm:h-48"
            />
            <img
              src={heroImages.crafts}
              alt="Terracotta and brass crafts from a local Chennai maker"
              width={900}
              height={640}
              loading="lazy"
              className="h-40 w-full rounded-2xl object-cover shadow-[var(--shadow-soft)] sm:h-48"
            />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-border bg-secondary/50">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 sm:grid-cols-3 lg:px-6">
          {[
            {
              icon: ShieldCheck,
              title: "Admin-verified sellers",
              copy: "Every profile is reviewed before it goes live.",
            },
            {
              icon: Instagram,
              title: "Instagram-first",
              copy: "Built for businesses that already sell through DMs.",
            },
            {
              icon: Sparkles,
              title: "Made in Tamil Nadu",
              copy: "Local artisans, local areas, local prices.",
            },
          ].map(({ icon: Icon, title, copy }) => (
            <div key={title} className="flex gap-3">
              <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-12 lg:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">Browse by craft</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Eight categories, hundreds of makers.
            </p>
          </div>
          <Link
            to="/categories"
            className="shrink-0 text-sm font-semibold text-primary hover:underline"
          >
            All categories
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cats.map((c) => (
            <Link
              key={c.id}
              to="/explore"
              search={{ category: c.slug }}
              className="card-soft p-4 transition-colors hover:border-primary"
            >
              <p className="text-sm font-bold">{c.name}</p>
              <p className="mt-0.5 text-xs text-primary/80">{c.tamilName}</p>
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{c.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="bg-card py-12">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-extrabold sm:text-3xl">Featured this week</h2>
            <Link
              to="/featured"
              className="shrink-0 text-sm font-semibold text-primary hover:underline"
            >
              See all
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sellers === null ? (
              [...Array(4)].map((_, i) => <SellerCardSkeleton key={`featured-skeleton-${i}`} />)
            ) : featured.length > 0 ? (
              featured.map((s) => <SellerCard key={s.id} seller={s} />)
            ) : (
              <p className="text-sm text-muted-foreground">No featured sellers at this time.</p>
            )}
          </div>
        </div>
      </section>

      {/* Stories */}
      <section className="mx-auto max-w-6xl px-4 py-12 lg:px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Stories from the neighbourhood</h2>
          <Link
            to="/stories"
            className="shrink-0 text-sm font-semibold text-primary hover:underline"
          >
            Read more
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {storyList.map((s) => (
            <Link key={s.id} to="/stories" className="card-soft p-5 hover:border-primary">
              <h3 className="text-base font-bold">{s.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.excerpt}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                Read story <ArrowRight className="size-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Seller CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-4 lg:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-10 text-primary-foreground sm:px-10">
          <div className="pointer-events-none absolute inset-0 kolam-grid opacity-20" aria-hidden />
          <div className="relative max-w-xl">
            <h2 className="text-2xl font-extrabold sm:text-3xl">Selling through Instagram DMs?</h2>
            <p className="mt-3 text-sm opacity-90">
              Get a shareable profile, a proper catalogue and enquiries in one place. Free for
              Chennai and Tamil Nadu makers.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-6 rounded-full">
              <Link to="/seller/register">List your business</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
