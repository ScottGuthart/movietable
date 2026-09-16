"use client";

import { clearVerdicts } from "@/components/taste/taste-store";
import { getSupabase } from "@/lib/supabase-browser";

/** The slice of the Supabase client account deletion needs; faked in tests. */
export interface AccountDeletionClient {
  rpc(fn: "delete_own_account"): PromiseLike<{ error: { message: string } | null }>;
  auth: { signOut(options?: { scope: "local" }): PromiseLike<unknown> };
}

/**
 * The ordered deletion: the server row first, then this browser's ratings and session.
 * If the network call fails, nothing local is lost, so the visitor can retry. The local
 * sign-out never calls the server — the account is already gone — it just drops the
 * now-invalid session from this browser.
 */
export async function runAccountDeletion(
  client: AccountDeletionClient,
  clearLocal: () => void,
): Promise<void> {
  const { error } = await client.rpc("delete_own_account");
  if (error) throw new Error(`Deleting your account failed: ${error.message}`);
  clearLocal();
  await client.auth.signOut({ scope: "local" });
}

/** Deletes the signed-in account and its saved ratings, then clears this browser. */
export async function deleteAccount(): Promise<void> {
  await runAccountDeletion(getSupabase(), clearVerdicts);
}
