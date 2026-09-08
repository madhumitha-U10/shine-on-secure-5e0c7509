/**
 * Server-only seller authorization helper.
 *
 * Confirms that the Supabase user attached to the incoming request owns the
 * seller profile being touched. Shared by every seller-scoped server function
 * so a tampered localStorage / URL can never reach another seller's data.
 */

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

export async function authorizedSellerId(): Promise<string | null> {
  const SUPABASE_URL = process.env["SUPABASE_URL"];
  const SUPABASE_SERVICE_ROLE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;

  const { getRequest } = await import("@tanstack/react-start/server");
  const request = getRequest();
  const authHeader = request?.headers?.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice("Bearer ".length);
  if (!token || token.split(".").length !== 3) return null;

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error } = await supabase.auth.getUser(token);
  if (error || !userData.user) return null;

  const { data: account } = await supabase
    .from("seller_accounts")
    .select("seller_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  return account?.seller_id ?? null;
}

/** True only when the signed-in user owns `sellerId`. */
export async function ownsSeller(sellerId: string): Promise<boolean> {
  const owned = await authorizedSellerId();
  return Boolean(owned) && owned === sellerId;
}
