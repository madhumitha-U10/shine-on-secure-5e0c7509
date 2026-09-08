import { Link } from "@tanstack/react-router";
import { MapPin, Instagram, BadgeCheck } from "lucide-react";

import { Rating } from "@/components/site/Rating";
import { SellerAvatar } from "@/components/site/SellerAvatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryById, inr, type Seller } from "@/lib/api";

export function SellerCard({ seller }: { seller: Seller }) {
  const category = categoryById(seller.categoryId);

  return (
    <Link
      to="/seller/$slug"
      params={{ slug: seller.slug }}
      aria-label={`${seller.businessName} in ${seller.area}`}
      className="group card-soft flex min-h-[112px] gap-3.5 overflow-hidden p-3.5 transition-shadow hover:shadow-[var(--shadow-lift)] sm:p-4"
    >
      <SellerAvatar name={seller.businessName} src={seller.imageUrl} size="md" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-base font-bold">
            {seller.businessName}
            {seller.status === "approved" && (
              <BadgeCheck
                className="ml-1 inline size-4 align-[-2px] text-primary"
                aria-label="Verified seller"
              />
            )}
          </h3>
          {seller.featured && (
            <Badge variant="secondary" className="shrink-0 text-[10px] uppercase tracking-wide">
              Featured
            </Badge>
          )}
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground">{seller.tagline}</p>
        {category && <p className="text-[11px] font-medium text-primary/80">{category.name}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1.5 text-xs text-muted-foreground">
          <Rating value={seller.rating} count={seller.reviewCount} />
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden />
            {seller.area}
          </span>
          <span className="inline-flex items-center gap-1">
            <Instagram className="size-3.5" aria-hidden />@{seller.instagram}
          </span>
        </div>
        <p className="text-xs font-semibold text-primary">From {inr(seller.priceFrom)}</p>
      </div>
    </Link>
  );
}

/** Loading placeholder that matches the card layout. */
export function SellerCardSkeleton() {
  return (
    <div className="card-soft flex min-h-[112px] gap-3.5 p-3.5 sm:p-4">
      <Skeleton className="size-16 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}
