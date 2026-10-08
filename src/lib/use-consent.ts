"use client";

import { useSyncExternalStore } from "react";
import { CONSENT_KEY, readConsent, type ConsentState } from "./analytics";

/**
 * Subscribes to the visitor's consent choice.
 *
 * Consent lives in localStorage — browser-only state that cannot be read
 * during server rendering. `useSyncExternalStore` is the right primitive for
 * that: it gives a defined server snapshot ("unset", so nothing is assumed
 * granted), keeps every consumer in sync, and avoids the
 * read-in-an-effect-then-setState pattern entirely.
 *
 * Updates arrive from two places: the custom event fired by `writeConsent`
 * in this tab, and the native `storage` event from other tabs.
 */
function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === CONSENT_KEY) onChange();
  };

  window.addEventListener("midis:consent", onChange);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener("midis:consent", onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/* readConsent() returns a string, so the snapshot is referentially stable
   and will not cause an infinite re-render loop. */
const getSnapshot = (): ConsentState => readConsent();
const getServerSnapshot = (): ConsentState => "unset";

export function useConsent(): ConsentState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
