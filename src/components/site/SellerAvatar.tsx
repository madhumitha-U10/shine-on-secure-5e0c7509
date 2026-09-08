/**
 * Circular seller/customer avatar with an initials fallback.
 * `object-cover` is intentional here — cropping a circle is expected. Product
 * photos never use this component (they must keep their uploaded proportions).
 */

import { useState } from "react";

const SIZES = {
  sm: "size-12 text-sm",
  md: "size-16 text-base",
  lg: "size-20 text-lg",
  xl: "size-[120px] text-3xl",
} as const;

export type AvatarSize = keyof typeof SIZES;

export function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

export function SellerAvatar({
  name,
  src,
  size = "md",
  className = "",
}: {
  name: string;
  src?: string | undefined;
  size?: AvatarSize;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const showImg = src && !imgError;

  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full border-2 border-card bg-secondary font-display font-bold text-primary shadow-[var(--shadow-soft)] ${SIZES[size]} ${className}`}
    >
      {showImg ? (
        <img
          src={src}
          alt={`${name} profile picture`}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span aria-hidden>{getInitials(name)}</span>
      )}
      {!showImg && <span className="sr-only">{name}</span>}
    </span>
  );
}
