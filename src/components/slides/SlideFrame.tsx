import { createContext, useContext, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { Report } from "@/types";
import { useSettings } from "@/lib/settings";
import { useT } from "@/lib/i18n";
import { SLIDE_HEIGHT, SLIDE_WIDTH, TOTAL_SLIDES, usePrimaryColor } from "./slideConstants";

export const SlidePageContext = createContext<{ page: number; total: number }>({
  page: 1,
  total: TOTAL_SLIDES,
});

interface SlideFrameProps {
  report: Report;
  accent?: string;
  title?: string;
  icon?: LucideIcon;
  variant?: "default" | "title";
  children: ReactNode;
}

const rootStyle = {
  width: SLIDE_WIDTH,
  height: SLIDE_HEIGHT,
  fontFamily: "var(--font-display)",
} as const;

function Logo({ logo }: { logo: string }) {
  if (!logo) {
    return null;
  }
  return <img src={logo} alt="" className="max-h-[44px] max-w-[180px] object-contain" />;
}

function Footer({ report, accent }: { report: Report; accent: string }) {
  const t = useT();
  const { page, total } = useContext(SlidePageContext);
  return (
    <footer className="flex items-center justify-between pt-4 text-[13px] text-slate-400">
      <div className="flex items-center gap-3">
        <div className="h-[3px] w-8 rounded-full" style={{ backgroundColor: accent, opacity: 0.4 }} />
        <span className="font-medium">
          {report.quarter} {report.year} &middot; {t("slide.title.subtitle")}
        </span>
      </div>
      <span className="tabular-nums font-medium">
        {page} / {total}
      </span>
    </footer>
  );
}

export function SlideFrame({
  report,
  accent: accentProp,
  title,
  icon: Icon,
  variant = "default",
  children,
}: SlideFrameProps) {
  const { settings } = useSettings();
  const logo = settings.logo;
  const primary = usePrimaryColor();
  const accent = accentProp || primary;

  if (variant === "title") {
    return (
      <div
        style={rootStyle}
        className="relative flex flex-col bg-white px-[72px] py-[56px] text-slate-800"
      >
        <div className="flex items-start justify-between">
          <div className="h-[3px] w-16 rounded-full" style={{ backgroundColor: accent }} />
          <Logo logo={logo} />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          {children}
        </div>
        <Footer report={report} accent={accent} />
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
              style={{ backgroundColor: `${accent}12`, color: accent }}
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
