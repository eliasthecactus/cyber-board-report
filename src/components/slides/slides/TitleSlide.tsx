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
  return (
    <SlideFrame report={report} accent={accent} variant="title">
      <p
        className="mb-4 text-[16px] font-semibold uppercase tracking-[0.3em]"
        style={{ color: accent }}
      >
        {t("slide.title.subtitle")}
      </p>
      <h1 className="m-0 text-[108px] font-extrabold leading-none text-slate-900">
        {report.quarter} <span className="font-light text-slate-400">{report.year}</span>
      </h1>
      <div className="mt-2 h-[3px] w-20 rounded-full mx-auto" style={{ backgroundColor: accent }} />
      <div className="mt-10 flex flex-col items-center gap-1 text-slate-500">
        <p className="m-0 text-[18px]">{t("slide.title.preparedBy", { name: report.createdBy })}</p>
        <p className="m-0 text-[15px] text-slate-400">
          {new Date(report.createdAt).toLocaleDateString()}
        </p>
      </div>
    </SlideFrame>
  );
}
