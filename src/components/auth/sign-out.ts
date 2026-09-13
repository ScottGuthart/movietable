"use client";

import { clearVerdicts } from "@/components/taste/taste-store";
import { getSupabase } from "@/lib/supabase-browser";

/** Ends the session and clears this browser's ratings so a shared device starts clean; the account keeps them. */
export async function signOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw new Error(`Sign-out failed: ${error.message}`);
  clearVerdicts();
}
