import type { Report } from "@/types";
import { formatDate, useLanguage, useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { useAccent } from "../slideConstants";

interface TitleSlideProps {
  report: Report;
}

export default function TitleSlide({ report }: TitleSlideProps) {
  const t = useT();
  const lang = useLanguage();
  const accent = useAccent();
  const title = report.title.trim() || t("report.defaultTitle");
  const presenter = report.presenter.trim() || report.createdBy;
  const participants = report.participants.map((p) => p.trim()).filter(Boolean);

  return (
    <SlideFrame report={report} variant="title">
      <p
        className="mb-4 text-[16px] font-semibold uppercase tracking-[0.3em]"
        style={{ color: accent.text }}
      >
        {title}
      </p>
      <h1 className="m-0 text-[108px] font-extrabold leading-none text-slate-900">
        {report.quarter} <span className="font-light text-slate-400">{report.year}</span>
      </h1>
      <div className="mt-2 h-[3px] w-20 rounded-full mx-auto" style={{ backgroundColor: accent.fill }} />
      <div className="mt-10 flex flex-col items-center gap-1 text-slate-500">
        <p className="m-0 text-[18px]">{t("slide.title.preparedBy", { name: presenter })}</p>
        <p className="m-0 text-[15px] text-slate-400">{formatDate(report.createdAt, lang)}</p>
      </div>
      {participants.length > 0 && (
        <div className="mt-8 flex max-w-[760px] flex-col items-center gap-2">
          <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            {t("slide.title.involved")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {participants.map((person, idx) => (
              <span
                key={idx}
                className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-[14px] text-slate-600"
              >
                {person}
              </span>
            ))}
          </div>
        </div>
      )}
    </SlideFrame>
  );
}
