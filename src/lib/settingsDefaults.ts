import type { AppSettings, RedactionRule } from "@/types";

// A widely-available, low-cost default. Users can change it in Settings.
export const DEFAULT_OPENROUTER_MODEL = "openai/gpt-4o-mini";
export const DEFAULT_PRIMARY_COLOR = "#1e3a5f";

export function defaultSettings(): AppSettings {
  return {
    language: "en",
    openRouterApiKey: "",
    openRouterModel: DEFAULT_OPENROUTER_MODEL,
    redactionRules: [],
    logo: "",
    primaryColor: DEFAULT_PRIMARY_COLOR,
    lastBackupAt: "",
    updatedAt: new Date().toISOString(),
  };
}

function normalizeRule(rule: unknown, index: number): RedactionRule | null {
  if (!rule || typeof rule !== "object") {
    return null;
  }
  const record = rule as Partial<RedactionRule>;
  if (typeof record.keyword !== "string") {
    return null;
  }
  return {
    id: typeof record.id === "string" && record.id ? record.id : `redact_${index}`,
    keyword: record.keyword,
    placeholder: typeof record.placeholder === "string" ? record.placeholder : "",
  };
}

/** Merge stored (possibly partial) settings onto fresh defaults. */
export function normalizeSettings(input: Partial<AppSettings> | null | undefined): AppSettings {
  const base = defaultSettings();
  if (!input) {
    return base;
  }
  return {
    language: input.language === "de" ? "de" : "en",
    openRouterApiKey:
      typeof input.openRouterApiKey === "string" ? input.openRouterApiKey : base.openRouterApiKey,
    openRouterModel:
      typeof input.openRouterModel === "string" && input.openRouterModel.trim()
        ? input.openRouterModel
        : base.openRouterModel,
    redactionRules: Array.isArray(input.redactionRules)
      ? input.redactionRules
          .map(normalizeRule)
          .filter((rule): rule is RedactionRule => rule !== null)
      : [],
    // Only image data URLs: anything else could point the <img> at a remote URL.
    logo: typeof input.logo === "string" && input.logo.startsWith("data:image/") ? input.logo : "",
    primaryColor:
      typeof input.primaryColor === "string" && /^#[0-9a-fA-F]{6}$/.test(input.primaryColor)
        ? input.primaryColor
        : base.primaryColor,
    lastBackupAt: typeof input.lastBackupAt === "string" ? input.lastBackupAt : "",
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : base.updatedAt,
  };
}
