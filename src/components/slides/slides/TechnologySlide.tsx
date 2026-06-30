import { Report } from "@/types";
import { Cpu } from "lucide-react";
import { useT } from "@/lib/i18n";
import DomainSlide from "./DomainSlide";

export default function TechnologySlide({ report }: { report: Report }) {
  const t = useT();
  return (
    <DomainSlide
      report={report}
      items={report.technologyItems}
      title={t("slide.technology.title")}
      icon={Cpu}
    />
  );
}
