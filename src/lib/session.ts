/**
 * Seller session + admin session storage.
 *
 * The seller session id is stored client-side for UI routing only — every
 * data access that matters goes through the Supabase auth token (which is
 * validated server-side). The admin session is a signed token from the server
 * that is validated on every admin action.
 */

const SELLER_KEY = "nammaspot.session";
const ADMIN_KEY = "nammaspot.admin.token";

export function setSession(sellerId: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(SELLER_KEY, sellerId);
}

export function getSession(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SELLER_KEY);
}

export function clearSession() {
  if (typeof window !== "undefined") window.localStorage.removeItem(SELLER_KEY);
}

export function setAdminToken(token: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(ADMIN_KEY, token);
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ADMIN_KEY);
}

export function clearAdminToken() {
  if (typeof window !== "undefined") window.localStorage.removeItem(ADMIN_KEY);
}
