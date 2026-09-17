"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

const COMPLETED_KEY = "onboarding:completed";
const SNOOZED_KEY = "onboarding:snoozed-until";
const STEP_KEY = "onboarding:step-progress";
const SNOOZE_MS = 24 * 60 * 60 * 1000;

interface OnboardingSnapshot {
  completed: boolean;
  snoozedUntil: string | null;
  step: number;
}

const noopSubscribe = () => () => {};

function readStorage(): OnboardingSnapshot {
  try {
    if (typeof window === "undefined") throw new Error("server");
    return {
      completed: window.localStorage.getItem(COMPLETED_KEY) === "true",
      snoozedUntil: window.localStorage.getItem(SNOOZED_KEY),
      step: Math.max(0, Number(window.localStorage.getItem(STEP_KEY) ?? 0) || 0),
    };
  } catch {
    return { completed: false, snoozedUntil: null, step: 0 };
  }
}

function writeStorage(next: OnboardingSnapshot) {
  try {
    window.localStorage.setItem(COMPLETED_KEY, String(next.completed));
    if (next.snoozedUntil) window.localStorage.setItem(SNOOZED_KEY, next.snoozedUntil);
    else window.localStorage.removeItem(SNOOZED_KEY);
    window.localStorage.setItem(STEP_KEY, String(next.step));
  } catch (error) {
    // Storage may be unavailable (private mode, blocked iframe); the React state still drives the UI.
    console.log("[v0] onboarding storage write failed", error);
  }
}

function isSnoozed(snoozedUntil: string | null) {
  if (!snoozedUntil) return false;
  const expiresAt = Date.parse(snoozedUntil);
  return Number.isFinite(expiresAt) && Date.now() < expiresAt;
}

/**
 * Onboarding progress lives in plain React state (lazily read from localStorage on the
 * client) and is mirrored back to localStorage on every change. `ready` is false during
 * SSR and hydration, so the wizard never renders open before storage has been consulted.
 */
export function useOnboardingState() {
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [state, setState] = useState<OnboardingSnapshot>(readStorage);

  const commit = useCallback((updater: (current: OnboardingSnapshot) => OnboardingSnapshot) => {
    setState((current) => {
      const next = updater(current);
      writeStorage(next);
      return next;
    });
  }, []);

  const setStep = useCallback((step: number) => commit((current) => ({ ...current, step })), [commit]);
  const complete = useCallback(() => commit(() => ({ completed: true, snoozedUntil: null, step: 0 })), [commit]);
  const snooze = useCallback(
    () => commit((current) => ({ ...current, snoozedUntil: new Date(Date.now() + SNOOZE_MS).toISOString() })),
    [commit],
  );
  const resume = useCallback(() => commit(() => ({ completed: false, snoozedUntil: null, step: 0 })), [commit]);

  const snoozed = isSnoozed(state.snoozedUntil);
  return { ...state, ready, snoozed, shouldShow: ready && !state.completed && !snoozed, setStep, complete, snooze, resume };
}
