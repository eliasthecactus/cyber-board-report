import { createContext, useContext, type CSSProperties } from "react";
import type { BriefTheme, InitiativeStatus, Level } from "@/types";
import { ensureContrastOnDark, ensureContrastOnWhite, readableOn, withAlpha } from "@/lib/color";

/*
 * The board brief has its own look, separate from the deck's palette. Colours
 * are plain values rather than CSS variables wherever they end up in an SVG:
 * the image export renders SVGs on their own, outside the page's cascade.
 */

interface ThemeColors {
  page: string;
  tile: string;
  raised: string;
  line: string;
  ink: string;
  body: string;
  muted: string;
  faint: string;
  level: Record<Level, string>;
  good: string;
  bad: string;
  neutral: string;
  glow: number;
}

const COLORS: Record<BriefTheme, ThemeColors> = {
  midnight: {
    page: "#0a0e15",
    tile: "#121924",
    raised: "#1a2330",
    line: "#242f3e",
    ink: "#f4f6f9",
    body: "#bcc6d3",
    muted: "#8c9aad",
    faint: "#5a687c",
    level: { critical: "#ff5c6c", high: "#ff9a3d", medium: "#f2c94c", low: "#3dd68c" },
    good: "#3dd68c",
    bad: "#ff5c6c",
    neutral: "#8c9aad",
    glow: 0.3,
  },
  daylight: {
    page: "#eef1f5",
    tile: "#ffffff",
    raised: "#f4f6f9",
    line: "#e1e6ec",
    ink: "#0e1420",
    body: "#3d4a5c",
    muted: "#5f6e82",
    faint: "#a4afbe",
    level: { critical: "#d92d3f", high: "#d9650b", medium: "#b88a00", low: "#0b8a5f" },
    good: "#0b8a5f",
    bad: "#d92d3f",
    neutral: "#5f6e82",
    glow: 0.1,
  },
};

export interface ResolvedTheme extends ThemeColors {
  /** The brand colour, adjusted to stay readable on this theme's tiles. */
  accent: string;
  /** Solid brand colour for the hero tiles, and the text colour on it. */
  heroFill: string;
  heroInk: string;
}

export function resolveTheme(name: BriefTheme, brandColor: string): ResolvedTheme {
  const colors = COLORS[name];
  return {
    ...colors,
    accent: name === "midnight" ? ensureContrastOnDark(brandColor, colors.tile) : ensureContrastOnWhite(brandColor),
    heroFill: brandColor,
    heroInk: readableOn(brandColor),
  };
}

/** The CSS variables behind the `brief-*` Tailwind colours. */
export function themeVars(theme: ResolvedTheme): CSSProperties {
  return {
    "--brief-ink": theme.ink,
    "--brief-body": theme.body,
    "--brief-muted": theme.muted,
    "--brief-faint": theme.faint,
    "--brief-tile": theme.tile,
    "--brief-raised": theme.raised,
    "--brief-line": theme.line,
    "--brief-accent": theme.accent,
  } as CSSProperties;
}

/** The same variables for content on a hero tile, whose colours follow the brand colour. */
export function heroVars(theme: ResolvedTheme): CSSProperties {
  const ink = theme.heroInk;
  return {
    "--brief-ink": ink,
    "--brief-body": withAlpha(ink, 0.86),
    "--brief-muted": withAlpha(ink, 0.72),
    "--brief-faint": withAlpha(ink, 0.45),
    "--brief-raised": withAlpha(ink, 0.1),
    "--brief-line": withAlpha(ink, 0.18),
    "--brief-accent": ink,
  } as CSSProperties;
}

export const statusTone = (theme: ResolvedTheme, status: InitiativeStatus): string =>
  ({
    "on-track": theme.good,
    "at-risk": theme.level.high,
    delayed: theme.bad,
    "not-started": theme.neutral,
  })[status];

export const BriefThemeContext = createContext<ResolvedTheme>(resolveTheme("midnight", "#1e3a5f"));

export const useBriefTheme = () => useContext(BriefThemeContext);
