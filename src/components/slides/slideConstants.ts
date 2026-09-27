import { useSettings } from "@/lib/settings";
import { DEFAULT_PRIMARY_COLOR } from "@/lib/settingsDefaults";
import { ensureContrastOnWhite, readableOn } from "@/lib/color";

// PowerPoint 16:9 widescreen canvas. Every slide is authored at this exact
// pixel size, then scaled to fit the preview / fullscreen / PDF export.
// 1280 px at 96 dpi is exactly the 13.333 in width of a widescreen PPTX.
export const SLIDE_WIDTH = 1280;
export const SLIDE_HEIGHT = 720;

/** How many items of a section fit on its slide. */
export const SLIDE_LIMITS = {
  risksWithMatrix: 4,
  risksWithoutMatrix: 6,
  threats: 6,
  kpis: 6,
  incidents: 3,
  domainItems: 6,
  initiatives: 6,
  emergingRisks: 4,
  decisions: 4,
} as const;

export interface Accent {
  /** The brand colour as chosen, for fills and decoration. */
  fill: string;
  /** Text colour to use on top of `fill`. */
  onFill: string;
  /** The brand colour darkened if needed so it is readable as text on white. */
  text: string;
}

export function accentFor(color: string): Accent {
  const fill = color || DEFAULT_PRIMARY_COLOR;
  return { fill, onFill: readableOn(fill), text: ensureContrastOnWhite(fill) };
}

/** The user-chosen primary colour from settings, with readable variants. */
export function useAccent(): Accent {
  const { settings } = useSettings();
  return accentFor(settings.primaryColor);
}
