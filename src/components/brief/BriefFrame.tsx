import { useContext, type ReactNode } from "react";
import { Lock } from "lucide-react";
import type { Report } from "@/types";
import { withAlpha } from "@/lib/color";
import { useSettings } from "@/lib/settings";
import { capitals } from "@/lib/utils";
import { SlidePageContext } from "@/components/slides/SlideFrame";
import { SLIDE_HEIGHT, SLIDE_WIDTH } from "@/components/slides/slideConstants";
import { themeVars, useBriefTheme } from "./theme";

interface BriefFrameProps {
  report: Report;
  title: string;
  /** Who the brief is addressed to, shown above the title. */
  eyebrow: string;
  footerTitle: string;
  /** A classification or similar. */
  footerNote: string;
  children: ReactNode;
}

/** Not `truncate`: the image export mismeasures spaced text and would cut it off with an ellipsis. */
const oneLine = "overflow-hidden whitespace-nowrap";

/** The period and the logo sit side by side, so they share one shape. */
const headerChip = "flex h-[34px] items-center rounded-[10px] border border-brief-line px-3";

/** The page around a brief slide: title, period, logo, classification and page position. */
export function BriefFrame({ report, title, eyebrow, footerTitle, footerNote, children }: BriefFrameProps) {
  const theme = useBriefTheme();
  const { settings } = useSettings();
  const { page, total } = useContext(SlidePageContext);

  return (
    <div
      className="relative flex flex-col overflow-hidden px-8 pb-3.5 pt-5 text-brief-body"
      style={{
        ...themeVars(theme),
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        fontFamily: '"Geist", var(--font-display)',
        backgroundColor: theme.page,
        backgroundImage: `radial-gradient(760px 420px at 88% -12%, ${withAlpha(theme.accent, theme.glow)}, ${withAlpha(theme.accent, 0)})`,
      }}
    >
      <header className="mb-3 flex h-[52px] shrink-0 items-center justify-between gap-6">
        <div className="min-w-0">
          {eyebrow.trim() && (
            <p className={`m-0 text-[10.5px] font-semibold tracking-[0.1em] text-brief-accent ${oneLine}`}>
              {capitals(eyebrow)}
            </p>
          )}
          <h2 className={`m-0 text-[27px] font-semibold leading-[1.2] tracking-[-0.02em] text-brief-ink ${oneLine}`}>
            {title}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className={`${headerChip} bg-brief-tile text-[13px] font-semibold tabular-nums text-brief-ink`}>
            {report.quarter} {report.year}
          </span>
          {settings.logo && (
            // A white plate, because a logo may be dark or light and has to work on both themes.
            <span className={`${headerChip} bg-white`}>
              <img src={settings.logo} alt="" className="max-h-[22px] max-w-[120px] object-contain" data-slide-image />
            </span>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1">{children}</div>

      <footer className="mt-2.5 flex h-[18px] shrink-0 items-center justify-between text-[11px] text-brief-muted">
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate font-medium">{footerTitle}</span>
          {footerNote.trim() && (
            <span className="flex items-center gap-1 font-semibold tracking-[0.1em]">
              <Lock size={10} aria-hidden />
              {capitals(footerNote)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="flex items-center gap-1">
            {Array.from({ length: total }, (_, index) => (
              <span
                key={index}
                className="h-[3px] rounded-full"
                style={{
                  width: index + 1 === page ? 18 : 8,
                  backgroundColor: index + 1 === page ? theme.accent : theme.line,
                }}
              />
            ))}
          </span>
          <span className="font-medium tabular-nums">
            {page} / {total}
          </span>
        </div>
      </footer>
    </div>
  );
}
