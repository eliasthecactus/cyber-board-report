import { describe, expect, it } from "vitest";
import type { RedactionRule } from "@/types";
import { defaultSettings } from "./settingsDefaults";
import { activeRules, applyRedaction, buildAssistMessages, duplicatePlaceholders, restoreRedaction } from "./openrouter";

const rule = (keyword: string, placeholder = "", id = keyword): RedactionRule => ({ id, keyword, placeholder });

describe("redaction", () => {
  it("replaces keywords case-insensitively and restores them", () => {
    const rules = [rule("Acme Corp", "[COMPANY]")];
    const redacted = applyRedaction("acme corp and ACME CORP", rules);
    expect(redacted).toBe("[COMPANY] and [COMPANY]");
    expect(restoreRedaction(redacted, rules)).toBe("Acme Corp and Acme Corp");
  });

  it("only matches whole words", () => {
    const rules = [rule("Acme", "[C]")];
    expect(applyRedaction("Acmetrics bought Acme.", rules)).toBe("Acmetrics bought [C].");
    expect(applyRedaction("Zürich-Acme", rules)).toBe("Zürich-[C]");
  });

  it("applies longer keywords first", () => {
    const rules = [rule("Acme", "[A]"), rule("Acme Bank", "[BANK]")];
    expect(applyRedaction("Acme Bank and Acme", rules)).toBe("[BANK] and [A]");
  });

  it("never derives the generated token from the keyword", () => {
    const rules = [rule("Project Falcon")];
    const redacted = applyRedaction("Status of Project Falcon", rules);
    expect(redacted).toBe("Status of [ENTITY_1]");
    expect(redacted.toLowerCase()).not.toContain("falcon");
    expect(restoreRedaction(redacted, rules)).toBe("Status of Project Falcon");
  });

  it("ignores blank keywords", () => {
    expect(activeRules([rule("  ")])).toEqual([]);
  });

  it("escapes regex characters in keywords", () => {
    expect(applyRedaction("C++ (legacy) app", [rule("C++ (legacy)", "[APP]")])).toBe("[APP] app");
  });

  it("reports placeholders shared by several rules", () => {
    expect(duplicatePlaceholders([rule("A", "[X]"), rule("B", "[x]"), rule("C", "[Y]")])).toEqual(["[x]"]);
  });

  it("redacts everything that is sent, including the report context", () => {
    const settings = { ...defaultSettings(), redactionRules: [rule("Acme", "[CO]")] };
    const messages = buildAssistMessages({
      action: "fill",
      fieldLabel: "Summary",
      fieldText: "Acme notes",
      context: "Acme had an incident",
      itemContext: "Acme risk",
      settings,
    });
    const sent = messages.map((m) => m.content).join("\n");
    expect(sent).not.toMatch(/acme/i);
    expect(sent).toContain("[CO] had an incident");
  });
});
