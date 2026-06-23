import { Report } from "@/types";
import { useT } from "@/lib/i18n";
import { SlideFrame } from "../SlideFrame";
import { ACCENTS } from "../slideConstants";

interface TitleSlideProps {
  report: Report;
}

export default function TitleSlide({ report }: TitleSlideProps) {
  const t = useT();
  return (
    <SlideFrame report={report} accent={ACCENTS.title} variant="title">
      <p
        className="mb-5 text-[22px] font-semibold uppercase tracking-[0.35em]"
        style={{ color: ACCENTS.title }}
      >
        {t("slide.title.subtitle")}
      </p>
      <h1 className="m-0 text-[128px] font-extrabold leading-none text-slate-900">
        {report.quarter} {report.year}
      </h1>
      <div className="mt-12 flex flex-col items-center gap-1 text-slate-500">
        <p className="m-0 text-[22px]">{t("slide.title.preparedBy", { name: report.createdBy })}</p>
        <p className="m-0 text-[18px] text-slate-400">
          {new Date(report.createdAt).toLocaleDateString()}
        </p>
      </div>
    </SlideFrame>
  );
}
