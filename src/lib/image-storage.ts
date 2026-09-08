/**
 * Image pipeline for NammaSpot.
 *
 * Files are downscaled + compressed in the browser, then uploaded to Lovable
 * Cloud storage under the signed-in user's own folder. Buckets are private, so
 * the stored value is a stable app URL (`/api/public/media/<bucket>/<path>`)
 * that streams the object through the app instead of an expiring signed link.
 *
 * If nobody is signed in yet (e.g. the public enquiry form), the helper falls
 * back to a compressed data URL so the UI keeps working.
 */

import { supabase } from "@/integrations/supabase/client";

export const MEDIA_BUCKETS = ["seller-avatars", "product-images", "story-images"] as const;
export type MediaBucket = (typeof MEDIA_BUCKETS)[number];

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 30_000;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"];

/** Throws a human-readable error when the file is not an acceptable image. */
export function validateImageFile(file: File, maxBytes = MAX_IMAGE_BYTES) {
  if (!file.type.startsWith("image/") || !ALLOWED_TYPES.includes(file.type.toLowerCase())) {
    throw new Error("Please choose a JPG, PNG or WebP image");
  }
  if (file.size > maxBytes) {
    throw new Error(`Image must be under ${Math.round(maxBytes / (1024 * 1024))}MB`);
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read that image"));
      img.onload = () => resolve(img);
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/** Downscale so the longest side is <= maxSide, keeping the original aspect ratio. */
export async function compressImage(file: File, maxSide = 1200, quality = 0.8): Promise<Blob> {
  const img = await loadImage(file);
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image processing is not supported on this device");
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) throw new Error("Could not process that image");
  return blob;
}

/** Compressed data URL — used as a local fallback when there is no session. */
export async function fileToCompressedDataUrl(file: File, maxSide = 900, quality = 0.75) {
  validateImageFile(file);
  const blob = await compressImage(file, maxSide, quality);
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not process that image"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

/** Public, stable URL for a stored object (served by /api/public/media). */
export const mediaUrl = (bucket: MediaBucket, path: string) =>
  `/api/public/media/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;

async function uploadToBucket(
  bucket: MediaBucket,
  file: File,
  { maxSide, quality, maxBytes }: { maxSide: number; quality: number; maxBytes?: number },
): Promise<string> {
  validateImageFile(file, maxBytes ?? MAX_IMAGE_BYTES);

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  const blob = await compressImage(file, maxSide, quality);

  // Not signed in (public forms): keep the compressed image locally.
  if (!userId) return await fileToCompressedDataUrl(file, maxSide, quality);

  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

  // Flaky mobile networks are the norm here: retry up to 3 times with
  // exponential backoff (1s, 2s) and a 30s timeout per attempt.
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
      try {
        const { error } = await supabase.storage.from(bucket).upload(path, blob, {
          contentType: "image/jpeg",
          upsert: true,
          cacheControl: "3600",
          ...({ signal: controller.signal } as Record<string, unknown>),
        });
        if (error) throw new Error(error.message);
      } finally {
        clearTimeout(timeoutId);
      }
      return mediaUrl(bucket, path);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === maxRetries) break;
      await new Promise((resolve) => setTimeout(resolve, 2 ** (attempt - 1) * 1000));
    }
  }

  console.error("Image upload failed:", lastError);
  throw new Error(
    "Image upload failed after 3 attempts. Please check your internet connection and try again.",
  );
}

/** Seller profile picture — square-ish, stored at 400px. */
export const uploadSellerAvatar = (file: File) =>
  uploadToBucket("seller-avatars", file, { maxSide: 400, quality: 0.85 });

/** Catalogue photo — aspect ratio preserved, stored at up to 1200px. */
export const uploadProductImage = (file: File) =>
  uploadToBucket("product-images", file, {
    maxSide: 1200,
    quality: 0.82,
    maxBytes: 10 * 1024 * 1024,
  });

/** Story / editorial photo. */
export const uploadStoryImage = (file: File) =>
  uploadToBucket("story-images", file, {
    maxSide: 1600,
    quality: 0.82,
    maxBytes: 10 * 1024 * 1024,
  });

export const uploadForBucket = (bucket: MediaBucket, file: File) =>
  bucket === "seller-avatars"
    ? uploadSellerAvatar(file)
    : bucket === "product-images"
      ? uploadProductImage(file)
      : uploadStoryImage(file);
