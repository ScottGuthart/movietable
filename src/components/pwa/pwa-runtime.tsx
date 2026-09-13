"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useSafeAreaPadding } from "@/hooks/use-safe-area-padding";

export function PwaRuntime() {
  const { resolvedTheme } = useTheme();
  useSafeAreaPadding();

  useEffect(() => {
    if (!resolvedTheme) return;
    const color = resolvedTheme === "dark" ? "#141414" : "#ffffff";
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
      meta.content = color;
    });
  }, [resolvedTheme]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !window.isSecureContext || !("serviceWorker" in navigator)) return;
    const register = () => {
      void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
        // Installation may be blocked in embedded/private browsers; ordinary browsing still works.
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
