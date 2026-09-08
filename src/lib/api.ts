/**
 * NammaSpot data access layer (the only place the app talks to "the backend").
 *
 * Reads: live Google Sheets data through the Apps Script Web App
 * (src/lib/sheets.functions.ts -> src/lib/remote.ts).
 * Writes: applied instantly to a localStorage overlay so the UI stays snappy,
 * and mirrored to the sheet best-effort via `appendSheetRow` (which starts
 * working the moment doPost exists in the Apps Script — see backend/Code.gs).
 */

import {
  STORIES,
  type Category,
  type Customer,
  type Enquiry,
  type Product,
  type Review,
  type Seller,
  type SellerStatus,
  type Story,
} from "@/data/seed";
import { loadRemote, remoteSnapshot } from "@/lib/remote";
import { appendSheetRow } from "@/lib/sheets.functions";
import { adminSetSellerStatus, adminSetReviewApproval } from "@/lib/admin-mutations";
import {
  sellerUpdateProfile,
  sellerUpdateProductImage,
  sellerUpdateProduct,
  sellerRetireProduct,
} from "@/lib/seller-mutations";

export type { Category, Customer, Enquiry, Product, Review, Seller, SellerStatus, Story };

/** Loads Sellers/Products/Categories (and the prepared Customers/Enquiries/
 * Reviews tables) from the Google Sheets backend. Safe to call repeatedly. */
export const ensureData = (force = false) => loadRemote(force);
export const dataError = () => remoteSnapshot().error;

const KEY = "nammaspot.store.v1";

interface Overlay {
  sellers: Seller[];
  products: Product[];
  enquiries: Enquiry[];
  reviews: Review[];
  customers: Customer[];
  statusOverrides: Record<string, SellerStatus>;
  reviewApprovals: Record<string, boolean>;
  /** productId -> uploaded catalogue photo (data URL). */
  productImages: Record<string, string>;
  /** customerId -> uploaded profile picture (data URL). */
  customerAvatars: Record<string, string>;
  /** sellerId -> uploaded profile photo (data URL). */
  sellerImages: Record<string, string>;
  /** Products the seller removed — hidden even if the sheet still lists them. */
  deletedProducts: string[];
  /** Local edits to product details, keyed by productId. */
  productEdits: Record<string, Partial<Product>>;
}

const emptyOverlay: Overlay = {
  sellers: [],
  products: [],
  enquiries: [],
  reviews: [],
  customers: [],
  statusOverrides: {},
  reviewApprovals: {},
  productImages: {},
  customerAvatars: {},
  sellerImages: {},
  deletedProducts: [],
  productEdits: {},
};


function readOverlay(): Overlay {
  if (typeof window === "undefined") return emptyOverlay;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...emptyOverlay, ...(JSON.parse(raw) as Overlay) } : emptyOverlay;
  } catch {
    return emptyOverlay;
  }
}

function writeOverlay(next: Overlay) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

function mutate(fn: (o: Overlay) => void) {
  const o = readOverlay();
  fn(o);
  writeOverlay(o);
}

const id = (prefix: string) => `${prefix}${Date.now().toString(36)}`;

/* ------------------------------- image URLs ------------------------------- */

/**
 * Normalises any picked image value into something safe to persist.
 *
 * - Cloud storage objects become the stable proxy path (`/api/public/media/...`)
 *   so links never expire.
 * - Hosted `https://` images and locally compressed data URLs pass through.
 * - Anything else (blob: object URLs, junk) is dropped, because those die with
 *   the page and would render as a broken image after a refresh.
 */
