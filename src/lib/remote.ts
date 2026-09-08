/**
 * Maps Google Sheets rows (via the Apps Script Web App) onto the app's
 * domain types. The UI never sees sheet field names — only this file does.
 *
 * Live tables: Sellers, Products, Categories.
 * Prepared for later: Customers, Enquiries, Reviews (already read + mapped,
 * currently empty in the sheet).
 */

import {
  CATEGORIES as SEED_CATEGORIES,
  type Category,
  type Customer,
  type Enquiry,
  type Product,
  type Review,
  type Seller,
  type SellerStatus,
} from "@/data/seed";
import { fetchSheetBundle, type SheetRow, type SheetTable } from "@/lib/sheets.functions";

const str = (v: unknown, fallback = "") =>
  v === undefined || v === null || v === "" ? fallback : String(v).trim();
const num = (v: unknown, fallback = 0) => {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
};
const bool = (v: unknown) => /^(true|yes|1|y)$/i.test(String(v ?? "").trim());
const today = () => new Date().toISOString().slice(0, 10);

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "item";

const pick = (row: SheetRow, ...keys: string[]) => {
  for (const k of keys) {
    const hit = Object.keys(row).find((rk) => rk.toLowerCase() === k.toLowerCase());
    if (hit && row[hit] !== "" && row[hit] !== null && row[hit] !== undefined) return row[hit];
  }
  return undefined;
};

export interface RemoteData {
  categories: Category[];
  sellers: Seller[];
  products: Product[];
  customers: Customer[];
  enquiries: Enquiry[];
  reviews: Review[];
  error: string | null;
}

export const emptyRemote: RemoteData = {
  categories: [],
  sellers: [],
  products: [],
  customers: [],
  enquiries: [],
  reviews: [],
  error: null,
};

/* -------------------------------- mapping -------------------------------- */

function mapCategory(row: SheetRow): Category {
  const name = str(pick(row, "name", "category", "categoryName"), "Category");
  const seedMatch = SEED_CATEGORIES.find(
    (c) => c.name.toLowerCase() === name.toLowerCase() || c.slug === slugify(name),
  );
  return {
    id: str(pick(row, "categoryId", "id"), slugify(name)),
    name,
    tamilName: str(pick(row, "tamilName"), seedMatch?.tamilName ?? ""),
    slug: str(pick(row, "slug"), slugify(name)),
    blurb: str(pick(row, "description", "blurb"), seedMatch?.blurb ?? ""),
  };
}

function mapProduct(row: SheetRow): Product {
  const type =
    str(pick(row, "type"), "product").toLowerCase() === "service" ? "service" : "product";
  return {
    id: str(pick(row, "productId", "id"), `p_${Math.random().toString(36).slice(2, 8)}`),
    sellerId: str(pick(row, "sellerId", "seller")),
    name: str(pick(row, "name", "productName"), "Item"),
    type,
    price: num(pick(row, "price")),
    unit: str(pick(row, "unit"), type === "service" ? "per booking" : "each"),
    description: str(pick(row, "description")),
    views: num(pick(row, "views")),
    active: pick(row, "active") === undefined ? true : bool(pick(row, "active")),
    imageUrl: str(pick(row, "imageUrl", "image", "photo")) || undefined,
  };
}

