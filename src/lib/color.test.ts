import { describe, expect, it } from "vitest";
import { contrastRatio, ensureContrastOnDark, ensureContrastOnWhite, readableOn, withAlpha } from "./color";

describe("color helpers", () => {
  it("computes WCAG contrast", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });

  it("picks readable text colours", () => {
    expect(readableOn("#1e3a5f")).toBe("#ffffff");
    expect(readableOn("#facc15")).toBe("#0f172a");
  });

  it("lightens dark colours until they are readable on a dark background", () => {
    const adjusted = ensureContrastOnDark("#1e3a5f", "#121924");
    expect(contrastRatio(adjusted, "#121924")).toBeGreaterThanOrEqual(4.5);
    expect(ensureContrastOnDark("#facc15", "#121924")).toBe("#facc15");
  });

  it("writes tints as rgba", () => {
    expect(withAlpha("#ff0080", 0.5)).toBe("rgba(255, 0, 128, 0.5)");
  });

  it("darkens light colours until they are readable on white", () => {
    const adjusted = ensureContrastOnWhite("#facc15");
    expect(contrastRatio(adjusted, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(ensureContrastOnWhite("#1e3a5f")).toBe("#1e3a5f");
  });
});
