/**
 * Customer engagement store (saves, recently viewed) + lightweight analytics
 * counters for sellers.
 *
 * Everything lives in localStorage so browsing, saving and tracking all work
 * before a customer signs in. No backend/schema changes are involved.
 */

const KEY = "nammaspot.engagement.v1";
const EVENT = "nammaspot:engagement";

export interface RecentItem {
  type: "seller" | "product";
  id: string;
  at: number;
}

export interface Counters {
  storeViews: number;
  productViews: number;
  saves: number;
  shares: number;
  whatsappClicks: number;
}

interface EngagementState {
  savedShops: string[];
  savedProducts: string[];
  recent: RecentItem[];
  /** sellerId -> counters */
  sellerStats: Record<string, Counters>;
  /** productId -> counters */
  productStats: Record<string, Counters>;
}

const emptyCounters = (): Counters => ({
  storeViews: 0,
  productViews: 0,
  saves: 0,
  shares: 0,
  whatsappClicks: 0,
});

const emptyState: EngagementState = {
  savedShops: [],
  savedProducts: [],
  recent: [],
  sellerStats: {},
  productStats: {},
};

function read(): EngagementState {
  if (typeof window === "undefined") return emptyState;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...emptyState, ...(JSON.parse(raw) as EngagementState) } : emptyState;
  } catch {
    return emptyState;
  }
}

function write(next: EngagementState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full / private mode — engagement is best-effort */
  }
  window.dispatchEvent(new Event(EVENT));
}

function mutate(fn: (s: EngagementState) => void) {
  const s = read();
  fn(s);
  write(s);
}

/** Subscribe to any engagement change (saves, views, shares). */
export function onEngagementChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/* --------------------------------- saves --------------------------------- */

export const savedShopIds = (): string[] => read().savedShops;
export const savedProductIds = (): string[] => read().savedProducts;

export const isShopSaved = (sellerId: string) => read().savedShops.includes(sellerId);
export const isProductSaved = (productId: string) => read().savedProducts.includes(productId);

/** Toggles a saved shop. Returns the new saved state. */
export function toggleSaveShop(sellerId: string): boolean {
  let saved = false;
  mutate((s) => {
    if (s.savedShops.includes(sellerId)) {
      s.savedShops = s.savedShops.filter((x) => x !== sellerId);
    } else {
      s.savedShops = [sellerId, ...s.savedShops];
      saved = true;
      bump(s.sellerStats, sellerId, "saves");
    }
  });
  return saved;
}

/** Toggles a saved product. Returns the new saved state. */
export function toggleSaveProduct(productId: string, sellerId?: string): boolean {
  let saved = false;
  mutate((s) => {
    if (s.savedProducts.includes(productId)) {
      s.savedProducts = s.savedProducts.filter((x) => x !== productId);
    } else {
      s.savedProducts = [productId, ...s.savedProducts];
      saved = true;
      bump(s.productStats, productId, "saves");
      if (sellerId) bump(s.sellerStats, sellerId, "saves");
    }
  });
  return saved;
}

/* ----------------------------- recently viewed ---------------------------- */

const RECENT_LIMIT = 24;

export const recentlyViewed = (): RecentItem[] => read().recent;

function pushRecent(s: EngagementState, type: RecentItem["type"], id: string) {
  s.recent = [
    { type, id, at: Date.now() },
    ...s.recent.filter((r) => !(r.type === type && r.id === id)),
  ].slice(0, RECENT_LIMIT);
}

export function clearRecentlyViewed() {
  mutate((s) => {
    s.recent = [];
  });
}

/* -------------------------------- tracking -------------------------------- */

function bump(map: Record<string, Counters>, id: string, key: keyof Counters) {
  const current = map[id] ?? emptyCounters();
  map[id] = { ...current, [key]: current[key] + 1 };
}

export function trackStoreView(sellerId: string) {
  mutate((s) => {
    bump(s.sellerStats, sellerId, "storeViews");
    pushRecent(s, "seller", sellerId);
  });
}

export function trackProductView(productId: string, sellerId?: string) {
  mutate((s) => {
    bump(s.productStats, productId, "productViews");
    if (sellerId) bump(s.sellerStats, sellerId, "productViews");
    pushRecent(s, "product", productId);
  });
}

export function trackShare(opts: { sellerId?: string; productId?: string }) {
  mutate((s) => {
    if (opts.sellerId) bump(s.sellerStats, opts.sellerId, "shares");
    if (opts.productId) bump(s.productStats, opts.productId, "shares");
  });
}

export function trackWhatsAppClick(opts: { sellerId?: string; productId?: string }) {
  mutate((s) => {
    if (opts.sellerId) bump(s.sellerStats, opts.sellerId, "whatsappClicks");
    if (opts.productId) bump(s.productStats, opts.productId, "whatsappClicks");
  });
}

/* --------------------------------- reads ---------------------------------- */

export const sellerCounters = (sellerId: string): Counters =>
  read().sellerStats[sellerId] ?? emptyCounters();

export const productCounters = (productId: string): Counters =>
  read().productStats[productId] ?? emptyCounters();