export function normalizeImageUrl(url?: string | null): string {
  const value = (url ?? "").trim();
  if (!value) return "";
  if (value.startsWith("/api/public/media/")) return value;
  if (value.startsWith("data:image/")) return value;

  // Supabase storage links (public, signed or authenticated) -> stable proxy.
  const storage = value.match(
    /\/storage\/v1\/object\/(?:public\/|sign\/|authenticated\/)?([^?#]+)/i,
  );
  if (storage?.[1]) return `/api/public/media/${storage[1]}`;

  if (/^https?:\/\//i.test(value)) return value;
  return "";
}

/**
 * True when a stored image value is safe to write to the shared backend: a
 * hosted URL or the app's stable media proxy path. Big inline data URLs stay
 * in the local overlay only.
 */
export function shareableImageUrl(url?: string | null): string {
  const value = normalizeImageUrl(url);
  if (!value) return "";
  if (value.startsWith("/api/public/media/")) return value;
  if (/^https?:\/\//i.test(value)) return value;
  return "";
}

/** Resolve a stored value for rendering, with an optional fallback image. */
export function getImageUrl(url?: string | null, fallback = ""): string {
  return normalizeImageUrl(url) || fallback;
}

/** True when the value can actually be rendered by an <img>. */
export function validateImageUrl(url?: string | null): boolean {
  return normalizeImageUrl(url) !== "";
}

/**
 * Housekeeping: drops overlay image entries whose value can no longer be
 * rendered (legacy `blob:` URLs from older builds, empty strings, etc.).
 * Returns the number of entries removed.
 */
export function cleanupExpiredImages(): number {
  let removed = 0;
  mutate((o) => {
    for (const map of [o.sellerImages, o.productImages, o.customerAvatars]) {
      for (const [key, value] of Object.entries(map)) {
        const next = normalizeImageUrl(value);
        if (!next) {
          delete map[key];
          removed += 1;
        } else if (next !== value) {
          map[key] = next;
        }
      }
    }
  });
  return removed;
}

/** Mirror a write to Google Sheets. Never blocks or breaks the UI. */
function mirror(
  action: "addSeller" | "addProduct" | "addCustomer" | "addEnquiry" | "addReview",
  row: Record<string, string | number | boolean | null>,
) {
  void appendSheetRow({ data: { action, row } }).catch(() => undefined);
}

/* ---------------------------------- reads --------------------------------- */

/**
 * Every seller record we know about, including rejected ones. Only the
 * rejection screens and the duplicate guard should use this.
 */
function everySellerRecord(): Seller[] {
  const o = readOverlay();
  const byId = new Map<string, Seller>();
  for (const s of [...remoteSnapshot().sellers, ...o.sellers]) {
    // Later entries (local overlay) win, so a record never appears twice.
    byId.set(s.id, {
      ...s,
      status: o.statusOverrides[s.id] ?? s.status,
      imageUrl: getImageUrl(o.sellerImages[s.id] ?? s.imageUrl) || undefined,
    });
  }
  return [...byId.values()];
}

/**
 * Sellers visible anywhere in the app. Rejected applications are treated as
 * deleted: they disappear from the admin console, public browsing, search and
 * their own dashboard, and everything attached to them is hidden too.
 */
export function allSellers(): Seller[] {
  return everySellerRecord().filter((s) => s.status !== "rejected");
}

/** Only for telling a rejected applicant why they can't get in. */
export const rejectedSellerById = (sid: string): Seller | undefined =>
  everySellerRecord().find((s) => s.id === sid && s.status === "rejected");

/** Ids of sellers whose data must never surface. */
function hiddenSellerIds(): Set<string> {
  return new Set(everySellerRecord().filter((s) => s.status === "rejected").map((s) => s.id));
}

export function allProducts(): Product[] {
  const o = readOverlay();
  const hidden = hiddenSellerIds();
  const removed = new Set(o.deletedProducts);
  return [...remoteSnapshot().products, ...o.products]
    .filter((p) => !removed.has(p.id) && !hidden.has(p.sellerId))
    .map((p) => ({
      ...p,
      ...(o.productEdits[p.id] ?? {}),
      imageUrl: getImageUrl(o.productImages[p.id] ?? p.imageUrl) || undefined,
    }));
}

export function allEnquiries(): Enquiry[] {
  const hidden = hiddenSellerIds();
  return [...readOverlay().enquiries, ...remoteSnapshot().enquiries].filter(
    (e) => !hidden.has(e.sellerId),
  );
}

export function allReviews(): Review[] {
  const o = readOverlay();
  const hidden = hiddenSellerIds();
  return [...remoteSnapshot().reviews, ...o.reviews]
    .filter((r) => !hidden.has(r.sellerId))
    .map((r) => ({
      ...r,
      approved: o.reviewApprovals[r.id] ?? r.approved,
    }));
}


export function allCustomers(): Customer[] {
  const o = readOverlay();
  return [...remoteSnapshot().customers, ...o.customers].map((c) => ({
    ...c,
    avatarUrl: getImageUrl(o.customerAvatars[c.id] ?? c.avatarUrl) || undefined,
  }));
}

export const categories = (): Category[] => remoteSnapshot().categories;

/** Stories are editorial content (no sheet tab yet) — attached to live sellers. */
export function stories(): Story[] {
  const sellers = approvedSellers();
  if (!sellers.length) return [];
  return STORIES.map((st, i) => ({ ...st, sellerId: sellers[i % sellers.length]!.id }));
}

export const approvedSellers = () => allSellers().filter((s) => s.status === "approved");

export const sellerBySlug = (slug: string) => allSellers().find((s) => s.slug === slug);
export const sellerById = (sid: string) => allSellers().find((s) => s.id === sid);
export const categoryById = (cid: string) => categories().find((c) => c.id === cid);
export const categoryBySlug = (slug: string) => categories().find((c) => c.slug === slug);
export const productsBySeller = (sid: string) =>
  allProducts().filter((p) => p.sellerId === sid && p.active);
export const reviewsBySeller = (sid: string) =>
  allReviews().filter((r) => r.sellerId === sid && r.approved);
export const enquiriesBySeller = (sid: string) => allEnquiries().filter((e) => e.sellerId === sid);
export const storiesBySeller = (sid: string) => stories().filter((s) => s.sellerId === sid);

const BASE_AREAS = [
  "Mylapore",
  "Adyar",
  "Besant Nagar",
  "T Nagar",
  "Anna Nagar",
  "Velachery",
  "Kodambakkam",
  "Villivakkam",
  "Tambaram",
  "Coimbatore",
  "Madurai",
];

/** Areas from live seller data, merged with the known Chennai/TN list. */
export function areas(): string[] {
  const live = allSellers()
    .flatMap((s) => [s.area, s.city])
    .filter(Boolean);
  return Array.from(new Set([...live, ...BASE_AREAS]));
}

export const AREAS = BASE_AREAS;

export interface SearchFilters {
  q?: string | undefined;
  category?: string | undefined;
  area?: string | undefined;
  minRating?: number | undefined;
  maxPrice?: number | undefined;
  sort?: "featured" | "rating" | "price-low" | "newest" | undefined;
}

/**
 * Tamil (and Tanglish) search terms mapped to the English words that actually
 * appear in seller data, so "கேக்" / "maruthani" find the right makers.
 */
const TAMIL_SYNONYMS: [RegExp, string][] = [
  [/கேக்|கேக|cake|கேக்ஸ்/i, "cake bakery baker dessert"],
  [/மருதாணி|மெஹந்தி|maruthani|mehendi|henna/i, "mehendi henna bridal"],
  [/மணப்பெண்|திருமண|bridal|kalyanam|கல்யாண/i, "bridal wedding makeup"],
  [/ஒப்பனை|makeup|மேக்கப்/i, "makeup bridal"],
  [/பூ|flower|மாலை/i, "flower garland decor"],
  [/பரிசு|gift|கிஃப்ட்/i, "gift hamper gifting"],
  [/புடவை|சேலை|saree|boutique|ஆடை/i, "saree boutique clothing fashion"],
  [/ஓவியம்|painting|art|கலை/i, "art artist painting portrait"],
  [/அலங்கார|decor|டெக்கார்/i, "decor handmade craft"],
  [/பின்னல்|crochet|கிரோஷே/i, "crochet knit yarn"],
  [/சென்னை/i, "chennai"],
  [/உணவு|food|சமையல்|snack|தின்பண்ட/i, "food snacks bakes"],
];

function expandQuery(q: string): string[] {
  const terms = [q];
  for (const [re, english] of TAMIL_SYNONYMS) {
    if (re.test(q)) terms.push(...english.split(" "));
  }
  return terms;
}

export function searchSellers(f: SearchFilters): Seller[] {
  const q = (f.q ?? "").trim().toLowerCase();
  const terms = q ? expandQuery(q) : [];
  const products = allProducts();

  let list = approvedSellers().filter((s) => {
    if (f.category && categoryById(s.categoryId)?.slug !== f.category) return false;
    if (f.area && s.area !== f.area && s.city !== f.area) return false;
    if (f.minRating && s.rating < f.minRating) return false;
    if (f.maxPrice && s.priceFrom > f.maxPrice) return false;
    if (!q) return true;
    const category = categoryById(s.categoryId);
    const hay = [
      s.businessName,
      s.ownerName,
      s.tagline,
      s.about,
      s.area,
      s.city,
      s.instagram,
      s.tags.join(" "),
      category?.name ?? "",
      category?.tamilName ?? "",
      category?.slug ?? "",
      products
        .filter((p) => p.sellerId === s.id)
        .map((p) => `${p.name} ${p.description}`)
        .join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return terms.some((t) => t && hay.includes(t));
  });

  switch (f.sort) {
    case "rating":
      list = list.sort((a, b) => b.rating - a.rating);
      break;
    case "price-low":
      list = list.sort((a, b) => a.priceFrom - b.priceFrom);
      break;
    case "newest":
      list = list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    default:
      list = list.sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating);
  }
  return list;
}

/* --------------------------------- writes --------------------------------- */

export function createEnquiry(input: Omit<Enquiry, "id" | "status" | "createdAt">): Enquiry {
  const enquiry: Enquiry = {
    ...input,
    id: id("e_"),
    status: "new",
    createdAt: new Date().toISOString().slice(0, 10),
  };
  mutate((o) => {
    o.enquiries.unshift(enquiry);
    if (!allCustomers().some((c) => c.phone === input.phone)) {
      o.customers.unshift({
        id: id("cu_"),
        name: input.customerName,
        phone: input.phone,
        area: "—",
        createdAt: enquiry.createdAt,
      });
    }
  });
  mirror("addEnquiry", {
    enquiryId: enquiry.id,
    sellerId: enquiry.sellerId,
    productId: enquiry.productId ?? "",
    customerName: enquiry.customerName,
    phone: enquiry.phone,
    eventDate: enquiry.eventDate,
    message: enquiry.message,
    status: enquiry.status,
    createdAt: enquiry.createdAt,
  });
  return enquiry;
}

export function registerSeller(
  input: Pick<
    Seller,
    | "businessName"
    | "ownerName"
    | "categoryId"
    | "area"
    | "city"
    | "instagram"
    | "whatsapp"
    | "email"
    | "tagline"
    | "about"
  > & {
    priceFrom: number;
    imageUrl?: string | undefined;
  },
): Seller {
  const imageUrl = normalizeImageUrl(input.imageUrl);
  const { imageUrl: _picked, ...rest } = input;
  const seller: Seller = {
    ...rest,
    id: id("s_"),
    slug: input.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    rating: 0,
    reviewCount: 0,
    featured: false,
    status: "pending",
    createdAt: new Date().toISOString().slice(0, 10),
    deliversAcrossCity: true,
    tags: [],
  };
  mutate((o) => {
    o.sellers.unshift(seller);
    if (imageUrl) o.sellerImages[seller.id] = imageUrl;
  });
  mirror("addSeller", {
    sellerId: seller.id,
    name: seller.businessName,
    ownerName: seller.ownerName,
    category: categoryById(seller.categoryId)?.name ?? "",
    description: seller.about,
    tagline: seller.tagline,
    phone: seller.whatsapp,
    whatsapp: seller.whatsapp,
    instagram: `@${seller.instagram}`,
    email: seller.email,
    location: seller.area,
    city: seller.city,
    priceFrom: seller.priceFrom,
    status: seller.status,
    createdAt: seller.createdAt,
    // Hosted URLs and stored uploads (served via /api/public/media) go to the
    // sheet; only inline data URLs stay in the local overlay.
    imageUrl: shareableImageUrl(imageUrl),
  });
  return { ...seller, ...(imageUrl ? { imageUrl } : {}) };
}

/** Re-adds a seller profile to this browser's store (used after login on a new device). */
export function restoreSellerProfile(seller: Seller) {
  if (allSellers().some((s) => s.id === seller.id)) return;
  mutate((o) => o.sellers.unshift(seller));
}

export function addProduct(input: Omit<Product, "id" | "views" | "active">): Product {
  const product: Product = { ...input, id: id("p_"), views: 0, active: true };
  const imageUrl = normalizeImageUrl(product.imageUrl);
  const { imageUrl: _picked, ...rest } = product;
  mutate((o) => {
    o.products.unshift(rest as Product);
    if (imageUrl) o.productImages[product.id] = imageUrl;
  });
  mirror("addProduct", {
    productId: product.id,
    sellerId: product.sellerId,
    name: product.name,
    description: product.description,
    price: product.price,
    type: product.type,
    unit: product.unit,
    category: categoryById(sellerById(product.sellerId)?.categoryId ?? "")?.name ?? "",
    // Hosted URLs and stored uploads (served via /api/public/media) go to the
    // sheet; only inline data URLs stay in the local overlay.
    imageUrl: shareableImageUrl(imageUrl),
  });
  return product;
}

/** Attach / change a seller profile photo. */
export function setSellerImage(sellerId: string, url: string) {
  const next = normalizeImageUrl(url);
  mutate((o) => {
    if (next) o.sellerImages[sellerId] = next;
    else delete o.sellerImages[sellerId];
  });
  const shareable = shareableImageUrl(next);
  if (shareable) {
    // Best-effort: persist so the photo shows for every visitor, not just here.
    void sellerUpdateProfile({ data: { sellerId, imageUrl: shareable } }).catch(() => undefined);
  }
}

/** Save the signed-in seller's own profile fields (server verifies ownership). */
export async function saveSellerProfile(input: {
  sellerId: string;
  businessName?: string;
  tagline?: string;
  about?: string;
  area?: string;
  whatsapp?: string;
}): Promise<{ ok: boolean; error?: string }> {
  mutate((o) => {
    const local = o.sellers.find((s) => s.id === input.sellerId);
    if (local) {
      if (input.businessName !== undefined) local.businessName = input.businessName;
      if (input.tagline !== undefined) local.tagline = input.tagline;
      if (input.about !== undefined) local.about = input.about;
      if (input.area !== undefined) local.area = input.area;
      if (input.whatsapp !== undefined) local.whatsapp = input.whatsapp;
    }
  });
  const res = await sellerUpdateProfile({ data: input });
  return res.ok ? { ok: true } : { ok: false, ...(res.error ? { error: res.error } : {}) };
}

export function removeSellerImage(sellerId: string) {
  mutate((o) => {
    delete o.sellerImages[sellerId];
  });
}

/** Sellers already registered with this WhatsApp number (duplicate guard). */
export function sellerByPhone(phone: string): Seller | undefined {
  const digits = phone.replace(/[^0-9]/g, "");
  if (!digits) return undefined;
  return allSellers().find((s) => s.whatsapp.replace(/[^0-9]/g, "") === digits);
}

/** Approved sellers in the same category, excluding the given one. */
export function similarSellers(sellerId: string, limit = 3): Seller[] {
  const seller = sellerById(sellerId);
  if (!seller) return [];
  const pool = approvedSellers().filter((s) => s.id !== seller.id);
  const sameCategory = pool.filter((s) => s.categoryId === seller.categoryId);
  const rest = pool.filter((s) => s.categoryId !== seller.categoryId && s.area === seller.area);
  return [...sameCategory, ...rest].slice(0, limit);
}

export async function setSellerStatus(
  sellerId: string,
  status: SellerStatus,
  adminToken?: string,
): Promise<void> {
  if (!adminToken) throw new Error("Admin authorization required");
  const result = await adminSetSellerStatus({ data: { token: adminToken, sellerId, status } });
  if (!result.ok) throw new Error(result.error ?? "Could not update seller status");
  mutate((o) => {
    o.statusOverrides[sellerId] = status;
  });
}

export async function setReviewApproval(
  reviewId: string,
  approved: boolean,
  adminToken?: string,
): Promise<void> {
  if (!adminToken) throw new Error("Admin authorization required");
  const result = await adminSetReviewApproval({ data: { token: adminToken, reviewId, approved } });
  if (!result.ok) throw new Error(result.error ?? "Could not update review");
  mutate((o) => {
    o.reviewApprovals[reviewId] = approved;
  });
}

/**
 * Update an existing product's details. Applied locally straight away and
 * persisted to the shared backend (the server re-checks that the signed-in
 * seller owns this product).
 */
export async function updateProduct(
  productId: string,
  patch: Partial<Pick<Product, "name" | "price" | "unit" | "description" | "type">>,
): Promise<{ ok: boolean; error?: string }> {
  const sellerId = allProducts().find((p) => p.id === productId)?.sellerId;
  mutate((o) => {
    const local = o.products.find((p) => p.id === productId);
    if (local) Object.assign(local, patch);
    else o.productEdits[productId] = { ...(o.productEdits[productId] ?? {}), ...patch };
  });
  if (!sellerId) return { ok: true };
  const res = await sellerUpdateProduct({ data: { sellerId, productId, ...patch } }).catch(() => ({
    ok: false,
    error: "Saved on this device, but the shared listing could not be updated.",
  }));
  return res.ok ? { ok: true } : { ok: false, ...(res.error ? { error: res.error } : {}) };
}

/** Remove a product from the seller's catalogue, everywhere. */
export async function deleteProduct(productId: string): Promise<{ ok: boolean; error?: string }> {
  const sellerId = allProducts().find((p) => p.id === productId)?.sellerId;
  mutate((o) => {
    o.products = o.products.filter((p) => p.id !== productId);
    delete o.productImages[productId];
    delete o.productEdits[productId];
    if (!o.deletedProducts.includes(productId)) o.deletedProducts.push(productId);
  });
  if (!sellerId) return { ok: true };
  const res = await sellerRetireProduct({ data: { sellerId, productId } }).catch(() => ({
    ok: false,
    error: "Removed on this device, but the shared listing could not be updated.",
  }));
  return res.ok ? { ok: true } : { ok: false, ...(res.error ? { error: res.error } : {}) };
}


/** Attach / change a catalogue photo for an existing product. */
export function setProductImage(productId: string, url: string) {
  const next = normalizeImageUrl(url);
  mutate((o) => {
    if (next) o.productImages[productId] = next;
    else delete o.productImages[productId];
  });
  const sellerId = allProducts().find((p) => p.id === productId)?.sellerId;
  // Persist to the sheet so the photo survives on other devices too.
  if (sellerId && shareableImageUrl(next)) {
    void sellerUpdateProductImage({
      data: { sellerId, productId, imageUrl: next },
    }).catch(() => undefined);
  }
}

export function removeProductImage(productId: string) {
  mutate((o) => {
    delete o.productImages[productId];
  });
}

/** Attach / change a customer profile picture (optional). */
export function setCustomerAvatar(customerId: string, url: string) {
  const next = normalizeImageUrl(url);
  mutate((o) => {
    if (next) o.customerAvatars[customerId] = next;
    else delete o.customerAvatars[customerId];
  });
}

export function removeCustomerAvatar(customerId: string) {
  mutate((o) => {
    delete o.customerAvatars[customerId];
  });
}

export const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
