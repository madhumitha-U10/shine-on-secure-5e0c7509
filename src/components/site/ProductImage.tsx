import { useState } from "react";

/**
 * Catalogue photo.
 *
 * Product images are shown in the proportions the seller uploaded — the image
 * is fitted inside the frame with `object-contain`, never cropped. Any leftover
 * space uses the muted surface colour.
 */
export function ProductImage({
  src,
  alt,
  className = "",
  ratio = "aspect-[4/3]",
}: {
  src: string;
  alt: string;
  className?: string;
  ratio?: string;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`grid place-items-center overflow-hidden bg-secondary ${ratio} ${className}`}>
      {imgError ? (
        <span className="text-xs text-muted-foreground">Image unavailable</span>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="size-full object-contain"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
}
