"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * False when the deployment lacks the browser-visible Supabase env. Sign-in then hides itself
 * instead of breaking the table, and says so once in the console.
 */
export function isSupabaseConfigured(): boolean {
  const configured = Boolean(url && anonKey);
  if (!configured && typeof window !== "undefined" && !warned) {
    warned = true;
    console.error("Sign-in is off: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not set for this deployment.");
  }
  return configured;
}

let warned = false;

/** One browser client per page; PKCE codes and magic-link tokens on the return URL are exchanged automatically. */
export function getSupabase(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set before the Supabase client is used.");
  }
  client ??= createClient(url, anonKey, {
    auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}
