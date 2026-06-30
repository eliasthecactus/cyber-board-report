import { Report } from "@/types";
import { Workflow } from "lucide-react";
import { useT } from "@/lib/i18n";
import DomainSlide from "./DomainSlide";

export default function ProcessSlide({ report }: { report: Report }) {
  const t = useT();
  return (
    <DomainSlide
      report={report}
      items={report.processItems}
      title={t("slide.process.title")}
      icon={Workflow}
    />
  );
}
