/**
 * Server-side admin mutations that persist to Google Sheets.
 *
 * These use the Apps Script `update` action (Code.gs doPost) to update records
 * by id. The admin token is validated before any write is performed.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { SHEETS_API_BASE_FALLBACK } from "@/lib/sheets-shared";
import { verifyAdminToken } from "@/lib/admin-auth";

async function postToSheet(
  body: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  const base = process.env["SHEETS_API_BASE"] ?? SHEETS_API_BASE_FALLBACK;
  const writeToken = process.env["SHEETS_WRITE_TOKEN"] ?? undefined;
  try {
    const res = await fetch(base, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(writeToken ? { ...body, token: writeToken } : body),
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    try {
      const parsed = JSON.parse(text) as { success?: boolean; error?: string };
      return parsed.success ? { ok: true } : { ok: false, error: parsed.error ?? "Write rejected" };
    } catch {
      return { ok: false, error: "Backend has no doPost handler yet" };
    }
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export const adminSetSellerStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string(),
        sellerId: z.string(),
        status: z.enum(["approved", "rejected", "pending"]),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    if (!(await verifyAdminToken(data.token))) return { ok: false, error: "Unauthorized" };
    return postToSheet({
      action: "update",
      table: "sellers",
      data: { sellerId: data.sellerId, status: data.status },
    });
  });

export const adminSetReviewApproval = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string(),
        reviewId: z.string(),
        approved: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    if (!(await verifyAdminToken(data.token))) return { ok: false, error: "Unauthorized" };
    return postToSheet({
      action: "update",
      table: "reviews",
      data: { reviewId: data.reviewId, approved: data.approved },
    });
  });
