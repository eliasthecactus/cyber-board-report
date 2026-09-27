/** Colour helpers for the user-chosen brand colour. Inputs are "#rrggbb". */

function channels(hex: string): [number, number, number] {
  const value = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#000000";
  return [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16)) as [number, number, number];
}

function toHex(rgb: number[]): string {
  return `#${rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;
}

/** WCAG relative luminance. */
export function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colours (1–21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Mix a colour towards black by `amount` (0–1). */
export function darken(hex: string, amount: number): string {
  return toHex(channels(hex).map((v) => v * (1 - amount)));
}

/** White or near-black, whichever reads better on `background`. */
export function readableOn(background: string): string {
  return contrastRatio(background, "#ffffff") >= contrastRatio(background, "#0f172a") ? "#ffffff" : "#0f172a";
}

/**
 * Darken `hex` until it reaches `min` contrast against white, so a light
 * brand colour can still be used for text and thin lines on slides.
 */
export function ensureContrastOnWhite(hex: string, min = 4.5): string {
  let color = hex;
  for (let step = 0; step < 20 && contrastRatio(color, "#ffffff") < min; step += 1) {
    color = darken(color, 0.1);
  }
  return color;
}
