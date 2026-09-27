import type { Report } from "@/types";
import { Users } from "lucide-react";
import { useT } from "@/lib/i18n";
import DomainSlide from "./DomainSlide";
import { SLIDE_LIMITS } from "../slideConstants";

export default function HumanSlide({ report }: { report: Report }) {
  const t = useT();
  return (
    <DomainSlide
      report={report}
      items={report.humanItems}
      title={t("slide.human.title")}
      icon={Users}
      max={SLIDE_LIMITS.domainItems}
      emptyKey="slide.domain.none"
    />
  );
}
