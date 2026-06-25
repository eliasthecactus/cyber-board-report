import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle,
  DollarSign,
  Eye,
  FileText,
  Globe,
  Handshake,
  Link2,
  Loader2,
  Pen,
  Play,
  Save,
  ScrollText,
  Target,
} from "lucide-react";
import type { Report, ReportSection } from "@/types";
import BudgetEditor from "@/components/editors/BudgetEditor";
import ComplianceEditor from "@/components/editors/ComplianceEditor";
import DecisionsEditor from "@/components/editors/DecisionsEditor";
import ExecutiveSummaryEditor from "@/components/editors/ExecutiveSummaryEditor";
import IncidentsEditor from "@/components/editors/IncidentsEditor";
import InitiativesEditor from "@/components/editors/InitiativesEditor";
import KPIEditor from "@/components/editors/KPIEditor";
import OutlookEditor from "@/components/editors/OutlookEditor";
import ProgramStatusEditor from "@/components/editors/ProgramStatusEditor";
import SupplyChainEditor from "@/components/editors/SupplyChainEditor";
import ThreatLandscapeEditor from "@/components/editors/ThreatLandscapeEditor";
import TopRisksEditor from "@/components/editors/TopRisksEditor";
import { navigateTo } from "@/lib/navigation";
import { getReport, saveReport, listReports } from "@/lib/storage";
import { useT } from "@/lib/i18n";
import { ReportContextProvider, serializeReportForAi } from "@/lib/reportContext";

interface ReportEditorPageProps {
  reportId: string;
}

type SaveState = "saved" | "saving" | "unsaved" | "error";

const sections: { id: ReportSection; labelKey: string; Icon: typeof FileText }[] = [
  { id: "executiveSummary", labelKey: "section.executiveSummary", Icon: FileText },
  { id: "topRisks", labelKey: "section.topRisks", Icon: AlertTriangle },
  { id: "threatLandscape", labelKey: "section.threatLandscape", Icon: Globe },
  { id: "kpis", labelKey: "section.kpis", Icon: BarChart3 },
  { id: "incidents", labelKey: "section.incidents", Icon: AlertCircle },
  { id: "programStatus", labelKey: "section.programStatus", Icon: CheckCircle },
  { id: "budgetResources", labelKey: "section.budgetResources", Icon: DollarSign },
  { id: "complianceAudit", labelKey: "section.complianceAudit", Icon: ScrollText },
  { id: "supplyChainRisk", labelKey: "section.supplyChainRisk", Icon: Link2 },
  { id: "initiatives", labelKey: "section.initiatives", Icon: Target },
  { id: "outlook", labelKey: "section.outlook", Icon: Eye },
  { id: "decisionsRequired", labelKey: "section.decisionsRequired", Icon: Handshake },
];

export default function ReportEditorPage({ reportId }: ReportEditorPageProps) {
  const t = useT();
  const [report, setReport] = useState<Report | null>(null);
  const [activeSection, setActiveSection] = useState<ReportSection>("executiveSummary");
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
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)]">
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
          </div>

          <ReportContextProvider getContext={() => serializeReportForAi(report)}>
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
            />
          )}
          {activeSection === "threatLandscape" && (
            <ThreatLandscapeEditor
              data={report.threatLandscape}
              onUpdate={(data) => handleSectionUpdate("threatLandscape", data)}
            />
          )}
          {activeSection === "kpis" && (
            <KPIEditor
              data={report.kpis}
              onUpdate={(data) => handleSectionUpdate("kpis", data)}
            />
          )}
          {activeSection === "incidents" && (
            <IncidentsEditor
              data={report.incidents}
              onUpdate={(data) => handleSectionUpdate("incidents", data)}
            />
          )}
          {activeSection === "programStatus" && (
            <ProgramStatusEditor
              data={report.programStatus}
              onUpdate={(data) => handleSectionUpdate("programStatus", data)}
            />
          )}
          {activeSection === "budgetResources" && (
            <BudgetEditor
              data={report.budgetResources}
              onUpdate={(data) => handleSectionUpdate("budgetResources", data)}
            />
          )}
          {activeSection === "complianceAudit" && (
            <ComplianceEditor
              data={report.complianceAudit}
              onUpdate={(data) => handleSectionUpdate("complianceAudit", data)}
            />
          )}
          {activeSection === "supplyChainRisk" && (
            <SupplyChainEditor
              data={report.supplyChainRisk}
              onUpdate={(data) => handleSectionUpdate("supplyChainRisk", data)}
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
