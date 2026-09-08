import { CheckCircle2, ImagePlus, Loader2 } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { normalizeImageUrl } from "@/lib/api";
import { fileToCompressedDataUrl, uploadForBucket, type MediaBucket } from "@/lib/image-storage";

/**
 * Image picker used for seller profile pictures and catalogue photos.
 *
 * When a `bucket` is given the file is compressed and uploaded to cloud
 * storage, and `onPicked` receives the permanent URL. Without a bucket the
 * image stays local (compressed data URL).
 *
 * `fit` controls how the preview is drawn: circular avatars crop (`cover`),
 * catalogue photos keep their uploaded proportions (`contain`).
 */
export function PhotoPicker({
  src,
  alt,
  label,
  className = "size-16 rounded-lg",
  bucket,
  fit = "contain",
  onPicked,
}: {
  src?: string | undefined;
  alt: string;
  label: string;
  className?: string;
  bucket?: MediaBucket | undefined;
  fit?: "cover" | "contain";
  onPicked: (url: string) => void;
}) {
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState("");

  return (
    <div className="shrink-0">
      <label
        htmlFor={inputId}
        title={src ? `Change ${label.toLowerCase()}` : `Add ${label.toLowerCase()}`}
        className={`relative grid cursor-pointer place-items-center overflow-hidden border border-border bg-secondary text-muted-foreground transition-opacity hover:opacity-80 focus-within:ring-2 focus-within:ring-ring ${className}`}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className={`size-full ${fit === "cover" ? "object-cover" : "object-contain"}`}
          />
        ) : (
          <ImagePlus className="size-4" aria-hidden />
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-background/70">
            <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
          </span>
        )}
        <span className="sr-only">
          {src ? "Change" : "Add"} {label} for {alt}
        </span>
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={busy}
        aria-label={`${src ? "Change" : "Add"} ${label}`}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          setUploadError("");
          setUploadSuccess(false);
          try {
            const url = bucket
              ? await uploadForBucket(bucket, file)
              : await fileToCompressedDataUrl(file);
            const normalized = normalizeImageUrl(url);
            if (!normalized) throw new Error("Could not use that image");
            onPicked(normalized);
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 2000);
          } catch (err) {
            const message = err instanceof Error ? err.message : "Could not use that image";
            setUploadError(message);
            toast.error(message);
          } finally {
            setBusy(false);
          }
        }}
      />
      {busy && (
        <p className="mt-1.5 text-xs text-muted-foreground" role="status">
          Uploading…
        </p>
      )}
      {uploadSuccess && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-primary" role="status">
          <CheckCircle2 className="size-3.5" aria-hidden /> Image uploaded
        </p>
      )}
      {uploadError && (
        <p className="mt-1.5 max-w-48 text-xs text-destructive" role="alert">
          {uploadError}
        </p>
      )}
    </div>
  );
}
