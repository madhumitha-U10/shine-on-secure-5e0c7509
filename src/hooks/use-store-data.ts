import { useCallback, useEffect, useState } from "react";

import { cleanupExpiredImages, ensureData } from "@/lib/api";

let cleanedUp = false;

/**
 * Client-side data hook. Sellers/Products/Categories come from the Google
 * Sheets backend (fetched once, cached), merged with the localStorage overlay
 * for local writes — neither is available during SSR, so data resolves after
 * hydration.
 */
export function useStoreData<T>(load: () => T) {
  const [data, setData] = useState<T | null>(null);

  const refresh = useCallback(() => {
    void ensureData().then(() => setData(load()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let alive = true;
    if (!cleanedUp) {
      cleanedUp = true;
      cleanupExpiredImages();
    }
    void ensureData().then(
      () => {
        if (alive) setData(load());
      },
      () => {
        // Remote fetch failed — fall back to the local overlay so the UI
        // resolves to an empty/partial state instead of loading forever.
        if (alive) setData(load());
      },
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, refresh };
}
