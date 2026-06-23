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

  const update = useCallback(async (patch: Partial<AppSettings>) => {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next); // optimistic update so the UI feels instant
    const saved = await saveSettings(next);
    settingsRef.current = saved;
    setSettings(saved);
  }, []);

  const value = useMemo(
    () => ({ settings, loading, update }),
    [settings, loading, update],
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
