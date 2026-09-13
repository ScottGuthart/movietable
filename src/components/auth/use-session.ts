"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase-browser";
import { isV0Preview } from "@/lib/preview-mode";

export type SessionState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; session: Session };

function fromSession(session: Session | null): SessionState {
  return session ? { status: "signed-in", session } : { status: "signed-out" };
}

/** The visitor's Supabase session, kept current as they sign in or out in this or another tab. */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ status: isV0Preview() ? "signed-out" : "loading" });
  useEffect(() => {
    if (isV0Preview()) return;
    const supabase = getSupabase();
    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setState(fromSession(data.session));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) setState(fromSession(session));
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);
  return state;
}
