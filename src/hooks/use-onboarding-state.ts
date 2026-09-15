"use client";

import { useCallback, useSyncExternalStore } from "react";

const COMPLETED_KEY = "onboarding:completed";
const SNOOZED_KEY = "onboarding:snoozed-until";
const STEP_KEY = "onboarding:step-progress";

interface OnboardingSnapshot {
  completed: boolean;
  snoozedUntil: string | null;
  step: number;
}

const EMPTY: OnboardingSnapshot = { completed: false, snoozedUntil: null, step: 0 };
let snapshot: OnboardingSnapshot | null = null;
const listeners = new Set<() => void>();

function read(): OnboardingSnapshot {
  if (snapshot) return snapshot;
  try {
    snapshot = {
      completed: window.localStorage.getItem(COMPLETED_KEY) === "true",
      snoozedUntil: window.localStorage.getItem(SNOOZED_KEY),
      step: Math.max(0, Number(window.localStorage.getItem(STEP_KEY) ?? 0) || 0),
    };
  } catch {
    snapshot = EMPTY;
  }
  return snapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (![COMPLETED_KEY, SNOOZED_KEY, STEP_KEY].includes(event.key ?? "")) return;
    snapshot = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); };
}

function update(next: OnboardingSnapshot) {
  snapshot = next;
  try {
    window.localStorage.setItem(COMPLETED_KEY, String(next.completed));
    if (next.snoozedUntil) window.localStorage.setItem(SNOOZED_KEY, next.snoozedUntil);
    else window.localStorage.removeItem(SNOOZED_KEY);
    window.localStorage.setItem(STEP_KEY, String(next.step));
  } catch {
    // The in-memory snapshot still keeps the flow usable for this session.
  }
  listeners.forEach((listener) => listener());
}

function subscribeToSnooze(snoozedUntil: string | null, listener: () => void) {
  if (!snoozedUntil) return () => {};
  const expiresAt = Date.parse(snoozedUntil);
  if (!Number.isFinite(expiresAt)) return () => {};

  const timeout = setTimeout(listener, Math.max(0, expiresAt - Date.now()) + 1);
  return () => clearTimeout(timeout);
}

function readSnoozed(snoozedUntil: string | null) {
  if (!snoozedUntil) return false;
  const expiresAt = Date.parse(snoozedUntil);
  return Number.isFinite(expiresAt) && Date.now() < expiresAt;
}

function readServerSnoozed(snoozedUntil: string | null) {
  // Until hydration completes, hide the wizard if a snooze was persisted.
  return snoozedUntil !== null;
}

export function useOnboardingState() {
  const state = useSyncExternalStore(subscribe, read, () => EMPTY);
  const setStep = useCallback((step: number) => update({ ...read(), step }), []);
  const complete = useCallback(() => update({ completed: true, snoozedUntil: null, step: 0 }), []);
  const snooze = useCallback(() => update({ ...read(), snoozedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }), []);
  const resume = useCallback(() => update({ completed: false, snoozedUntil: null, step: 0 }), []);

  const snoozed = useSyncExternalStore(
    (listener) => subscribeToSnooze(state.snoozedUntil, listener),
    () => readSnoozed(state.snoozedUntil),
    () => readServerSnoozed(state.snoozedUntil),
  );
  return { ...state, snoozed, shouldShow: !state.completed && !snoozed, setStep, complete, snooze, resume };
}
