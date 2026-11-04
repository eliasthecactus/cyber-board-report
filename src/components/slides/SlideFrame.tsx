import { createContext, useContext, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { Report } from "@/types";
import { useSettings } from "@/lib/settings";
import { useT } from "@/lib/i18n";
import { capitals } from "@/lib/utils";
import { SLIDE_HEIGHT, SLIDE_WIDTH, useAccent, type Accent } from "./slideConstants";

export const SlidePageContext = createContext<{ page: number; total: number }>({
  page: 1,
  total: 1,
});

interface SlideFrameProps {
  report: Report;
  title?: string;
  icon?: LucideIcon;
  /** "compact" is the dense layout of the board brief, without an icon. */
  variant?: "default" | "title" | "compact";
  /** Compact only: small line above the title, e.g. who the brief is addressed to. */
  eyebrow?: string;
  /** Compact only: replaces the report title in the footer. */
  footerTitle?: string;
  /** Compact only: extra footer text, e.g. a classification. */
  footerNote?: string;
  children: ReactNode;
}

const rootStyle = {
  width: SLIDE_WIDTH,
  height: SLIDE_HEIGHT,
  fontFamily: "var(--font-display)",
} as const;

function Logo({ logo, compact = false }: { logo: string; compact?: boolean }) {
  if (!logo) {
    return null;
  }
  return (
    <img
      src={logo}
      alt=""
      className={`object-contain ${compact ? "max-h-[32px] max-w-[140px]" : "max-h-[44px] max-w-[180px]"}`}
      data-slide-image
    />
  );
}

function Footer({
  report,
  accent,
  title,
  note,
  compact = false,
}: {
  report: Report;
  accent: Accent;
  title?: string;
  note?: string;
  compact?: boolean;
}) {
  const t = useT();
  const { page, total } = useContext(SlidePageContext);
  return (
    <footer className={`flex items-center justify-between text-slate-400 ${compact ? "text-[11px]" : "pt-4 text-[13px]"}`}>
      <div className="flex items-center gap-3">
        <div className="h-[3px] w-8 rounded-full" style={{ backgroundColor: accent.fill, opacity: 0.4 }} />
        <span className="font-medium">
          {report.quarter} {report.year} &middot; {title?.trim() || report.title.trim() || t("report.defaultTitle")}
        </span>
        {note?.trim() && <span className="font-semibold tracking-wider">{capitals(note)}</span>}
      </div>
      <span className="tabular-nums font-medium">
        {page} / {total}
      </span>
    </footer>
  );
}

export function SlideFrame({
  report,
  title,
  icon: Icon,
  variant = "default",
  eyebrow,
  footerTitle,
  footerNote,
  children,
}: SlideFrameProps) {
  const { settings } = useSettings();
  const logo = settings.logo;
  const accent = useAccent();

  if (variant === "title") {
    return (
      <div
        style={rootStyle}
        className="relative flex flex-col bg-white px-[72px] py-[56px] text-slate-800"
      >
        <div className="flex items-start justify-between">
          <div className="h-[3px] w-16 rounded-full" style={{ backgroundColor: accent.fill }} />
          <Logo logo={logo} />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          {children}
        </div>
        <Footer report={report} accent={accent} />
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div style={rootStyle} className="relative flex flex-col bg-white px-[40px] py-[24px] text-slate-800">
        <header className="mb-3 flex h-[44px] shrink-0 items-center justify-between gap-6">
          <div className="min-w-0">
            {eyebrow?.trim() && (
              <p className="m-0 truncate text-[11px] font-semibold tracking-wider" style={{ color: accent.text }}>
                {capitals(eyebrow)}
              </p>
            )}
            <h2 className="m-0 truncate text-[23px] font-bold leading-tight text-slate-900">{title}</h2>
          </div>
          <Logo logo={logo} compact />
        </header>
        <div className="min-h-0 flex-1">{children}</div>
        <div className="mt-2.5 shrink-0">
          <Footer report={report} accent={accent} title={footerTitle} note={footerNote} compact />
        </div>
      </div>
    );
  }

  return (
    <div
      style={rootStyle}
      className="relative flex flex-col bg-white px-[72px] py-[48px] text-slate-800"
    >
      <header className="flex items-center justify-between gap-6 mb-5">
        <div className="flex items-center gap-3">
          {Icon && (
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${accent.fill}12`, color: accent.text }}
            >
              <Icon size={20} />
            </span>
          )}
          <h2 className="m-0 text-[30px] font-bold leading-tight text-slate-900">{title}</h2>
        </div>
        <Logo logo={logo} />
      </header>

      <div className="h-px w-full bg-slate-100" />

      <div className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>

      <div className="mt-5">
        <Footer report={report} accent={accent} />
      </div>
    </div>
  );
}
