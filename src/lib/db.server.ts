/**
 * Server-only access to the built-in NammaSpot database.
 *
 * Every seller, product, enquiry, review and customer record lives here. The
 * tables are locked down (no browser access at all) — the app's own server
 * functions are the only way in, and they check who is asking first.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Row = Record<string, string | number | boolean | null>;

let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (client) return client;
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Database is not configured");
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const day = (v: unknown) => s(v).slice(0, 10);

/* ------------------- database rows -> app-facing row shapes ---------------- */

type Any = Record<string, unknown>;

export const categoryRow = (r: Any): Row => ({
  categoryId: s(r["id"]),
  name: s(r["name"]),
  tamilName: s(r["tamil_name"]),
  slug: s(r["slug"]),
  description: s(r["blurb"]),
});

export const sellerRow = (r: Any): Row => ({
  sellerId: s(r["id"]),
  slug: s(r["slug"]),
  name: s(r["business_name"]),
  ownerName: s(r["owner_name"]),
  categoryId: s(r["category_id"]),
  tagline: s(r["tagline"]),
  description: s(r["about"]),
  location: s(r["area"]),
  city: s(r["city"]),
  instagram: s(r["instagram"]),
  whatsapp: s(r["whatsapp"]),
  phone: s(r["whatsapp"]),
  email: s(r["email"]),
  priceFrom: Number(r["price_from"] ?? 0),
  featured: Boolean(r["featured"]),
  status: s(r["status"]),
  deliversAcrossCity: Boolean(r["delivers_across_city"]),
  tags: Array.isArray(r["tags"]) ? (r["tags"] as string[]).join(",") : "",
  imageUrl: s(r["image_url"]),
  coverUrl: s(r["cover_url"]),
  createdAt: day(r["created_at"]),
});

export const productRow = (r: Any): Row => ({
  productId: s(r["id"]),
  sellerId: s(r["seller_id"]),
  name: s(r["name"]),
  type: s(r["type"]),
  price: Number(r["price"] ?? 0),
  unit: s(r["unit"]),
  description: s(r["description"]),
  views: Number(r["views"] ?? 0),
  active: Boolean(r["active"]),
  imageUrl: s(r["image_url"]),
});

export const customerRow = (r: Any): Row => ({
  customerId: s(r["id"]),
  name: s(r["name"]),
  phone: s(r["phone"]),
  area: s(r["area"]),
  imageUrl: s(r["avatar_url"]),
  createdAt: day(r["created_at"]),
});

export const enquiryRow = (r: Any): Row => ({
  enquiryId: s(r["id"]),
  sellerId: s(r["seller_id"]),
  productId: s(r["product_id"]),
  customerName: s(r["customer_name"]),
  phone: s(r["phone"]),
  eventDate: day(r["event_date"]),
  message: s(r["message"]),
  status: s(r["status"]),
  createdAt: day(r["created_at"]),
});

export const reviewRow = (r: Any): Row => ({
  reviewId: s(r["id"]),
  sellerId: s(r["seller_id"]),
  customerName: s(r["customer_name"]),
  rating: Number(r["rating"] ?? 0),
  comment: s(r["comment"]),
  approved: Boolean(r["approved"]),
  createdAt: day(r["created_at"]),
});

/** Reads the whole catalogue in one round-trip. */
export async function readEverything(): Promise<{
  rows: Record<string, Row[]>;
  error?: string | undefined;
}> {
  try {
    const c = db();
    const [categories, sellers, products, customers, enquiries, reviews] = await Promise.all([
      c.from("categories").select("*").order("name"),
      c.from("sellers").select("*").order("created_at", { ascending: false }),
      c.from("products").select("*").order("created_at", { ascending: false }),
      c.from("customers").select("*").order("created_at", { ascending: false }),
      c.from("enquiries").select("*").order("created_at", { ascending: false }),
      c.from("reviews").select("*").order("created_at", { ascending: false }),
    ]);

    const firstError =
      categories.error ??
      sellers.error ??
      products.error ??
      customers.error ??
      enquiries.error ??
      reviews.error;

    return {
      rows: {
        categories: (categories.data ?? []).map(categoryRow),
        sellers: (sellers.data ?? []).map(sellerRow),
        products: (products.data ?? []).map(productRow),
        customers: (customers.data ?? []).map(customerRow),
        enquiries: (enquiries.data ?? []).map(enquiryRow),
        reviews: (reviews.data ?? []).map(reviewRow),
      },
      error: firstError ? firstError.message : undefined,
    };
  } catch (err) {
    return { rows: {}, error: String(err) };
  }
}
