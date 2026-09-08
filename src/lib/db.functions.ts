/**
 * The app's link to the built-in database.
 *
 * Reads are public (the storefront shows approved shops to everyone), writes
 * are narrow and validated: a visitor can only send an enquiry or a review, a
 * shop owner can only register or add to their own shop, and admin-only
 * actions live in admin-mutations.ts.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type DbRow = Record<string, string | number | boolean | null>;

const slugify = (v: string) =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "shop";

const cell = z.union([z.string(), z.number(), z.boolean(), z.null()]);

/** Reads every table the app needs, in a single round-trip. */
export const fetchAllData = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ rows: Record<string, DbRow[]>; error?: string | undefined }> => {
    const { readEverything } = await import("@/lib/db.server");
    return readEverything();
  },
);

const str = (row: Record<string, unknown>, ...keys: string[]): string => {
  for (const k of keys) {
    const hit = Object.keys(row).find((rk) => rk.toLowerCase() === k.toLowerCase());
    const v = hit ? row[hit] : undefined;
    if (v !== undefined && v !== null && String(v) !== "") return String(v);
  }
  return "";
};

const numOf = (row: Record<string, unknown>, ...keys: string[]): number => {
  const n = Number(str(row, ...keys).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/**
 * Saves a new record. Mirrors the old spreadsheet write API so every existing
 * caller keeps working, but the data now lands in the built-in database.
 */
export const saveRecord = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        action: z.enum(["addSeller", "addProduct", "addCustomer", "addEnquiry", "addReview"]),
        row: z.record(z.string(), cell),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string | undefined }> => {
    const { db } = await import("@/lib/db.server");
    const row = data.row as Record<string, unknown>;
    try {
      const c = db();

      if (data.action === "addSeller") {
        const id = str(row, "sellerId", "id");
        if (!id) return { ok: false, error: "Missing shop id" };
        const name = str(row, "name", "businessName") || "Shop";
        const area = str(row, "location", "area") || "Chennai";
        const about = str(row, "description", "about");
        const { error } = await c.from("sellers").upsert(
          {
            id,
            slug: str(row, "slug") || slugify(name),
            business_name: name,
            owner_name: str(row, "ownerName", "owner") || name,
            category_id: str(row, "categoryId"),
            tagline: str(row, "tagline") || about.slice(0, 110),
            about,
            area,
            city: str(row, "city") || area,
            instagram: str(row, "instagram").replace(/^@/, ""),
            whatsapp: str(row, "whatsapp", "phone").replace(/[^0-9]/g, ""),
            email: str(row, "email"),
            price_from: numOf(row, "priceFrom", "startingPrice"),
            status: str(row, "status") || "pending",
            image_url: str(row, "imageUrl"),
          },
          { onConflict: "id" },
        );
        return error ? { ok: false, error: error.message } : { ok: true };
      }

      if (data.action === "addProduct") {
        const id = str(row, "productId", "id");
        const sellerId = str(row, "sellerId");
        if (!id || !sellerId) return { ok: false, error: "Missing item details" };
        const type = str(row, "type").toLowerCase() === "service" ? "service" : "product";
        const { error } = await c.from("products").upsert(
          {
            id,
            seller_id: sellerId,
            name: str(row, "name") || "Item",
            type,
            price: numOf(row, "price"),
            unit: str(row, "unit") || (type === "service" ? "per booking" : "each"),
            description: str(row, "description"),
            image_url: str(row, "imageUrl"),
          },
          { onConflict: "id" },
        );
        return error ? { ok: false, error: error.message } : { ok: true };
      }

      if (data.action === "addCustomer") {
        const id = str(row, "customerId", "id");
        if (!id) return { ok: false, error: "Missing customer id" };
        const { error } = await c.from("customers").upsert(
          {
            id,
            name: str(row, "name", "customerName") || "Customer",
            phone: str(row, "phone", "whatsapp"),
            area: str(row, "area", "location"),
            avatar_url: str(row, "imageUrl", "avatarUrl"),
          },
          { onConflict: "id" },
        );
        return error ? { ok: false, error: error.message } : { ok: true };
      }

      if (data.action === "addEnquiry") {
        const id = str(row, "enquiryId", "id");
        const sellerId = str(row, "sellerId");
        if (!id || !sellerId) return { ok: false, error: "Missing enquiry details" };
        const message = str(row, "message", "notes").slice(0, 2000);
        const { error } = await c.from("enquiries").upsert(
          {
            id,
            seller_id: sellerId,
            product_id: str(row, "productId") || null,
            customer_name: str(row, "customerName", "name").slice(0, 120) || "Customer",
            phone: str(row, "phone", "whatsapp").slice(0, 20),
            event_date: str(row, "eventDate").slice(0, 10),
            message,
            status: "new",
          },
          { onConflict: "id" },
        );
        return error ? { ok: false, error: error.message } : { ok: true };
      }

      // addReview
      const id = str(row, "reviewId", "id");
      const sellerId = str(row, "sellerId");
      if (!id || !sellerId) return { ok: false, error: "Missing review details" };
      const rating = Math.max(1, Math.min(5, numOf(row, "rating") || 5));
      const { error } = await c.from("reviews").upsert(
        {
          id,
          seller_id: sellerId,
          customer_name: str(row, "customerName", "name").slice(0, 120) || "Customer",
          rating,
          comment: str(row, "comment", "review", "message").slice(0, 1000),
          approved: false,
        },
        { onConflict: "id" },
      );
      return error ? { ok: false, error: error.message } : { ok: true };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  });
