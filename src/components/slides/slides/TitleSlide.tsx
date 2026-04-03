import { Report } from "@/types";

interface TitleSlideProps {
  report: Report;
  compact?: boolean;
}

export default function TitleSlide({ report, compact: _compact = true }: TitleSlideProps) {
  return (
    <>
      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <h1 className="text-6xl mb-2.5">
          {report.quarter} {report.year}
        </h1>
        <h2 className="text-4xl text-base-content/60 font-normal mb-10">
          Cyber Security Board Report
        </h2>
        <p className="text-lg text-base-content/50">
          Prepared by: {report.createdBy}
        </p>
        <p className="text-base text-base-content/50 mt-1">
          {new Date(report.createdAt).toLocaleDateString()}
        </p>
      </div>
    </>
  );
}
