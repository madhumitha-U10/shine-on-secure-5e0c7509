/**
 * Seller-scoped writes, straight to the built-in database.
 *
 * Every handler verifies (server-side) that the signed-in user owns the shop
 * before writing. Nothing here trusts the browser.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const profileSchema = z.object({
  sellerId: z.string().min(1),
  businessName: z.string().max(120).optional(),
  tagline: z.string().max(200).optional(),
  about: z.string().max(2000).optional(),
  area: z.string().max(120).optional(),
  whatsapp: z.string().max(20).optional(),
  imageUrl: z.string().max(500).optional(),
});

/** Update the signed-in seller's own profile fields (no status/featured changes). */
export const sellerUpdateProfile = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => profileSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const { ownsSeller } = await import("@/lib/seller-authz.server");
    if (!(await ownsSeller(data.sellerId))) return { ok: false, error: "Unauthorized" };

    const patch: Record<string, unknown> = {};
    if (data.businessName !== undefined) patch["business_name"] = data.businessName;
    if (data.tagline !== undefined) patch["tagline"] = data.tagline;
    if (data.about !== undefined) patch["about"] = data.about;
    if (data.area !== undefined) patch["area"] = data.area;
    if (data.whatsapp !== undefined) patch["whatsapp"] = data.whatsapp;
    if (data.imageUrl !== undefined) patch["image_url"] = data.imageUrl;
    if (!Object.keys(patch).length) return { ok: true };

    const { db } = await import("@/lib/db.server");
    try {
      const { error } = await db().from("sellers").update(patch).eq("id", data.sellerId);
      return error ? { ok: false, error: error.message } : { ok: true };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  });

/**
 * Confirms the signed-in seller owns `productId`.
 *
 * Returns "ok" when the item belongs to them, "unknown" when the database has
 * not seen the item yet (nothing to update) and "denied" for everything else.
 */
async function ownsProduct(
  sellerId: string,
  productId: string,
): Promise<"ok" | "unknown" | "denied"> {
  const { ownsSeller } = await import("@/lib/seller-authz.server");
  if (!(await ownsSeller(sellerId))) return "denied";

  const { db } = await import("@/lib/db.server");
  const { data } = await db().from("products").select("seller_id").eq("id", productId).maybeSingle();
  if (!data) return "unknown";
  return (data as { seller_id: string }).seller_id === sellerId ? "ok" : "denied";
}

/** Update a catalogue photo for an item the signed-in seller owns. */
export const sellerUpdateProductImage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        sellerId: z.string().min(1),
        productId: z.string().min(1),
        imageUrl: z.string().max(500),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const owns = await ownsProduct(data.sellerId, data.productId);
    if (owns === "denied") return { ok: false, error: "Unauthorized" };
    if (owns === "unknown") return { ok: true };

    const { db } = await import("@/lib/db.server");
    const { error } = await db()
      .from("products")
      .update({ image_url: data.imageUrl })
      .eq("id", data.productId);
    return error ? { ok: false, error: error.message } : { ok: true };
  });

/** Edit the details of an item the signed-in seller owns. */
export const sellerUpdateProduct = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        sellerId: z.string().min(1),
        productId: z.string().min(1),
        name: z.string().max(80).optional(),
        price: z.number().nonnegative().max(10_000_000).optional(),
        unit: z.string().max(30).optional(),
        description: z.string().max(400).optional(),
        type: z.enum(["product", "service"]).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const owns = await ownsProduct(data.sellerId, data.productId);
    if (owns === "denied") return { ok: false, error: "Unauthorized" };
    if (owns === "unknown") return { ok: true };

    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch["name"] = data.name;
    if (data.price !== undefined) patch["price"] = data.price;
    if (data.unit !== undefined) patch["unit"] = data.unit;
    if (data.description !== undefined) patch["description"] = data.description;
    if (data.type !== undefined) patch["type"] = data.type;
    if (!Object.keys(patch).length) return { ok: true };

    const { db } = await import("@/lib/db.server");
    const { error } = await db().from("products").update(patch).eq("id", data.productId);
    return error ? { ok: false, error: error.message } : { ok: true };
  });

/** Remove an item from the catalogue. Sellers can only remove their own. */
export const sellerRetireProduct = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ sellerId: z.string().min(1), productId: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const owns = await ownsProduct(data.sellerId, data.productId);
    if (owns === "denied") return { ok: false, error: "Unauthorized" };
    if (owns === "unknown") return { ok: true };

    const { db } = await import("@/lib/db.server");
    const { error } = await db().from("products").delete().eq("id", data.productId);
    return error ? { ok: false, error: error.message } : { ok: true };
  });