function mapSeller(row: SheetRow, categories: Category[]): Seller {
  const name = str(pick(row, "name", "businessName"), "Seller");
  const categoryName = str(pick(row, "category", "categoryName"));
  const categoryId =
    str(pick(row, "categoryId")) ||
    categories.find(
      (c) => c.name.toLowerCase() === categoryName.toLowerCase() || c.id === categoryName,
    )?.id ||
    categories[0]?.id ||
    "";
  const description = str(pick(row, "description", "about"));
  const location = str(pick(row, "location", "area"), "Chennai");
  const statusRaw = str(pick(row, "status"), "approved").toLowerCase();
  const status: SellerStatus =
    statusRaw === "pending" || statusRaw === "rejected" ? statusRaw : "approved";

  return {
    id: str(pick(row, "sellerId", "id"), slugify(name)),
    slug: str(pick(row, "slug"), slugify(name)),
    businessName: name,
    ownerName: str(pick(row, "ownerName", "owner"), name),
    categoryId,
    tagline: str(pick(row, "tagline"), description.slice(0, 110)),
    about: description,
    area: location,
    city: str(pick(row, "city"), location),
    instagram: str(pick(row, "instagram")).replace(/^@/, ""),
    whatsapp: str(pick(row, "whatsapp", "phone")).replace(/[^0-9]/g, ""),
    email: str(pick(row, "email")),
    rating: num(pick(row, "rating")),
    reviewCount: num(pick(row, "reviewCount")),
    priceFrom: num(pick(row, "priceFrom", "startingPrice")),
    featured: bool(pick(row, "featured")),
    status,
    createdAt: str(pick(row, "createdAt", "date"), today()).slice(0, 10),
    deliversAcrossCity:
      pick(row, "deliversAcrossCity") === undefined ? true : bool(pick(row, "deliversAcrossCity")),
    tags: str(pick(row, "tags"))
      .split(/[,|]/)
      .map((t) => t.trim())
      .filter(Boolean),
    imageUrl: str(pick(row, "imageUrl", "image", "photo", "logo")) || undefined,
    coverUrl: str(pick(row, "coverUrl", "cover", "bannerUrl")) || undefined,
  };
}

function mapCustomer(row: SheetRow): Customer {
  return {
    id: str(pick(row, "customerId", "id"), `cu_${Math.random().toString(36).slice(2, 8)}`),
    name: str(pick(row, "name", "customerName"), "Customer"),
    phone: str(pick(row, "phone", "whatsapp")),
    area: str(pick(row, "area", "location"), "—"),
    createdAt: str(pick(row, "createdAt", "date"), today()).slice(0, 10),
    avatarUrl: str(pick(row, "imageUrl", "photo", "avatarUrl")) || undefined,
  };
}

function mapEnquiry(row: SheetRow): Enquiry {
  const statusRaw = str(pick(row, "status"), "new").toLowerCase();
  return {
    id: str(pick(row, "enquiryId", "id"), `e_${Math.random().toString(36).slice(2, 8)}`),
    sellerId: str(pick(row, "sellerId")),
    productId: str(pick(row, "productId")) || null,
    customerName: str(pick(row, "customerName", "name"), "Customer"),
    phone: str(pick(row, "phone", "whatsapp")),
    eventDate: str(pick(row, "eventDate", "date")).slice(0, 10),
    message: str(pick(row, "message", "notes")),
    status: statusRaw === "responded" || statusRaw === "closed" ? statusRaw : "new",
    createdAt: str(pick(row, "createdAt"), today()).slice(0, 10),
  };
}

function mapReview(row: SheetRow): Review {
  return {
    id: str(pick(row, "reviewId", "id"), `r_${Math.random().toString(36).slice(2, 8)}`),
    sellerId: str(pick(row, "sellerId")),
    customerName: str(pick(row, "customerName", "name"), "Customer"),
    rating: num(pick(row, "rating"), 5),
    comment: str(pick(row, "comment", "review", "message")),
    createdAt: str(pick(row, "createdAt", "date"), today()).slice(0, 10),
    approved: pick(row, "approved") === undefined ? true : bool(pick(row, "approved")),
  };
}

/* --------------------------------- loading -------------------------------- */

function derive(data: RemoteData): RemoteData {
  const approvedReviews = data.reviews.filter((r) => r.approved);

  const sellers = data.sellers.map((s) => {
    const mine = approvedReviews.filter((r) => r.sellerId === s.id);
    const rating = mine.length
      ? Math.round((mine.reduce((a, r) => a + r.rating, 0) / mine.length) * 10) / 10
      : s.rating;
    const prices = data.products
      .filter((p) => p.sellerId === s.id && p.active && p.price > 0)
      .map((p) => p.price);
    return {
      ...s,
      rating,
      reviewCount: mine.length || s.reviewCount,
      priceFrom: s.priceFrom || (prices.length ? Math.min(...prices) : 0),
    };
  });

  // No "featured" column in the sheet yet — surface the first few sellers so the
  // Featured page stays useful until the column exists.
  const anyFeatured = sellers.some((s) => s.featured);
  const withFeatured = anyFeatured
    ? sellers
    : sellers.map((s, i) => ({ ...s, featured: i < Math.min(6, sellers.length) }));

  return { ...data, sellers: withFeatured };
}

