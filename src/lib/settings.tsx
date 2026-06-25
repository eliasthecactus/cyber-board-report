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
import { defaultSettings } from "@/lib/settingsDefaults";
import { getSettings, saveSettings } from "@/lib/storage";

interface SettingsContextValue {
  settings: AppSettings;
  loading: boolean;
  /** Persist a partial update and merge it into the current settings. */
  update: (patch: Partial<AppSettings>) => Promise<void>;
  /** Re-read settings from storage (e.g. after importing a backup). */
  reload: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = await getSettings();
      if (!cancelled) {
        setSettings(stored);
        setLoading(false);
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

  // Apply primary color as CSS custom properties.
  useEffect(() => {
    const root = document.documentElement;
    const color = settings.primaryColor || "#1e3a5f";
    root.style.setProperty("--color-primary", color);
    root.style.setProperty("--color-ring", color);
    // Derive a darker hover shade by mixing with black.
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const darken = (v: number) => Math.round(v * 0.78).toString(16).padStart(2, "0");
    root.style.setProperty("--color-primary-hover", `#${darken(r)}${darken(g)}${darken(b)}`);
  }, [settings.primaryColor]);

  const update = useCallback(async (patch: Partial<AppSettings>) => {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next); // optimistic update so the UI feels instant
    const saved = await saveSettings(next);
    settingsRef.current = saved;
    setSettings(saved);
  }, []);

  const reload = useCallback(async () => {
    const stored = await getSettings();
    settingsRef.current = stored;
    setSettings(stored);
  }, []);

  const value = useMemo(
    () => ({ settings, loading, update, reload }),
    [settings, loading, update, reload],
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
