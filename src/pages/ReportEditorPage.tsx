import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
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
  Loader2,
  Pen,
  Play,
  Save,
  Settings2,
  Target,
  Users,
  Workflow,
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
import { navigateTo } from "@/lib/navigation";
import { getReport, saveReport, listReports } from "@/lib/storage";
import { useT } from "@/lib/i18n";
import { createId } from "@/lib/reportFactory";
import { ReportContextProvider, serializeReportForAi } from "@/lib/reportContext";

function quarterNumber(quarter: string): number {
  return Number(quarter.replace(/\D/g, "")) || 0;
}

/** Whether report `a` covers an earlier period than `current`. */
function isEarlier(a: Report, current: Report): boolean {
  if (a.year !== current.year) return a.year < current.year;
  return quarterNumber(a.quarter) < quarterNumber(current.quarter);
}

/** Clone an array of items giving each a fresh id, so copied rows stay unique. */
function withFreshIds<T extends { id: string }>(items: T[], prefix: string): T[] {
  return items.map((item) => ({ ...structuredClone(item), id: createId(prefix) }));
}

/** Build the patch that copies one section's content from a source report. */
function sectionPatch(section: EditorSection, source: Report): Partial<Report> {
  switch (section) {
    case "details":
      return {
        title: source.title,
        presenter: source.presenter,
        participants: [...source.participants],
      };
    case "executiveSummary":
      return { executiveSummary: source.executiveSummary };
    case "topRisks":
      return { topRisks: withFreshIds(source.topRisks, "risk") };
    case "threatLandscape":
      return { threatLandscape: withFreshIds(source.threatLandscape, "threat") };
    case "kpis":
      return { kpis: withFreshIds(source.kpis, "kpi") };
    case "incidents":
      return { incidents: withFreshIds(source.incidents, "incident") };
    case "processItems":
      return { processItems: withFreshIds(source.processItems, "process") };
    case "humanItems":
      return { humanItems: withFreshIds(source.humanItems, "human") };
    case "technologyItems":
      return { technologyItems: withFreshIds(source.technologyItems, "technology") };
    case "initiatives":
      return { initiatives: withFreshIds(source.initiatives, "initiative") };
    case "outlook":
      return { outlook: source.outlook };
    case "decisionsRequired":
      return { decisionsRequired: withFreshIds(source.decisionsRequired, "decision") };
    default:
      return {};
  }
}

interface ReportEditorPageProps {
  reportId: string;
}

type SaveState = "saved" | "saving" | "unsaved" | "error";

type EditorSection = "details" | ReportSection;

