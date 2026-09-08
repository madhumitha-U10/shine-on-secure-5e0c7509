import { createFileRoute } from "@tanstack/react-router";

/**
 * Serves images from the private storage buckets.
 *
 * Buckets are private (no public browsing), so this route mints a short-lived
 * signed URL server-side and streams the object back. That keeps image URLs
 * stable and shareable while the bucket itself stays locked down.
 */

const ALLOWED_BUCKETS = new Set(["seller-avatars", "product-images", "story-images"]);

export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const splat = decodeURIComponent(String((params as { _splat?: string })._splat ?? ""));
        const [bucket, ...rest] = splat.split("/");
        const path = rest.join("/");

        if (!bucket || !ALLOWED_BUCKETS.has(bucket) || !path || path.includes("..")) {
          return new Response("Not found", { status: 404 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from(bucket).download(path);
        if (error || !data) return new Response("Not found", { status: 404 });

        return new Response(await data.arrayBuffer(), {
          headers: {
            "Content-Type": data.type || "image/jpeg",
            "Cache-Control": "public, max-age=86400, immutable",
          },
        });
      },
    },
  },
});
