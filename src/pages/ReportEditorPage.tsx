import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Cpu,
  Eye,
  FileText,
  Globe,
  Handshake,
  History,
  Info,
  Loader2,
  Pen,
  Play,
  Save,
  Settings2,
  Target,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { DomainItem, Report, ReportSection, ThreatItem } from "@/types";
import DecisionsEditor from "@/components/editors/DecisionsEditor";
import DetailsEditor from "@/components/editors/DetailsEditor";
import ExecutiveSummaryEditor from "@/components/editors/ExecutiveSummaryEditor";
import IncidentsEditor from "@/components/editors/IncidentsEditor";
import InitiativesEditor from "@/components/editors/InitiativesEditor";
import ItemListEditor from "@/components/editors/ItemListEditor";
import KPIEditor from "@/components/editors/KPIEditor";
import OutlookEditor from "@/components/editors/OutlookEditor";
import TopRisksEditor from "@/components/editors/TopRisksEditor";
import { slideForSection } from "@/components/slides/slideRegistry";
import { QuarterDialog } from "@/components/QuarterDialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageMessage, PageSpinner } from "@/components/ui/PageState";
import { navigateTo } from "@/lib/navigation";
import { getReport, listReports, saveReport } from "@/lib/storage";
import { formatDateTime, useLanguage, useT, type MessageKey } from "@/lib/i18n";
import { describeError } from "@/lib/errors";
import { ReportContextProvider, serializeReportForAi } from "@/lib/reportContext";
import { findPriorReport, sectionPatch, type EditorSection } from "@/lib/sectionImport";
import { useAutosave, type SaveState } from "@/lib/useAutosave";

interface ReportEditorPageProps {
  reportId: string;
}

const sections: { id: EditorSection; labelKey: MessageKey; Icon: LucideIcon }[] = [
  { id: "details", labelKey: "section.details", Icon: Settings2 },
  { id: "executiveSummary", labelKey: "section.executiveSummary", Icon: FileText },
  { id: "topRisks", labelKey: "section.topRisks", Icon: AlertTriangle },
  { id: "threatLandscape", labelKey: "section.threatLandscape", Icon: Globe },
  { id: "kpis", labelKey: "section.kpis", Icon: BarChart3 },
  { id: "incidents", labelKey: "section.incidents", Icon: AlertCircle },
  { id: "processItems", labelKey: "section.processItems", Icon: Workflow },
  { id: "humanItems", labelKey: "section.humanItems", Icon: Users },
  { id: "technologyItems", labelKey: "section.technologyItems", Icon: Cpu },
  { id: "initiatives", labelKey: "section.initiatives", Icon: Target },
  { id: "outlook", labelKey: "section.outlook", Icon: Eye },
  { id: "decisionsRequired", labelKey: "section.decisionsRequired", Icon: Handshake },
];

type ListSection = "threatLandscape" | "processItems" | "humanItems" | "technologyItems";

/** Translation keys for the four sections edited with ItemListEditor. */
const listEditorKeys: Record<
  ListSection,
  { prefix: string; title: MessageKey; desc: MessageKey; placeholder: MessageKey; add: MessageKey; empty: MessageKey; tip: MessageKey }
> = {
  threatLandscape: {
    prefix: "threat",
    title: "ed.threat.title",
    desc: "ed.threat.desc",
    placeholder: "ed.threat.itemPlaceholder",
    add: "ed.threat.add",
    empty: "ed.threat.empty",
    tip: "ed.threat.tip",
  },
  processItems: {
    prefix: "process",
    title: "ed.process.title",
    desc: "ed.process.desc",
    placeholder: "ed.process.itemPlaceholder",
    add: "ed.process.add",
    empty: "ed.process.empty",
    tip: "ed.process.tip",
  },
  humanItems: {
    prefix: "human",
    title: "ed.human.title",
    desc: "ed.human.desc",
    placeholder: "ed.human.itemPlaceholder",
    add: "ed.human.add",
    empty: "ed.human.empty",
    tip: "ed.human.tip",
  },
  technologyItems: {
    prefix: "technology",
    title: "ed.technology.title",
    desc: "ed.technology.desc",
    placeholder: "ed.technology.itemPlaceholder",
    add: "ed.technology.add",
    empty: "ed.technology.empty",
    tip: "ed.technology.tip",
  },
};

