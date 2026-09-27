import { useCallback, useEffect, useRef, useState } from "react";

export type SaveState = "saved" | "saving" | "unsaved" | "error";

export const AUTOSAVE_DELAY_MS = 700;

interface Pending<T> {
  value: T;
  snapshot: string;
}

/**
 * Debounced autosave that never drops an edit:
 * - pending changes are flushed when the component unmounts (navigation),
 *   when the tab is hidden, and on demand via `flush()`;
 * - leaving the page with unsaved changes asks for confirmation;
 * - a failed save keeps the change pending so the next flush retries it.
 *
 * Pass `null` while the value is still loading.
 */
export function useAutosave<T>(value: T | null, save: (value: T) => Promise<unknown>) {
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const lastSaved = useRef<string | null>(null);
  const pending = useRef<Pending<T> | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  const flush = useCallback(async (): Promise<void> => {
    // Serialise saves so an older write can never land after a newer one.
    while (inFlight.current) {
      await inFlight.current;
    }
    const next = pending.current;
    if (!next) {
      return;
    }
    pending.current = null;
    setSaveState("saving");

    const run = (async () => {
      try {
        await saveRef.current(next.value);
        lastSaved.current = next.snapshot;
        setSaveState(pending.current ? "unsaved" : "saved");
      } catch (error) {
        console.error("Failed to save:", error);
        // Keep it pending (unless a newer edit replaced it) so it is retried.
        pending.current ??= next;
        setSaveState("error");
        throw error;
      }
    })();
    inFlight.current = run.catch(() => undefined).finally(() => {
      inFlight.current = null;
    });
    await run;
  }, []);

  /** Record `value` as already persisted (e.g. right after loading it). */
  const markSaved = useCallback((saved: T) => {
    lastSaved.current = JSON.stringify(saved);
    pending.current = null;
    setSaveState("saved");
  }, []);

  useEffect(() => {
    if (value === null) {
      return;
    }
    const snapshot = JSON.stringify(value);
    if (lastSaved.current === null) {
      // First value seen: it came from storage, nothing to save.
      lastSaved.current = snapshot;
      return;
    }
    if (snapshot === lastSaved.current) {
      pending.current = null;
      return;
    }
    pending.current = { value, snapshot };
    setSaveState("unsaved");
    const timer = window.setTimeout(() => void flush().catch(() => undefined), AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [value, flush]);

  useEffect(() => {
    const flushQuietly = () => void flush().catch(() => undefined);
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") flushQuietly();
    };
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (pending.current || inFlight.current) {
        flushQuietly();
        event.preventDefault();
        // Required by some browsers to show the "leave site?" prompt.
        event.returnValue = "";
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Unmount (e.g. navigating to the dashboard): save whatever is pending.
      flushQuietly();
    };
  }, [flush]);

  return { saveState, flush, markSaved };
}
