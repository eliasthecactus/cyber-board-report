import { Report } from "@/types";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { usePrimaryColor } from "../slideConstants";

interface TitleSlideProps {
  report: Report;
}

export default function TitleSlide({ report }: TitleSlideProps) {
  const t = useT();
  const accent = usePrimaryColor();
  const title = report.title.trim() || t("report.defaultTitle");
  const presenter = report.presenter.trim() || report.createdBy;
  const participants = report.participants.map((p) => p.trim()).filter(Boolean);

  return (
    <SlideFrame report={report} accent={accent} variant="title">
      <p
        className="mb-4 text-[16px] font-semibold uppercase tracking-[0.3em]"
        style={{ color: accent }}
      >
        {title}
      </p>
      <h1 className="m-0 text-[108px] font-extrabold leading-none text-slate-900">
        {report.quarter} <span className="font-light text-slate-400">{report.year}</span>
      </h1>
      <div className="mt-2 h-[3px] w-20 rounded-full mx-auto" style={{ backgroundColor: accent }} />
      <div className="mt-10 flex flex-col items-center gap-1 text-slate-500">
        <p className="m-0 text-[18px]">{t("slide.title.preparedBy", { name: presenter })}</p>
        <p className="m-0 text-[15px] text-slate-400">
          {new Date(report.createdAt).toLocaleDateString()}
        </p>
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
