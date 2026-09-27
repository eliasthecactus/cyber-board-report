import type { Report } from "@/types";
import { Workflow } from "lucide-react";
import { useT } from "@/lib/i18n";
import DomainSlide from "./DomainSlide";
import { SLIDE_LIMITS } from "../slideConstants";

export default function ProcessSlide({ report }: { report: Report }) {
  const t = useT();
  return (
    <DomainSlide
      report={report}
      items={report.processItems}
      title={t("slide.process.title")}
      icon={Workflow}
      max={SLIDE_LIMITS.domainItems}
      emptyKey="slide.domain.none"
    />
  );
}
