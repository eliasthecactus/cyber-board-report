import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppSettings } from "@/types";
import { DEFAULT_PRIMARY_COLOR, defaultSettings } from "@/lib/settingsDefaults";
import { darken, readableOn } from "@/lib/color";
import { getSettings, saveSettings } from "@/lib/storage";

interface SettingsContextValue {
  settings: AppSettings;
  loading: boolean;
  /** Set when browser storage could not be opened (e.g. blocked site data). */
  storageError: unknown;
  /** Persist a partial update and merge it into the current settings. */
  update: (patch: Partial<AppSettings>) => Promise<void>;
  /** Re-read settings from storage (e.g. after importing a backup). */
  reload: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState<unknown>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stored = await getSettings();
        if (!cancelled) {
          settingsRef.current = stored;
          setSettings(stored);
        }
      } catch (error) {
        console.error("Could not open browser storage:", error);
        if (!cancelled) setStorageError(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the document language in sync for accessibility and browser hints.
  useEffect(() => {
    document.documentElement.lang = settings.language;
  }, [settings.language]);

  // Apply primary color as CSS custom properties, with a text colour that
  // stays readable on it and a darker hover shade.
  useEffect(() => {
    const root = document.documentElement;
    const color = settings.primaryColor || DEFAULT_PRIMARY_COLOR;
    root.style.setProperty("--color-primary", color);
    root.style.setProperty("--color-ring", color);
    root.style.setProperty("--color-primary-foreground", readableOn(color));
    root.style.setProperty("--color-primary-hover", darken(color, 0.22));
  }, [settings.primaryColor]);

  const update = useCallback(async (patch: Partial<AppSettings>) => {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next); // optimistic update so the UI feels instant
    const saved = await saveSettings(next);
    // A newer update may have started while this one was saving (fast
    // typing); don't let the older result overwrite it.
    if (settingsRef.current === next) {
      settingsRef.current = saved;
      setSettings(saved);
    }
  }, []);

  const reload = useCallback(async () => {
    const stored = await getSettings();
    settingsRef.current = stored;
    setSettings(stored);
  }, []);

  const value = useMemo(
    () => ({ settings, loading, storageError, update, reload }),
    [settings, loading, storageError, update, reload],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}
