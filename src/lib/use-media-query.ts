"use client";

import { useSyncExternalStore } from "react";

function subscribe(query: string) {
  return (onChange: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  };
}

/** True when the media query matches; false on the server and during hydration. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(subscribe(query), () => window.matchMedia(query).matches, () => false);
}
