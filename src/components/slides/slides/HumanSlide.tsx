import { Report } from "@/types";
import { Users } from "lucide-react";
import { useT } from "@/lib/i18n";
import DomainSlide from "./DomainSlide";

export default function HumanSlide({ report }: { report: Report }) {
  const t = useT();
  return (
    <DomainSlide
      report={report}
      items={report.humanItems}
      title={t("slide.human.title")}
      icon={Users}
    />
  );
}
