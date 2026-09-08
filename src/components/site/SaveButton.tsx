import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  isProductSaved,
  isShopSaved,
  onEngagementChange,
  toggleSaveProduct,
  toggleSaveShop,
} from "@/lib/engagement";

/**
 * ❤️ Save toggle for a shop or a product. Works without login — saves live on
 * this device and are listed under "My NammaSpot".
 */
export function SaveButton({
  kind,
  id,
  sellerId,
  label,
  variant = "outline",
  size = "icon",
  className,
}: {
  kind: "shop" | "product";
  id: string;
  sellerId?: string | undefined;
  label?: string;
  variant?: "outline" | "ghost" | "secondary";
  size?: "icon" | "sm" | "default";
  className?: string;
}) {
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(kind === "shop" ? isShopSaved(id) : isProductSaved(id));
    sync();
    setReady(true);
    return onEngagementChange(sync);
  }, [kind, id]);

  const text = label ?? (kind === "shop" ? "Save shop" : "Save");

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("rounded-full", className)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${text}` : text}
      disabled={!ready}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const next =
          kind === "shop" ? toggleSaveShop(id) : toggleSaveProduct(id, sellerId ?? undefined);
        setSaved(next);
        toast.success(next ? "Saved to My NammaSpot" : "Removed from saved");
      }}
    >
      <Heart className={cn("size-4", saved && "fill-current text-primary")} aria-hidden />
      {size !== "icon" && <span>{saved ? "Saved" : text}</span>}
    </Button>
  );
}
