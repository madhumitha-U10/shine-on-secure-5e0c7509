/**
 * Server-side seller authorization.
 *
 * Verifies that the currently signed-in Supabase user owns the seller profile
 * they're trying to access. Prevents localStorage/URL manipulation from
 * granting access to another seller's dashboard.
 */

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

export const getAuthorizedSellerId = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ sellerId: z.string() }).parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean; sellerId?: string | undefined }> => {
    const SUPABASE_URL = process.env["SUPABASE_URL"];
    const SUPABASE_SERVICE_ROLE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"];

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return { ok: false };
    }

    const request = await import("@tanstack/react-start/server").then((m) => m.getRequest());

    const authHeader = request?.headers?.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return { ok: false };

    const token = authHeader.replace("Bearer ", "");
    if (!token || token.split(".").length !== 3) return { ok: false };

    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error } = await supabase.auth.getUser(token);
    if (error || !userData.user) return { ok: false };

    const { data: account } = await supabase
      .from("seller_accounts")
      .select("seller_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!account?.seller_id) return { ok: false };

    if (account.seller_id !== data.sellerId) return { ok: false };

    return { ok: true, sellerId: account.seller_id };
  });
