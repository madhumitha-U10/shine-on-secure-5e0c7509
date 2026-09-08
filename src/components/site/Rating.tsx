import { Star } from "lucide-react";

export function Rating({ value, count }: { value: number; count?: number }) {
  if (!value) {
    return <span className="text-xs text-muted-foreground">New on NammaSpot</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
      <Star className="size-3.5 fill-primary text-primary" aria-hidden />
      {value.toFixed(1)}
      {count !== undefined && <span className="text-muted-foreground">({count})</span>}
    </span>
  );
}