const CACHE_KEY = "nammaspot.sheets.cache.v1";
const CACHE_TTL = 5 * 60 * 1000;

interface CacheEnvelope {
  at: number;
  rows: Record<string, SheetRow[]>;
}

function readCache(): CacheEnvelope | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CacheEnvelope) : null;
  } catch {
    return null;
  }
}

function writeCache(rows: Record<string, SheetRow[]>) {
  if (typeof window === "undefined") return;
  try {
    const prev = readCache()?.rows ?? {};
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ at: Date.now(), rows: { ...prev, ...rows } } satisfies CacheEnvelope),
    );
  } catch {
    /* storage full or unavailable — cache is optional */
  }
}

function build(rows: Record<string, SheetRow[]>, error: string | null): RemoteData {
  const categories = (rows["categories"] ?? []).map(mapCategory);
  return derive({
    categories,
    sellers: (rows["sellers"] ?? []).map((r) => mapSeller(r, categories)),
    products: (rows["products"] ?? []).map(mapProduct),
    customers: (rows["customers"] ?? []).map(mapCustomer),
    enquiries: (rows["enquiries"] ?? []).map(mapEnquiry),
    reviews: (rows["reviews"] ?? []).map(mapReview),
    error,
  });
}

let cache: RemoteData | null = null;
let rawRows: Record<string, SheetRow[]> = {};
let inflight: Promise<RemoteData> | null = null;

export function remoteSnapshot(): RemoteData {
  return cache ?? emptyRemote;
}

const CORE: SheetTable[] = ["categories", "sellers", "products"];
const SECONDARY: SheetTable[] = ["customers", "enquiries", "reviews"];

/**
 * Loads the sheet data. Apps Script handles one request at a time per user, so
 * everything goes through a single bundled server call, backed by a short-lived
 * localStorage cache for instant page-to-page navigation.
 */
export function loadRemote(force = false): Promise<RemoteData> {
  if (!force && cache) return Promise.resolve(cache);
  if (!force && inflight) return inflight;

  const cached = readCache();
  if (
    !force &&
    cached &&
    Date.now() - cached.at < CACHE_TTL &&
    (cached.rows["sellers"]?.length ?? 0) >= 0
  ) {
    rawRows = cached.rows;
    cache = build(rawRows, null);
    if (Date.now() - cached.at > 60_000) void revalidate();
    return Promise.resolve(cache);
  }

  inflight = (async () => {
    try {
      const core = await fetchSheetBundle({ data: { tables: CORE } });
      rawRows = { ...rawRows, ...core.rows };
      writeCache(core.rows);
      cache = build(rawRows, core.error ?? null);

      // Prepared tables (Customers / Enquiries / Reviews) load in the
      // background and refresh the cache when they arrive.
      void fetchSheetBundle({ data: { tables: SECONDARY } })
        .then((extra) => {
          rawRows = { ...rawRows, ...extra.rows };
          writeCache(extra.rows);
          cache = build(rawRows, cache?.error ?? null);
        })
        .catch(() => undefined);
    } catch (err) {
      cache = { ...emptyRemote, error: String(err) };
    } finally {
      inflight = null;
    }
    return cache!;
  })();

  return inflight;
}

async function revalidate() {
  try {
    const fresh = await fetchSheetBundle({ data: { tables: [...CORE, ...SECONDARY] } });
    rawRows = { ...rawRows, ...fresh.rows };
    writeCache(fresh.rows);
    cache = build(rawRows, fresh.error ?? null);
  } catch {
    /* keep serving cached data */
  }
}