const sections: { id: EditorSection; labelKey: string; Icon: typeof FileText }[] = [
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

export default function ReportEditorPage({ reportId }: ReportEditorPageProps) {
  const t = useT();
  const [report, setReport] = useState<Report | null>(null);
  const [priorReport, setPriorReport] = useState<Report | null>(null);
  const [activeSection, setActiveSection] = useState<EditorSection>("details");
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const lastSavedSnapshot = useRef("");
  const [showQuarterDialog, setShowQuarterDialog] = useState(false);
  const [quarterForm, setQuarterForm] = useState({ quarter: "", year: new Date().getFullYear() });
  const [quarterError, setQuarterError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const storedReport = await getReport(reportId);
      if (cancelled) {
        return;
      }

      setReport(storedReport);
      lastSavedSnapshot.current = storedReport ? JSON.stringify(storedReport) : "";
      setSaveState("saved");
      setLoading(false);

      if (storedReport) {
        const all = await listReports();
        if (cancelled) return;
        const prior = all
          .filter((r) => r.id !== storedReport.id && isEarlier(r, storedReport))
          .sort((a, b) =>
            a.year !== b.year
              ? b.year - a.year
              : quarterNumber(b.quarter) - quarterNumber(a.quarter),
          )[0];
        setPriorReport(prior || null);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [reportId]);

  useEffect(() => {
    if (!report) {
      return;
    }

    const snapshot = JSON.stringify(report);
    if (snapshot === lastSavedSnapshot.current) {
      return;
    }

    setSaveState("unsaved");
    const timeout = window.setTimeout(() => {
      void persistReport(report, snapshot);
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [report]);

  const activeSectionMeta = useMemo(
    () => sections.find((section) => section.id === activeSection),
    [activeSection],
  );

  const persistReport = async (nextReport: Report, snapshot: string) => {
    setSaveState("saving");
    try {
      await saveReport(nextReport);
      lastSavedSnapshot.current = snapshot;
      setSaveState("saved");
    } catch (error) {
      console.error("Failed to save report:", error);
      setSaveState("error");
    }
  };

  const handleSaveNow = async () => {
    if (!report) {
      return;
    }

    const snapshot = JSON.stringify(report);
    await persistReport(report, snapshot);
  };

  const handleChangeQuarter = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!report || !quarterForm.quarter) return;

    const allReports = await listReports();
    const exists = allReports.some(
      (r) => r.quarter === quarterForm.quarter && r.year === quarterForm.year && r.id !== report.id,
    );
    if (exists) {
      setQuarterError(t("dashboard.quarterExists", { quarter: quarterForm.quarter, year: quarterForm.year }));
      return;
    }

    const updated = {
      ...report,
      quarter: quarterForm.quarter,
      year: Number(quarterForm.year),
      updatedAt: new Date().toISOString(),
    };
    setReport(updated);
    const snapshot = JSON.stringify(updated);
    await persistReport(updated, snapshot);
    setShowQuarterDialog(false);
  };

  const handleSectionUpdate = <K extends ReportSection>(section: K, data: Report[K]) => {
    setReport((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [section]: data,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handlePatch = (patch: Partial<Report>) => {
    setReport((current) =>
      current ? { ...current, ...patch, updatedAt: new Date().toISOString() } : current,
    );
  };

  const handleImportSection = () => {
    if (!priorReport || !activeSectionMeta) return;
    const label = `${priorReport.quarter} ${priorReport.year}`;
    const sectionName = t(activeSectionMeta.labelKey);
    if (!window.confirm(t("editor.importSectionConfirm", { section: sectionName, label }))) {
      return;
    }
    handlePatch(sectionPatch(activeSection, priorReport));
  };

  if (loading) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </main>
    );
  }

  if (!report) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center p-6">
        <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="mb-3 text-xl font-bold text-slate-900">{t("editor.reportNotFound")}</h1>
          <button className="cbr-btn cbr-btn-primary" onClick={() => navigateTo("/")}>
            {t("notFound.back")}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button className="cbr-btn cbr-btn-ghost cbr-btn-sm cbr-btn-icon" onClick={() => navigateTo("/")}>
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 truncate text-base font-bold text-slate-900">
                {t("editor.boardReport", { quarter: report.quarter, year: report.year })}
                <button
                  className="cbr-btn cbr-btn-ghost cbr-btn-xs cbr-btn-icon"
                  title={t("dashboard.changeQuarter")}
                  onClick={() => {
                    setQuarterForm({ quarter: report.quarter, year: report.year });
                    setQuarterError(null);
                    setShowQuarterDialog(true);
                  }}
                >
                  <Pen size={12} />
                </button>
              </h1>
              <p className="text-xs text-slate-400">
                {t("editor.updated", { date: new Date(report.updatedAt).toLocaleString() })}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              className={`cbr-btn cbr-btn-sm ${saveButtonClass(saveState)}`}
              onClick={() => void handleSaveNow()}
              disabled={saveState === "saving"}
              title={t(`editor.saveTitle.${saveState}`)}
            >
              {saveState === "saving" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              {t(`editor.save.${saveState}`)}
            </button>
            <button
              className="cbr-btn cbr-btn-ghost cbr-btn-sm"
              onClick={() => navigateTo(`/slides/${encodeURIComponent(report.id)}`)}
            >
              <Play size={14} />
              {t("editor.preview")}
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <nav className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-3 border-b border-slate-100 pb-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={15} />
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
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {t("editor.editing")}
              </p>
              <h2 className="text-lg font-bold text-slate-900">
                {activeSectionMeta ? t(activeSectionMeta.labelKey) : ""}
              </h2>
            </div>
            {priorReport && (
              <button
                className="cbr-btn cbr-btn-outline cbr-btn-sm shrink-0"
                onClick={handleImportSection}
                title={t("editor.importSectionTitle", {
                  label: `${priorReport.quarter} ${priorReport.year}`,
                })}
              >
                <History size={14} />
                {t("editor.importSection", {
                  label: `${priorReport.quarter} ${priorReport.year}`,
                })}
              </button>
            )}
          </div>

          <ReportContextProvider getContext={() => serializeReportForAi(report)}>
          {activeSection === "details" && (
            <DetailsEditor
              data={{
                title: report.title,
                presenter: report.presenter,
                participants: report.participants,
              }}
              presenterFallback={report.createdBy}
              onUpdate={(patch) => handlePatch(patch)}
            />
          )}
          {activeSection === "executiveSummary" && (
            <ExecutiveSummaryEditor
              data={report.executiveSummary}
              onUpdate={(data) => handleSectionUpdate("executiveSummary", data)}
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
          {activeSection === "threatLandscape" && (
            <ItemListEditor<ThreatItem>
              data={report.threatLandscape}
              onUpdate={(data) => handleSectionUpdate("threatLandscape", data)}
              idPrefix="threat"
              titleKey="ed.threat.title"
              descKey="ed.threat.desc"
              placeholderKey="ed.threat.itemPlaceholder"
              detailPlaceholderKey="ed.item.detailPlaceholder"
              addKey="ed.threat.add"
              emptyKey="ed.threat.empty"
              tipKey="ed.threat.tip"
              aiLabelKey="ed.threat.title"
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
          {activeSection === "processItems" && (
            <ItemListEditor<DomainItem>
              data={report.processItems}
              onUpdate={(data) => handleSectionUpdate("processItems", data)}
              idPrefix="process"
              titleKey="ed.process.title"
              descKey="ed.process.desc"
              placeholderKey="ed.process.itemPlaceholder"
              detailPlaceholderKey="ed.item.detailPlaceholder"
              addKey="ed.process.add"
              emptyKey="ed.process.empty"
              tipKey="ed.process.tip"
              aiLabelKey="ed.process.title"
            />
          )}
          {activeSection === "humanItems" && (
            <ItemListEditor<DomainItem>
              data={report.humanItems}
              onUpdate={(data) => handleSectionUpdate("humanItems", data)}
              idPrefix="human"
              titleKey="ed.human.title"
              descKey="ed.human.desc"
              placeholderKey="ed.human.itemPlaceholder"
              detailPlaceholderKey="ed.item.detailPlaceholder"
              addKey="ed.human.add"
              emptyKey="ed.human.empty"
              tipKey="ed.human.tip"
              aiLabelKey="ed.human.title"
            />
          )}
          {activeSection === "technologyItems" && (
            <ItemListEditor<DomainItem>
              data={report.technologyItems}
              onUpdate={(data) => handleSectionUpdate("technologyItems", data)}
              idPrefix="technology"
              titleKey="ed.technology.title"
              descKey="ed.technology.desc"
              placeholderKey="ed.technology.itemPlaceholder"
              detailPlaceholderKey="ed.item.detailPlaceholder"
              addKey="ed.technology.add"
              emptyKey="ed.technology.empty"
              tipKey="ed.technology.tip"
              aiLabelKey="ed.technology.title"
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
              data={report.outlook}
              onUpdate={(data) => handleSectionUpdate("outlook", data)}
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

      {/* Change quarter dialog */}
      {showQuarterDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-semibold text-slate-900">{t("dashboard.changeQuarter")}</h2>
            <p className="mb-4 text-sm text-slate-500">{t("dashboard.changeQuarterDesc")}</p>
            <form onSubmit={handleChangeQuarter} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  {t("dashboard.quarter")}
                </label>
                <select
                  value={quarterForm.quarter}
                  onChange={(e) => { setQuarterForm({ ...quarterForm, quarter: e.target.value }); setQuarterError(null); }}
                  required
                  className="form-input"
                >
                  <option value="">{t("dashboard.selectQuarter")}</option>
                  <option value="Q1">Q1</option>
                  <option value="Q2">Q2</option>
                  <option value="Q3">Q3</option>
                  <option value="Q4">Q4</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  {t("dashboard.year")}
                </label>
                <input
                  type="number"
                  value={quarterForm.year}
                  onChange={(e) => { setQuarterForm({ ...quarterForm, year: Number(e.target.value) }); setQuarterError(null); }}
                  required
                  min="2000"
                  max="2100"
                  className="form-input"
                />
              </div>
              {quarterError && <p className="text-sm text-red-600">{quarterError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="cbr-btn cbr-btn-ghost" onClick={() => setShowQuarterDialog(false)}>
                  {t("common.cancel")}
                </button>
                <button type="submit" className="cbr-btn cbr-btn-primary" disabled={!quarterForm.quarter}>
                  {t("common.save")}
                </button>
              </div>
            </form>
          </div>
          <div className="fixed inset-0 -z-10" onClick={() => setShowQuarterDialog(false)} />
        </div>
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
