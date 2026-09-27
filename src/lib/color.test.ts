import { describe, expect, it } from "vitest";
import { contrastRatio, ensureContrastOnWhite, readableOn } from "./color";

describe("color helpers", () => {
  it("computes WCAG contrast", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });

  it("picks readable text colours", () => {
    expect(readableOn("#1e3a5f")).toBe("#ffffff");
    expect(readableOn("#facc15")).toBe("#0f172a");
  });

  it("darkens light colours until they are readable on white", () => {
    const adjusted = ensureContrastOnWhite("#facc15");
    expect(contrastRatio(adjusted, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(ensureContrastOnWhite("#1e3a5f")).toBe("#1e3a5f");
  });
});
