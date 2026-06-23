import type { AppSettings } from "@/types";

// A widely-available, low-cost default. Users can change it in Settings.
export const DEFAULT_OPENROUTER_MODEL = "openai/gpt-4o-mini";

export function defaultSettings(): AppSettings {
  return {
    language: "en",
    openRouterApiKey: "",
    openRouterModel: DEFAULT_OPENROUTER_MODEL,
    redactionRules: [],
    logo: "",
    updatedAt: new Date().toISOString(),
  };
}

/** Merge stored (possibly partial) settings onto fresh defaults. */
export function normalizeSettings(input: Partial<AppSettings> | null | undefined): AppSettings {
  const base = defaultSettings();
  if (!input) {
    return base;
  }
  return {
    ...base,
    ...input,
    language: input.language === "de" ? "de" : "en",
    openRouterApiKey:
      typeof input.openRouterApiKey === "string" ? input.openRouterApiKey : base.openRouterApiKey,
    openRouterModel:
      typeof input.openRouterModel === "string" && input.openRouterModel.trim()
        ? input.openRouterModel
        : base.openRouterModel,
    redactionRules: Array.isArray(input.redactionRules)
      ? input.redactionRules.filter(
          (rule): rule is AppSettings["redactionRules"][number] =>
            Boolean(rule) && typeof rule.keyword === "string",
        )
      : [],
    logo: typeof input.logo === "string" ? input.logo : "",
  };
}
