import { useSettings } from "@/lib/settings";
import { DEFAULT_PRIMARY_COLOR } from "@/lib/settingsDefaults";

// PowerPoint 16:9 widescreen canvas. Every slide is authored at this exact
// pixel size, then scaled to fit the preview / fullscreen / PDF export.
export const SLIDE_WIDTH = 1280;
export const SLIDE_HEIGHT = 720;

export const TOTAL_SLIDES = 12;

/** Returns the user-chosen primary color from settings. */
export function usePrimaryColor(): string {
  const { settings } = useSettings();
  return settings.primaryColor || DEFAULT_PRIMARY_COLOR;
}
