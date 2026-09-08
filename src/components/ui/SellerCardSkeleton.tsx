/**
 * Loading placeholder that mirrors the shape of <SellerCard />.
 * Uses design-system tokens only (muted / card surfaces) so it themes cleanly.
 */
export function SellerCardSkeleton() {
  return (
    <div className="card-soft overflow-hidden" aria-hidden>
      <div className="h-36 w-full animate-pulse bg-muted" />
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <div className="size-12 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}

/** Row-shaped placeholder for list/table style seller views (admin console). */
export function SellerRowSkeleton() {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4" aria-hidden>
      <div className="size-12 shrink-0 animate-pulse rounded-full bg-muted" />
      <div className="min-w-0 space-y-2">
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
        <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}
