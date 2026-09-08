/**
 * NammaSpot seller authentication.
 *
 * Sellers sign up with a unique NammaSpot ID + their own password. The password
 * is never stored by the app — it is handled (hashed + salted) by the Lovable
 * Cloud auth service. The NammaSpot ID is mapped to a synthetic internal email
 * so the standard email/password auth flow can be reused, and the ID -> seller
 * profile link lives in the `seller_accounts` table (unique index on the ID).
 */

import { supabase } from "@/integrations/supabase/client";

const ID_DOMAIN = "sellers.nammaspot.app";

export const normalizeId = (id: string) => id.trim().toLowerCase();

const internalEmail = (id: string) => `${normalizeId(id)}@${ID_DOMAIN}`;

/** Allowed: 4-24 chars, letters/numbers and . _ - (must start with a letter/number). */
export function validateNammaspotId(raw: string): string | null {
  const id = normalizeId(raw);
  if (!id) return "Choose a NammaSpot ID";
  if (id.length < 4 || id.length > 24) return "NammaSpot ID must be 4-24 characters";
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(id))
    return "Use letters, numbers, dot, underscore or hyphen only";
  return null;
}

export function validatePassword(pw: string): string | null {
  if (!pw) return "Create a password";
  if (pw.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw))
    return "Password must include a letter and a number";
  return null;
}

/** True when the NammaSpot ID is free. Returns null when the check itself failed. */
export async function isIdAvailable(id: string): Promise<boolean | null> {
  const { data, error } = await supabase.rpc("nammaspot_id_available", { _id: normalizeId(id) });
  if (error) return null;
  return Boolean(data);
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  sellerId?: string | null;
  profile?: unknown;
}

export async function signUpSeller(input: {
  nammaspotId: string;
  password: string;
  sellerId: string;
  profile?: unknown;
}): Promise<AuthResult> {
  const id = normalizeId(input.nammaspotId);

  const free = await isIdAvailable(id);
  if (free === false) return { ok: false, error: "That NammaSpot ID is already taken." };

  const { data, error } = await supabase.auth.signUp({
    email: internalEmail(id),
    password: input.password,
    options: { data: { nammaspot_id: id, seller_id: input.sellerId } },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("already been registered"))
      return { ok: false, error: "That NammaSpot ID is already taken." };
    if (msg.includes("pwned") || msg.includes("weak"))
      return { ok: false, error: "That password is too common. Please choose a stronger one." };
    return { ok: false, error: error.message };
  }

  if (!data.session) {
    return { ok: false, error: "Account created, but sign-in failed. Try logging in." };
  }

  const { error: insertError } = await supabase.from("seller_accounts").insert({
    user_id: data.session.user.id,
    nammaspot_id: id,
    seller_id: input.sellerId,
    profile: (input.profile ?? null) as never,
  });

  if (insertError) {
    await supabase.auth.signOut();
    const dup = insertError.code === "23505";
    return {
      ok: false,
      error: dup
        ? "That NammaSpot ID is already taken."
        : "Could not save your account. Try again.",
    };
  }

  return { ok: true, sellerId: input.sellerId };
}

export async function signInSeller(input: {
  nammaspotId: string;
  password: string;
}): Promise<AuthResult> {
  const id = normalizeId(input.nammaspotId);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: internalEmail(id),
    password: input.password,
  });

  if (error || !data.session) {
    return { ok: false, error: "Incorrect NammaSpot ID or password." };
  }

  const { data: account } = await supabase
    .from("seller_accounts")
    .select("seller_id, profile")
    .eq("user_id", data.session.user.id)
    .maybeSingle();

  return { ok: true, sellerId: account?.seller_id ?? null, profile: account?.profile ?? null };
}

export async function signOutSeller() {
  await supabase.auth.signOut();
}

/** Links (or re-links) the signed-in account to a seller profile id. */
export async function linkSellerProfile(sellerId: string) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase
    .from("seller_accounts")
    .update({ seller_id: sellerId })
    .eq("user_id", data.user.id);
}
