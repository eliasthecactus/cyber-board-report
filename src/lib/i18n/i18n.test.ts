import { describe, expect, it } from "vitest";
import { translate } from "./index";
import { en } from "./en";
import { de } from "./de";

describe("translate", () => {
  it("substitutes variables", () => {
    expect(translate("en", "dashboard.quarterExists", { quarter: "Q1", year: 2026 })).toBe(
      "A report for Q1 2026 already exists.",
    );
  });

  it("picks plural forms", () => {
    expect(translate("en", "dashboard.imported", { count: 1 })).toBe("Imported 1 report.");
    expect(translate("en", "dashboard.imported", { count: 3 })).toBe("Imported 3 reports.");
    expect(translate("de", "backup.reportsCount", { count: 1 })).toBe("1 Bericht");
    expect(translate("de", "backup.reportsCount", { count: 0 })).toBe("0 Berichte");
  });

  it("has a German translation for every English key", () => {
    expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort());
    const untranslated = Object.keys(en).filter((key) => !de[key as keyof typeof de]?.trim());
    expect(untranslated).toEqual([]);
  });

  it("keeps the same placeholders in both languages", () => {
    const vars = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
    const mismatched = Object.keys(en).filter(
      (key) => vars(en[key as keyof typeof en]).join() !== vars(de[key as keyof typeof de]).join(),
    );
    expect(mismatched).toEqual([]);
  });
});
