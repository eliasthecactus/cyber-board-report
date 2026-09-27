import type { ReactNode } from "react";
import { CalendarDays, Copy, Download, Edit2, FileText, Loader2, Play, Trash2 } from "lucide-react";
import type { Report } from "@/types";
import { formatDateTime, useLanguage, useT } from "@/lib/i18n";
import { navigateTo } from "@/lib/navigation";

interface ReportCardProps {
  report: Report;
  busy: boolean;
  exporting: boolean;
  onDuplicate: () => void;
  onChangeQuarter: () => void;
  onExport: () => void;
  onDownloadJson: () => void;
  onDelete: () => void;
}

export function ReportCard({
  report,
  busy,
  exporting,
  onDuplicate,
  onChangeQuarter,
  onExport,
  onDownloadJson,
  onDelete,
}: ReportCardProps) {
  const t = useT();
  const lang = useLanguage();
  const label = `${report.quarter} ${report.year}`;

  const iconButton = (title: string, onClick: () => void, icon: ReactNode, extra = "", disabled = busy) => (
    <button
      className={`cbr-btn cbr-btn-ghost cbr-btn-sm cbr-btn-icon ${extra}`}
      title={title}
      aria-label={`${title}: ${label}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
    </button>
  );

  return (
    <article
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      aria-labelledby={`report-${report.id}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 id={`report-${report.id}`} className="text-lg font-bold text-slate-900">
            {label}
          </h2>
          <p className="text-xs text-slate-500">
            {t("dashboard.updated", { date: formatDateTime(report.updatedAt, lang) })}
          </p>
        </div>
        <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
          {report.createdBy}
        </span>
      </div>

      <dl className="mb-5 grid grid-cols-3 gap-2 text-sm">
        {[
          [t("dashboard.risks"), report.topRisks.length],
          [t("dashboard.kpis"), report.kpis.length],
          [t("dashboard.decisions"), report.decisionsRequired.length],
        ].map(([name, count]) => (
          <div key={name} className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
            <dt className="text-xs text-slate-500">{name}</dt>
            <dd className="text-lg font-semibold text-slate-800">{count}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap justify-end gap-1.5">
        <button
          className="cbr-btn cbr-btn-outline cbr-btn-sm"
          onClick={() => navigateTo(`/editor/${encodeURIComponent(report.id)}`)}
          aria-label={`${t("dashboard.edit")}: ${label}`}
        >
          <Edit2 size={14} aria-hidden />
          {t("dashboard.edit")}
        </button>
        <button
          className="cbr-btn cbr-btn-primary cbr-btn-sm"
          onClick={() => navigateTo(`/slides/${encodeURIComponent(report.id)}`)}
          aria-label={`${t("dashboard.view")}: ${label}`}
        >
          <Play size={14} aria-hidden />
          {t("dashboard.view")}
        </button>
        {iconButton(t("dashboard.duplicate"), onDuplicate, <Copy size={14} aria-hidden />)}
        {iconButton(t("dashboard.changeQuarter"), onChangeQuarter, <CalendarDays size={14} aria-hidden />)}
        {iconButton(
          t("dashboard.exportSlides"),
          onExport,
          exporting ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <FileText size={14} aria-hidden />,
          "",
          exporting,
        )}
        {iconButton(t("dashboard.exportReport"), onDownloadJson, <Download size={14} aria-hidden />, "", false)}
        {iconButton(
          t("common.delete"),
          onDelete,
          busy ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Trash2 size={14} aria-hidden />,
          "text-red-600",
        )}
      </div>
    </article>
  );
}
