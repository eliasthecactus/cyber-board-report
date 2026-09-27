import { useCallback } from "react";
import type { AppLanguage } from "@/types";
import { useSettings } from "@/lib/settings";
import { de } from "./de";
import { en, type TranslationKey } from "./en";

export type { TranslationKey };

type Vars = Record<string, string | number>;

/**
 * Keys that exist only as plural variants ("x.one", "x.other"). Pass the base
 * key plus a numeric `count` var and the right variant is chosen with
 * Intl.PluralRules.
 */
type PluralBase = TranslationKey extends infer K
  ? K extends `${infer Base}.other`
    ? Base
    : never
  : never;

export type MessageKey = TranslationKey | PluralBase;

const dictionaries: Record<AppLanguage, Record<TranslationKey, string>> = { en, de };

const pluralRules: Record<AppLanguage, Intl.PluralRules> = {
  en: new Intl.PluralRules("en"),
  de: new Intl.PluralRules("de"),
};

function lookup(lang: AppLanguage, key: string): string | undefined {
  const dict = dictionaries[lang] as Record<string, string>;
  return dict[key] ?? (en as Record<string, string>)[key];
}

export function translate(lang: AppLanguage, key: MessageKey, vars?: Vars): string {
  let value: string | undefined;
  if (typeof vars?.count === "number") {
    const rule = pluralRules[lang].select(vars.count);
    value = lookup(lang, `${key}.${rule}`) ?? lookup(lang, `${key}.other`);
  }
  value ??= lookup(lang, key) ?? key;
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.split(`{${name}}`).join(String(replacement));
    }
  }
  return value;
}

export type TFunction = (key: MessageKey, vars?: Vars) => string;

export function useT(): TFunction {
  const lang = useSettings().settings.language;
  return useCallback((key: MessageKey, vars?: Vars) => translate(lang, key, vars), [lang]);
}

export function useLanguage(): AppLanguage {
  return useSettings().settings.language;
}

/** Locale-aware date/time formatting that follows the app language, not the browser. */
export function formatDateTime(value: string | Date, lang: AppLanguage): string {
  return new Date(value).toLocaleString(lang, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDate(value: string | Date, lang: AppLanguage): string {
  return new Date(value).toLocaleDateString(lang, {
    dateStyle: "long",
  });
}
