"use client";

import { useSyncExternalStore } from "react";

type Padding = { top: number; right: number; bottom: number; left: number };
const initial: Padding = { top: 8, right: 8, bottom: 8, left: 8 };
let padding = initial;
const listeners = new Set<() => void>();
let teardown: (() => void) | undefined;

function observeInsets() {
  // Base UI collision padding needs pixels, not CSS env() values. One probe serves every portal.
  const probe = document.createElement("div");
  probe.className = "safe-area-probe";
  probe.setAttribute("aria-hidden", "true");
  document.body.append(probe);
  const update = () => {
    const styles = getComputedStyle(probe);
    const next = {
      top: (parseFloat(styles.paddingTop) || 0) + 8,
      right: (parseFloat(styles.paddingRight) || 0) + 8,
      bottom: (parseFloat(styles.paddingBottom) || 0) + 8,
      left: (parseFloat(styles.paddingLeft) || 0) + 8,
    };
    const viewport = window.visualViewport;
    const root = document.documentElement.style;
    root.setProperty("--visual-height", `${viewport?.height ?? window.innerHeight}px`);
    root.setProperty("--visual-width", `${viewport?.width ?? window.innerWidth}px`);
    root.setProperty("--visual-top", `${viewport?.offsetTop ?? 0}px`);
    root.setProperty("--visual-left", `${viewport?.offsetLeft ?? 0}px`);
    if (Object.keys(next).some((key) => next[key as keyof Padding] !== padding[key as keyof Padding])) {
      padding = next;
      listeners.forEach((listener) => listener());
    }
  };
  const observer = new ResizeObserver(update);
  observer.observe(probe, { box: "border-box" });
  window.addEventListener("resize", update);
  window.visualViewport?.addEventListener("resize", update);
  window.visualViewport?.addEventListener("scroll", update);
  update();
  return () => {
    observer.disconnect();
    probe.remove();
    window.removeEventListener("resize", update);
    window.visualViewport?.removeEventListener("resize", update);
    window.visualViewport?.removeEventListener("scroll", update);
    padding = initial;
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!teardown) teardown = observeInsets();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      teardown?.();
      teardown = undefined;
    }
  };
}

export function useSafeAreaPadding() {
  return useSyncExternalStore(subscribe, () => padding, () => initial);
}