export default function ReportEditorPage({ reportId }: ReportEditorPageProps) {
  const t = useT();
  const lang = useLanguage();
  const [report, setReport] = useState<Report | null>(null);
  const [priorReport, setPriorReport] = useState<Report | null>(null);
  const [activeSection, setActiveSection] = useState<EditorSection>("details");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [showQuarterDialog, setShowQuarterDialog] = useState(false);
  const [confirmImport, setConfirmImport] = useState(false);
  const { saveState, flush, markSaved } = useAutosave(report, saveReport);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const storedReport = await getReport(reportId);
        if (cancelled) return;
        if (storedReport) markSaved(storedReport);
        setReport(storedReport);
        setLoading(false);

        if (storedReport) {
          const prior = findPriorReport(await listReports(), storedReport);
          if (!cancelled) setPriorReport(prior);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error);
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [reportId, markSaved]);

  const activeSectionMeta = useMemo(
    () => sections.find((section) => section.id === activeSection),
    [activeSection],
  );

  const handlePatch = useCallback((patch: Partial<Report>) => {
    setReport((current) =>
      current ? { ...current, ...patch, updatedAt: new Date().toISOString() } : current,
    );
  }, []);

  const handleSectionUpdate = <K extends ReportSection>(section: K, data: Report[K]) => {
    handlePatch({ [section]: data } as Partial<Report>);
  };

  /** Save before leaving so the next page reads the latest data. */
  const leaveTo = async (path: string) => {
    await flush().catch(() => undefined);
    navigateTo(path);
  };

  const handleChangeQuarter = async (quarter: string, year: number): Promise<string | null> => {
    if (!report) return null;
    const exists = (await listReports()).some(
      (r) => r.quarter === quarter && r.year === year && r.id !== report.id,
    );
    if (exists) {
      return t("dashboard.quarterExists", { quarter, year });
    }
    handlePatch({ quarter, year });
    setShowQuarterDialog(false);
    return null;
  };

  const getAiContext = useCallback(() => (report ? serializeReportForAi(report) : ""), [report]);

  if (loading) {
    return <PageSpinner />;
  }

  if (!report) {
    return <PageMessage title={loadError ? describeError(t, loadError) : t("editor.reportNotFound")} />;
  }

  const capacity = activeSection === "details" ? undefined : slideForSection(activeSection)?.capacity?.(report);
  const listKeys = activeSection in listEditorKeys ? listEditorKeys[activeSection as ListSection] : null;

  return (
    <main className="app-shell min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="cbr-btn cbr-btn-ghost cbr-btn-sm cbr-btn-icon"
              onClick={() => void leaveTo("/")}
              aria-label={t("common.backToDashboard")}
              title={t("common.backToDashboard")}
            >
              <ArrowLeft size={16} aria-hidden />
            </button>
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 truncate text-base font-bold text-slate-900">
                {t("editor.boardReport", { quarter: report.quarter, year: report.year })}
                <button
                  className="cbr-btn cbr-btn-ghost cbr-btn-xs cbr-btn-icon"
                  title={t("dashboard.changeQuarter")}
                  aria-label={t("dashboard.changeQuarter")}
                  onClick={() => setShowQuarterDialog(true)}
                >
                  <Pen size={12} aria-hidden />
                </button>
              </h1>
              <p className="text-xs text-slate-500">
                {t("editor.updated", { date: formatDateTime(report.updatedAt, lang) })}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              className={`cbr-btn cbr-btn-sm ${saveButtonClass(saveState)}`}
              onClick={() => void flush().catch(() => undefined)}
              disabled={saveState === "saving"}
              title={t(`editor.saveTitle.${saveState}`)}
            >
              {saveState === "saving" ? (
                <Loader2 size={14} className="animate-spin" aria-hidden />
              ) : (
                <Save size={14} aria-hidden />
              )}
              <span aria-live="polite">{t(`editor.save.${saveState}`)}</span>
            </button>
            <button
              className="cbr-btn cbr-btn-ghost cbr-btn-sm"
              onClick={() => void leaveTo(`/slides/${encodeURIComponent(report.id)}`)}
            >
              <Play size={14} aria-hidden />
              {t("editor.preview")}
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <nav
            className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            aria-label={t("editor.reportSections")}
          >
            <div className="mb-3 border-b border-slate-100 pb-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {t("editor.reportSections")}
              </p>
            </div>
            <div className="grid gap-0.5">
              {sections.map((section) => {
                const Icon = section.Icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={15} aria-hidden />
                    <span className="truncate">{t(section.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Editor panel */}
        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-6 flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {t("editor.editing")}
              </p>
              <h2 className="text-lg font-bold text-slate-900">
                {activeSectionMeta ? t(activeSectionMeta.labelKey) : ""}
              </h2>
            </div>
            {priorReport && (
              <button
                className="cbr-btn cbr-btn-outline cbr-btn-sm shrink-0"
                onClick={() => setConfirmImport(true)}
                title={t("editor.importSectionTitle", {
                  label: `${priorReport.quarter} ${priorReport.year}`,
                })}
              >
                <History size={14} aria-hidden />
                {t("editor.importSection", {
                  label: `${priorReport.quarter} ${priorReport.year}`,
                })}
              </button>
            )}
          </div>

          {capacity && capacity.total > capacity.max && (
            <div
              role="note"
              className="mb-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
            >
              <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
              {t("editor.slideCapacity", { max: capacity.max, total: capacity.total })}
            </div>
          )}

          <ReportContextProvider getContext={getAiContext}>
            {activeSection === "details" && (
              <DetailsEditor
                data={{
                  title: report.title,
                  presenter: report.presenter,
                  participants: report.participants,
                  hideEmptySlides: report.hideEmptySlides,
                }}
                presenterFallback={report.createdBy}
                onUpdate={handlePatch}
              />
            )}
            {activeSection === "executiveSummary" && (
              <ExecutiveSummaryEditor
                summary={report.executiveSummary}
                highlight={report.executiveSummaryHighlight ?? ""}
                onUpdate={handlePatch}
              />
            )}
            {activeSection === "topRisks" && (
              <TopRisksEditor
                data={report.topRisks}
                onUpdate={(data) => handleSectionUpdate("topRisks", data)}
                showRiskMatrix={report.showRiskMatrix}
                onShowRiskMatrixChange={(value) => handlePatch({ showRiskMatrix: value })}
              />
            )}
            {listKeys && (
              <ItemListEditor<ThreatItem | DomainItem>
                key={activeSection}
                data={report[activeSection as ListSection]}
                onUpdate={(data) => handleSectionUpdate(activeSection as ListSection, data)}
                idPrefix={listKeys.prefix}
                titleKey={listKeys.title}
                descKey={listKeys.desc}
                placeholderKey={listKeys.placeholder}
                detailPlaceholderKey="ed.item.detailPlaceholder"
                addKey={listKeys.add}
                emptyKey={listKeys.empty}
                tipKey={listKeys.tip}
                aiLabelKey={listKeys.title}
              />
            )}
            {activeSection === "kpis" && (
              <KPIEditor
                data={report.kpis}
                onUpdate={(data) => handleSectionUpdate("kpis", data)}
                reportQuarter={report.quarter}
                reportYear={report.year}
              />
            )}
            {activeSection === "incidents" && (
              <IncidentsEditor
                data={report.incidents}
                onUpdate={(data) => handleSectionUpdate("incidents", data)}
              />
            )}
            {activeSection === "initiatives" && (
              <InitiativesEditor
                data={report.initiatives}
                onUpdate={(data) => handleSectionUpdate("initiatives", data)}
              />
            )}
            {activeSection === "outlook" && (
              <OutlookEditor
                outlook={report.outlook}
                emergingRisks={report.emergingRisks}
                onUpdate={handlePatch}
              />
            )}
            {activeSection === "decisionsRequired" && (
              <DecisionsEditor
                data={report.decisionsRequired}
                onUpdate={(data) => handleSectionUpdate("decisionsRequired", data)}
              />
            )}
          </ReportContextProvider>
        </section>
      </section>

      {showQuarterDialog && (
        <QuarterDialog
          title={t("dashboard.changeQuarter")}
          description={t("dashboard.changeQuarterDesc")}
          submitLabel={t("common.save")}
          initialQuarter={report.quarter}
          initialYear={report.year}
          onSubmit={handleChangeQuarter}
          onCancel={() => setShowQuarterDialog(false)}
        />
      )}

      {confirmImport && priorReport && activeSectionMeta && (
        <ConfirmDialog
          title={t("editor.importSectionDialogTitle")}
          body={t("editor.importSectionConfirm", {
            section: t(activeSectionMeta.labelKey),
            label: `${priorReport.quarter} ${priorReport.year}`,
          })}
          confirmLabel={t("editor.importSectionAction")}
          onCancel={() => setConfirmImport(false)}
          onConfirm={() => {
            handlePatch(sectionPatch(activeSection, priorReport));
            setConfirmImport(false);
          }}
        />
      )}
    </main>
  );
}

function saveButtonClass(state: SaveState): string {
  if (state === "saved") {
    return "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100";
  }
  if (state === "error") {
    return "cbr-btn-danger";
  }
  return "cbr-btn-primary";
}
