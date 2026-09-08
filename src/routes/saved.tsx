import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Heart } from "lucide-react";
import { useEffect, useState } from "react";

import { ProductImage } from "@/components/site/ProductImage";
import { SaveButton } from "@/components/site/SaveButton";
import { SellerCard } from "@/components/site/SellerCard";
import { PageHeading, SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStoreData } from "@/hooks/use-store-data";
import { allProducts, inr, sellerById } from "@/lib/api";
import {
  clearRecentlyViewed,
  onEngagementChange,
  recentlyViewed,
  savedProductIds,
  savedShopIds,
  type RecentItem,
} from "@/lib/engagement";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "My NammaSpot — Saved Shops & Products" },
      {
        name: "description",
        content:
          "Your saved Chennai shops, saved products and recently viewed makers, all in one place on NammaSpot.",
      },
      { property: "og:title", content: "My NammaSpot — Saved Shops & Products" },
      {
        property: "og:description",
        content: "Keep your favourite local makers and handmade products one tap away.",
      },
    ],
  }),
  component: SavedPage,
});

function useEngagement() {
  const [state, setState] = useState<{
    shops: string[];
    products: string[];
    recent: RecentItem[];
  } | null>(null);

  useEffect(() => {
    const sync = () =>
      setState({
        shops: savedShopIds(),
        products: savedProductIds(),
        recent: recentlyViewed(),
      });
    sync();
    return onEngagementChange(sync);
  }, []);

  return state;
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="card-soft p-8 text-center">
      <Heart className="mx-auto size-6 text-muted-foreground" aria-hidden />
      <p className="mt-3 text-sm font-bold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{copy}</p>
      <Button asChild size="sm" className="mt-4 rounded-full">
        <Link to="/explore">Start exploring</Link>
      </Button>
    </div>
  );
}

function ProductRow({ productId }: { productId: string }) {
  const { data } = useStoreData(() => {
    const product = allProducts().find((p) => p.id === productId) ?? null;
    const seller = product ? (sellerById(product.sellerId) ?? null) : null;
    return { product, seller };
  });

  if (!data?.product) return null;
  const { product, seller } = data;

  return (
    <div className="card-soft flex items-center gap-3 p-3">
      {product.imageUrl ? (
        <ProductImage src={product.imageUrl} alt={product.name} className="size-16 rounded-lg" />
      ) : (
        <div className="size-16 shrink-0 rounded-lg bg-secondary" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <Link
          to="/product/$productId"
          params={{ productId: product.id }}
          className="truncate text-sm font-bold hover:text-primary"
        >
          {product.name}
        </Link>
        <p className="truncate text-xs text-muted-foreground">
          {seller?.businessName ?? "NammaSpot seller"}
        </p>
        <p className="text-xs font-semibold text-primary">{inr(product.price)}</p>
      </div>
      <SaveButton kind="product" id={product.id} sellerId={product.sellerId} />
    </div>
  );
}

function SavedShop({ sellerId }: { sellerId: string }) {
  const { data: seller } = useStoreData(() => sellerById(sellerId) ?? null);
  if (!seller) return null;
  return <SellerCard seller={seller} />;
}

function RecentRow({ item }: { item: RecentItem }) {
  if (item.type === "product") return <ProductRow productId={item.id} />;
  return <SavedShop sellerId={item.id} />;
}

function SavedPage() {
  const state = useEngagement();

  return (
    <SiteShell>
      <PageHeading
        eyebrow="My NammaSpot"
        title="Your saved makers & products"
        subtitle="Saves live on this device — no login needed. Sign in later and they stay right here."
      />

      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
        {state === null ? (
          <p className="text-sm text-muted-foreground">Loading your saves…</p>
        ) : (
          <Tabs defaultValue="shops">
            <TabsList>
              <TabsTrigger value="shops">Saved Shops ({state.shops.length})</TabsTrigger>
              <TabsTrigger value="products">Saved Products ({state.products.length})</TabsTrigger>
              <TabsTrigger value="recent">Recently Viewed</TabsTrigger>
            </TabsList>

            <TabsContent value="shops" className="mt-6">
              {state.shops.length === 0 ? (
                <EmptyState
                  title="No saved shops yet"
                  copy="Tap the ❤️ on any shop to keep it here."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {state.shops.map((id) => (
                    <SavedShop key={id} sellerId={id} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="products" className="mt-6">
              {state.products.length === 0 ? (
                <EmptyState
                  title="No saved products yet"
                  copy="Tap the ❤️ on a cake, saree or service to save it."
                />
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {state.products.map((id) => (
                    <ProductRow key={id} productId={id} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="recent" className="mt-6">
              {state.recent.length === 0 ? (
                <EmptyState
                  title="Nothing viewed yet"
                  copy="Shops and products you open will show up here."
                />
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="size-3.5" /> Last {state.recent.length} you looked at
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full"
                      onClick={() => clearRecentlyViewed()}
                    >
                      Clear history
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {state.recent.map((item) => (
                      <RecentRow key={`${item.type}-${item.id}`} item={item} />
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </SiteShell>
  );
}
