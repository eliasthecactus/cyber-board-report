import { createContext, useContext, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { Report } from "@/types";
import { useSettings } from "@/lib/settings";
import { useT } from "@/lib/i18n";
import { SLIDE_HEIGHT, SLIDE_WIDTH, TOTAL_SLIDES } from "./slideConstants";

export const SlidePageContext = createContext<{ page: number; total: number }>({
  page: 1,
  total: TOTAL_SLIDES,
});

interface SlideFrameProps {
  report: Report;
  accent: string;
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
  return <img src={logo} alt="" className="max-h-[52px] max-w-[200px] object-contain" />;
}

function Footer({ report }: { report: Report }) {
  const t = useT();
  const { page, total } = useContext(SlidePageContext);
  return (
    <footer className="flex items-center justify-between border-t border-slate-200 pt-4 text-[15px] text-slate-400">
      <span className="font-medium">
        {report.quarter} {report.year} · {t("slide.title.subtitle")}
      </span>
      <span className="tabular-nums">
        {page} / {total}
      </span>
    </footer>
  );
}

export function SlideFrame({
  report,
  accent,
  title,
  icon: Icon,
  variant = "default",
  children,
}: SlideFrameProps) {
  const { settings } = useSettings();
  const logo = settings.logo;

  if (variant === "title") {
    return (
      <div
        style={rootStyle}
        className="relative flex flex-col bg-white px-[72px] py-[64px] text-slate-800"
      >
        <div className="flex items-start justify-between">
          <div className="h-2 w-24 rounded-full" style={{ backgroundColor: accent }} />
          <Logo logo={logo} />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          {children}
        </div>
        <Footer report={report} />
      </div>
    );
  }

  return (
    <div
      style={rootStyle}
      className="relative flex flex-col bg-white px-[72px] py-[56px] text-slate-800"
    >
      <header className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <span className="h-12 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
          {Icon && (
            <span
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${accent}1A`, color: accent }}
            >
              <Icon size={26} />
            </span>
          )}
          <h2 className="m-0 text-[36px] font-bold leading-tight text-slate-900">{title}</h2>
        </div>
        <Logo logo={logo} />
      </header>

      <div className="my-6 h-px w-full bg-slate-100" />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>

      <div className="mt-6">
        <Footer report={report} />
      </div>
    </div>
  );
}
