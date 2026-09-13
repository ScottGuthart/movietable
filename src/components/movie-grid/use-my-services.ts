"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { FilmSignals } from "@/lib/movies";

export interface MyServices {
  /** JustWatch provider ids the visitor subscribes to. */
  ids: number[];
  /** Show only films streamable on those services. */
  onlyMine: boolean;
  /** Treat free and ad-supported offers as watchable. */
  includeFree: boolean;
}

export const EMPTY_SERVICES: MyServices = { ids: [], onlyMine: false, includeFree: true };
const STORAGE_KEY = "movietable.services";

let snapshot: MyServices | null = null;
const listeners = new Set<() => void>();

function parse(raw: string | null): MyServices {
  if (!raw) return EMPTY_SERVICES;
  try {
    const parsed = JSON.parse(raw) as Partial<MyServices>;
    return {
      ids: Array.isArray(parsed.ids) ? parsed.ids.filter((id): id is number => Number.isInteger(id)) : [],
      onlyMine: parsed.onlyMine === true,
      includeFree: parsed.includeFree !== false,
    };
  } catch {
    return EMPTY_SERVICES;
  }
}

function read(): MyServices {
  if (snapshot) return snapshot;
  try {
    snapshot = parse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    snapshot = EMPTY_SERVICES;
  }
  return snapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    snapshot = parse(event.newValue);
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function write(next: MyServices) {
  snapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: the choice still holds for this session.
  }
  listeners.forEach((listener) => listener());
}

/** Whether a film is watchable under the visitor's services; films without signals never are. */
export function canStream(signals: FilmSignals | undefined, services: MyServices): boolean {
  if (!signals) return false;
  if (services.includeFree && signals.free) return true;
  return signals.streamOn.some((id) => services.ids.includes(id));
}

/** The visitor's services, remembered on this device; the server and the first client render agree on the empty set. */
export function useMyServices(): [MyServices, (next: MyServices) => void] {
  const services = useSyncExternalStore(subscribe, read, () => EMPTY_SERVICES);
  const update = useCallback((next: MyServices) => write(next), []);
  return [services, update];
}
