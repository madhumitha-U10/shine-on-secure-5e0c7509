import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { SHEET_TABLES, SHEETS_API_BASE_FALLBACK, type SheetRow } from "@/lib/sheets-shared";

export type { SheetCell, SheetRow, SheetTable } from "@/lib/sheets-shared";

/**
 * Server-side proxy to the NammaSpot Google Apps Script Web App.
 * Keeps the browser free of CORS/redirect issues.
 *
 * Reads (GET):  ?action=sellers|products|categories|customers|enquiries|reviews
 * Writes (POST): { action: "addEnquiry" | "addSeller" | "addProduct" | ..., data }
 *                — enabled once doPost exists in the Apps Script (backend/Code.gs).
 */

/**
 * Fetches several tabs in ONE round-trip. Apps Script executes requests from a
 * single user serially, so parallel client calls queue up and time out — this
 * walks the tables sequentially on the server instead.
 */
export const fetchSheetBundle = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ tables: z.array(z.enum(SHEET_TABLES)).min(1).max(6) }).parse(data),
  )
  .handler(
    async ({ data }): Promise<{ rows: Record<string, SheetRow[]>; error?: string | undefined }> => {
      const { readTables } = await import("@/lib/sheets-cache.server");
      return readTables(data.tables);
    },
  );

export const appendSheetRow = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        action: z.enum(["addSeller", "addProduct", "addCustomer", "addEnquiry", "addReview"]),
        row: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string | undefined }> => {
    const base = process.env["SHEETS_API_BASE"] ?? SHEETS_API_BASE_FALLBACK;
    const writeToken = process.env["SHEETS_WRITE_TOKEN"] ?? undefined;
    try {
      const res = await fetch(base, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(
          writeToken
            ? { action: data.action, data: data.row, token: writeToken }
            : { action: data.action, data: data.row },
        ),
      });
      const text = await res.text();
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
      try {
        const parsed = JSON.parse(text) as { success?: boolean; error?: string };
        return parsed.success
          ? { ok: true }
          : { ok: false, error: parsed.error ?? "Write rejected" };
      } catch {
        return { ok: false, error: "Backend has no doPost handler yet" };
      }
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  });
