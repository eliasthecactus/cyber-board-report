import { useEffect, useMemo, useRef, useState } from "react";
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
import { getReport, saveReport } from "@/lib/storage";
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
        <span className="loading loading-spinner loading-lg" aria-label="Loading" />
      </main>
    );
  }

  if (!report) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center p-6">
        <section className="w-full max-w-md rounded-lg border border-base-300 bg-base-100 p-6 shadow-sm">
          <h1 className="mb-3 text-xl font-bold">{t("editor.reportNotFound")}</h1>
          <button className="btn btn-primary" onClick={() => navigateTo("/")}>
            {t("notFound.back")}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell min-h-screen">
      <header className="sticky top-0 z-40 border-b border-base-300 bg-base-100/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button className="btn btn-ghost btn-sm" onClick={() => navigateTo("/")}>
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold">
                {t("editor.boardReport", { quarter: report.quarter, year: report.year })}
              </h1>
              <p className="text-xs text-base-content/60">
                {t("editor.updated", { date: new Date(report.updatedAt).toLocaleString() })}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              className={`btn btn-sm gap-2 ${saveButtonClass(saveState)}`}
              onClick={() => void handleSaveNow()}
              disabled={saveState === "saving"}
              title={t(`editor.saveTitle.${saveState}`)}
            >
              {saveState === "saving" ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <Save size={16} />
              )}
              {t(`editor.save.${saveState}`)}
            </button>
            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => navigateTo(`/slides/${encodeURIComponent(report.id)}`)}
            >
              <Play size={16} />
              {t("editor.preview")}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <nav className="rounded-lg border border-base-300 bg-base-100 p-3 shadow-sm">
            <div className="mb-3 border-b border-base-300 pb-3">
              <p className="text-xs font-semibold uppercase text-base-content/50">
                {t("editor.reportSections")}
              </p>
            </div>
            <div className="grid gap-1">
              {sections.map((section) => {
                const Icon = section.Icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`btn btn-sm justify-start gap-2 ${
                      isActive ? "btn-primary" : "btn-ghost"
                    }`}
                  >
                    <Icon size={17} />
                    <span className="truncate text-left">{t(section.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        <section className="min-w-0 rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm sm:p-6">
          <div className="mb-6 flex items-center justify-between gap-3 border-b border-base-300 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase text-base-content/50">
                {t("editor.editing")}
              </p>
              <h2 className="text-xl font-bold">
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
    </main>
  );
}

function saveButtonClass(state: SaveState): string {
  if (state === "saved") {
    return "btn-outline border-success text-success hover:bg-success hover:text-success-content";
  }

  if (state === "error") {
    return "btn-error";
  }

  return "btn-primary";
}
