"use client";

import { useEffect, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { getStampedVerdicts, replaceVerdicts, subscribeToVerdicts } from "@/components/taste/taste-store";
import { diffVerdicts, mergeVerdicts, type StampedVerdicts } from "@/lib/ratings-sync";
import { getSupabase } from "@/lib/supabase-browser";
import { parseVerdict } from "@/lib/taste";

export type SyncState = { status: "idle" } | { status: "syncing" } | { status: "synced" } | { status: "error"; message: string };

interface RatingRow {
  slug: string;
  verdict: "rated" | "skip";
  stars: number | null;
  updated_at: string;
}

const PUSH_DELAY_MS = 600;

function toStamped(rows: RatingRow[]): StampedVerdicts {
  const stamped: StampedVerdicts = {};
  for (const row of rows) {
    const verdict = row.verdict === "skip" ? "skip" : parseVerdict(row.stars);
    if (verdict !== null) stamped[row.slug] = { verdict, updatedAt: Date.parse(row.updated_at) };
  }
  return stamped;
}

async function upload(supabase: SupabaseClient, userId: string, entries: StampedVerdicts): Promise<void> {
  const rows = Object.entries(entries).map(([slug, entry]) => ({
    user_id: userId,
    slug,
    verdict: entry.verdict === "skip" ? "skip" : "rated",
    stars: entry.verdict === "skip" ? null : entry.verdict,
    updated_at: new Date(entry.updatedAt).toISOString(),
  }));
  if (rows.length === 0) return;
  const { error } = await supabase.from("taste_ratings").upsert(rows, { onConflict: "user_id,slug" });
  if (error) throw new Error(`Saving ratings to your account failed: ${error.message}`);
}

async function remove(supabase: SupabaseClient, userId: string, slugs: string[]): Promise<void> {
  if (slugs.length === 0) return;
  const { error } = await supabase.from("taste_ratings").delete().eq("user_id", userId).in("slug", slugs);
  if (error) throw new Error(`Removing ratings from your account failed: ${error.message}`);
}

/**
 * Keeps a signed-in visitor's verdicts and their account in step: merges on sign-in
 * (newer verdict wins), then pushes every local change after a short pause.
 */
export function useRatingsSync(session: Session | null): SyncState {
  const [settled, setSettled] = useState<Exclude<SyncState, { status: "syncing" }>>({ status: "idle" });
  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabase();
    let cancelled = false;
    let baseline: StampedVerdicts = {};
    let timer: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe: (() => void) | undefined;

    const fail = (error: unknown) => {
      if (!cancelled) setSettled({ status: "error", message: error instanceof Error ? error.message : "Sync failed." });
    };
    const push = async () => {
      const current = getStampedVerdicts();
      const { upserts, deletes } = diffVerdicts(baseline, current);
      try {
        await Promise.all([upload(supabase, userId, upserts), remove(supabase, userId, deletes)]);
        baseline = current;
        if (!cancelled) setSettled({ status: "synced" });
      } catch (error) {
        fail(error);
      }
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void push(), PUSH_DELAY_MS);
    };

    void (async () => {
      const { data, error } = await supabase.from("taste_ratings").select("slug, verdict, stars, updated_at");
      if (cancelled) return;
      if (error) {
        fail(new Error(`Loading your saved ratings failed: ${error.message}`));
        return;
      }
      const { merged, toUpload } = mergeVerdicts(getStampedVerdicts(), toStamped(data as RatingRow[]));
      replaceVerdicts(merged);
      baseline = merged;
      try {
        await upload(supabase, userId, toUpload);
        if (!cancelled) setSettled({ status: "synced" });
      } catch (uploadError) {
        fail(uploadError);
      }
      unsubscribe = subscribeToVerdicts(schedule);
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsubscribe?.();
    };
  }, [userId]);

  if (!userId) return { status: "idle" };
  return settled.status === "idle" ? { status: "syncing" } : settled;
}
