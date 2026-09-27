import type { Report } from "@/types";
import { Globe } from "lucide-react";
import { useT } from "@/lib/i18n";
import DomainSlide from "./DomainSlide";
import { SLIDE_LIMITS } from "../slideConstants";

export default function ThreatLandscapeSlide({ report }: { report: Report }) {
  const t = useT();
  return (
    <DomainSlide
      report={report}
      items={report.threatLandscape}
      title={t("slide.threat.title")}
      icon={Globe}
      max={SLIDE_LIMITS.threats}
      emptyKey="slide.threat.none"
      showTrendLabel
    />
  );
}
