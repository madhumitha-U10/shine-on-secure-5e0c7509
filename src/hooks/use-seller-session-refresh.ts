import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";

const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Keeps a signed-in seller's Supabase session alive.
 *
 * JWTs expire after ~1 hour, so we proactively refresh every 30 minutes.
 * If the refresh fails the session is no longer valid and we sign out so the
 * app can send the seller back to the login screen instead of failing silently.
 */
export function useSellerSessionRefresh() {
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) return; // nobody signed in — nothing to refresh
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.error("Session refresh failed:", error);
          await supabase.auth.signOut();
        }
      } catch (error) {
        console.error("Session refresh error:", error);
      }
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);
}
