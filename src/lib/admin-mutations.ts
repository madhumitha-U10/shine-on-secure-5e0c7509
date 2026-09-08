/**
 * Admin-only writes, straight to the built-in database.
 *
 * The admin token is verified server-side before anything is touched.
 * Approving or putting a shop back to pending updates its status. Rejecting is
 * a real deletion: the shop, its items, enquiries and reviews all go, and the
 * owner's login is released so the NammaSpot ID can be used again.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { verifyAdminToken } from "@/lib/admin-auth";

export const adminSetSellerStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string(),
        sellerId: z.string().min(1),
        status: z.enum(["approved", "rejected", "pending"]),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    if (!(await verifyAdminToken(data.token))) return { ok: false, error: "Unauthorized" };

    const { db } = await import("@/lib/db.server");
    try {
      const c = db();

      if (data.status !== "rejected") {
        const { error } = await c
          .from("sellers")
          .update({ status: data.status })
          .eq("id", data.sellerId);
        return error ? { ok: false, error: error.message } : { ok: true };
      }

      // Rejected = removed for good. Items, enquiries and reviews are attached
      // to the shop and are deleted with it.
      await c.from("enquiries").delete().eq("seller_id", data.sellerId);
      await c.from("reviews").delete().eq("seller_id", data.sellerId);
      await c.from("products").delete().eq("seller_id", data.sellerId);
      const { error } = await c.from("sellers").delete().eq("id", data.sellerId);
      if (error) return { ok: false, error: error.message };

      // Release the owner's login so their chosen ID is free again.
      const { data: accounts } = await c
        .from("seller_accounts")
        .select("user_id")
        .eq("seller_id", data.sellerId);
      for (const account of accounts ?? []) {
        const userId = (account as { user_id: string }).user_id;
        await c.from("seller_accounts").delete().eq("user_id", userId);
        await c.auth.admin.deleteUser(userId).catch(() => undefined);
      }

      return { ok: true };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  });

export const adminSetReviewApproval = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string(),
        reviewId: z.string().min(1),
        approved: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    if (!(await verifyAdminToken(data.token))) return { ok: false, error: "Unauthorized" };

    const { db } = await import("@/lib/db.server");
    try {
      const { error } = await db()
        .from("reviews")
        .update({ approved: data.approved })
        .eq("id", data.reviewId);
      return error ? { ok: false, error: error.message } : { ok: true };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  });
