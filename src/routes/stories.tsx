import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { PageHeading, SiteShell } from "@/components/site/SiteShell";
import { SELLERS, STORIES } from "@/data/seed";
import { imageForCategorySlug } from "@/lib/images";
import { categoryById } from "@/lib/api";

export const Route = createFileRoute("/stories")({
  head: () => ({
    meta: [
      { title: "Stories — The People Behind Chennai's Small Businesses | NammaSpot" },
      {
        name: "description",
        content:
          "Longform stories about Chennai's home bakers, mehendi artists, potters and illustrators — how they started and how they sell today.",
      },
      { property: "og:title", content: "Stories from Chennai's makers — NammaSpot" },
      {
        property: "og:description",
        content: "Two ovens in Mylapore, kolam drawn on skin, the last potters of Villivakkam.",
      },
    ],
  }),
  component: Stories,
});

function Stories() {
  return (
    <SiteShell>
      <PageHeading
        eyebrow="Stories"
        title="The people behind the shops"
        subtitle="Every listing here has a person, a street and a story behind it."
      />
      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-6">
        <div className="space-y-6">
          {STORIES.map((story) => {
            const seller = SELLERS.find((s) => s.id === story.sellerId);
            const cat = seller ? categoryById(seller.categoryId) : undefined;
            return (
              <article key={story.id} className="card-soft overflow-hidden md:flex">
                <img
                  src={imageForCategorySlug(cat?.slug)}
                  alt={story.title}
                  loading="lazy"
                  className="h-44 w-full object-cover md:h-auto md:w-56"
                />
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                    {seller?.area} · {cat?.name}
                  </p>
                  <h2 className="mt-2 text-xl font-extrabold">{story.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{story.body}</p>
                  {seller && (
                    <Link
                      to="/seller/$slug"
                      params={{ slug: seller.slug }}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                    >
                      Visit {seller.businessName} <ArrowRight className="size-4" />
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </SiteShell>
  );
}
