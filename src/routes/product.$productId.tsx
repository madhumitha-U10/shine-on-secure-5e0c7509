import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Instagram, MapPin, MessageCircle, Share2 } from "lucide-react";
import { useEffect } from "react";

import { ProductImage } from "@/components/site/ProductImage";
import { SaveButton } from "@/components/site/SaveButton";
import { SellerAvatar } from "@/components/site/SellerAvatar";
import { ShareDialog } from "@/components/site/ShareDialog";
import { SiteShell } from "@/components/site/SiteShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStoreData } from "@/hooks/use-store-data";
import { allProducts, categoryById, inr, sellerById } from "@/lib/api";
import { trackProductView, trackWhatsAppClick } from "@/lib/engagement";
import { productUrl, whatsAppChatUrl } from "@/lib/share";

export const Route = createFileRoute("/product/$productId")({
  head: () => ({
    meta: [
      { title: "Product — NammaSpot" },
      {
        name: "description",
        content:
          "A product or service from a Chennai local maker on NammaSpot. Ask about it on WhatsApp or save it for later.",
      },
      { property: "og:title", content: "Product — NammaSpot" },
      {
        property: "og:description",
        content: "Discover handmade products and services from Chennai's local businesses.",
      },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { productId } = Route.useParams();

  const { data } = useStoreData(() => {
    const product = allProducts().find((p) => p.id === productId) ?? null;
    const seller = product ? (sellerById(product.sellerId) ?? null) : null;
    return { product, seller };
  });

  const product = data?.product ?? null;
  const seller = data?.seller ?? null;

  useEffect(() => {
    if (product) trackProductView(product.id, product.sellerId);
  }, [product]);

  if (data === null) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-4xl px-4 py-24 text-sm text-muted-foreground">
          Loading product…
        </div>
      </SiteShell>
    );
  }

  if (!product) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-xl px-4 py-24 text-center">
          <h1 className="text-2xl font-extrabold">Product not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This item may have been removed by the seller.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/explore">Browse other makers</Link>
          </Button>
        </div>
      </SiteShell>
    );
  }

  const category = seller ? categoryById(seller.categoryId) : undefined;
  const url = productUrl(product.id);
  const askMessage = `Hi${seller ? ` ${seller.businessName}` : ""}, I saw "${product.name}" on NammaSpot. Could you share more details?\n${url}`;

  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-6">
        <Button asChild variant="ghost" size="sm" className="rounded-full">
          <Link to="/explore">
            <ArrowLeft className="size-4" /> Back to explore
          </Link>
        </Button>

        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div className="card-soft overflow-hidden p-0">
            {product.imageUrl ? (
              <ProductImage src={product.imageUrl} alt={product.name} className="w-full" />
            ) : (
              <div className="grid h-64 place-items-center bg-secondary text-sm text-muted-foreground">
                No photo yet
              </div>
            )}
          </div>

          <div className="min-w-0">
            <Badge variant="secondary" className="text-[10px] uppercase">
              {product.type}
            </Badge>
            <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">{product.name}</h1>
            <p className="mt-2 text-lg font-bold text-primary">
              {inr(product.price)}{" "}
              <span className="text-xs font-normal text-muted-foreground">/ {product.unit}</span>
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {seller && (
                <Button
                  asChild
                  className="rounded-full"
                  onClick={() => trackWhatsAppClick({ sellerId: seller.id, productId: product.id })}
                >
                  <a
                    href={whatsAppChatUrl(seller.whatsapp, askMessage)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="size-4" /> Ask about this product
                  </a>
                </Button>
              )}
              <SaveButton
                kind="product"
                id={product.id}
                sellerId={product.sellerId}
                size="sm"
                label="Save"
              />
              <ShareDialog
                title={product.name}
                url={url}
                shareText={`${product.name} on NammaSpot`}
                productId={product.id}
                sellerId={product.sellerId}
                {...(seller?.instagram ? { instagram: seller.instagram } : {})}
                fileName={`nammaspot-${product.id}`}
                trigger={
                  <Button variant="outline" size="sm" className="rounded-full">
                    <Share2 className="size-4" /> Share
                  </Button>
                }
              />
            </div>

            {seller && (
              <div className="card-soft mt-6 flex items-center gap-3 p-4">
                <SellerAvatar name={seller.businessName} src={seller.imageUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{seller.businessName}</p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin className="size-3" /> {seller.area}, {seller.city}
                    {category ? ` · ${category.name}` : ""}
                  </p>
                  <a
                    href={`https://instagram.com/${seller.instagram}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                  >
                    <Instagram className="size-3" /> @{seller.instagram}
                  </a>
                </div>
                <Button asChild size="sm" variant="outline" className="shrink-0 rounded-full">
                  <Link to="/seller/$slug" params={{ slug: seller.slug }}>
                    Visit shop
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
