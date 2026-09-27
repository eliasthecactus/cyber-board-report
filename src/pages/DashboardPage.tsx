import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { Download, FileJson, HardDrive, Plus, Settings, Upload } from "lucide-react";
import type { Report } from "@/types";
import { downloadJson, readJsonFile, reportFileStem } from "@/lib/files";
import { cloneReport, createEmptyReport } from "@/lib/reportFactory";
import { navigateTo } from "@/lib/navigation";
import { describeError } from "@/lib/errors";
import { useT } from "@/lib/i18n";
import { useSettings } from "@/lib/settings";
import {
  analyzeSnapshot,
  deleteReport,
  getProfile,
  importSnapshotPayload,
  listReports,
  requestPersistentStorage,
  saveReport,
  type LocalProfile,
  type SnapshotInfo,
  type SnapshotSelection,
} from "@/lib/storage";
import { QuarterDialog } from "@/components/QuarterDialog";
import { PageSpinner } from "@/components/ui/PageState";
import { Toast } from "@/components/ui/Toast";
import ExportDialog from "@/components/export/ExportDialog";
import { ExportProgress } from "@/components/export/ExportProgress";
import { useReportExport } from "@/components/export/useReportExport";
import { BackupExportDialog } from "@/components/dashboard/BackupExportDialog";
import { BackupReminder, backupOverdue } from "@/components/dashboard/BackupReminder";
import { ReportCard } from "@/components/dashboard/ReportCard";
import { RowWarning, SelectionDialog } from "@/components/dashboard/SelectionDialog";

type QuarterDialogState =
  | { mode: "create" }
  | { mode: "duplicate"; report: Report }
  | { mode: "changeQuarter"; report: Report };

interface ToastState {
  message: string;
  action?: { label: string; onClick: () => void };
}

export default function DashboardPage() {
  const t = useT();
  const { settings, reload: reloadSettings } = useSettings();
  const [reports, setReports] = useState<Report[]>([]);
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [quarterDialog, setQuarterDialog] = useState<QuarterDialogState | null>(null);
  const [busyReportId, setBusyReportId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [backupOpen, setBackupOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState<Report | null>(null);
  const [importState, setImportState] = useState<{
    payload: unknown;
    info: SnapshotInfo;
    selection: SnapshotSelection;
  } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const showError = useCallback((error: unknown) => setToast({ message: describeError(t, error) }), [t]);
  const exporter = useReportExport(showError);

  const refresh = useCallback(async () => {
    try {
      const [storedProfile, storedReports] = await Promise.all([getProfile(), listReports()]);
      setProfile(storedProfile);
      setReports(storedReports);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const quarterTaken = (quarter: string, year: number, excludeId?: string) =>
    reports.some((r) => r.quarter === quarter && r.year === year && r.id !== excludeId);

  const handleQuarterSubmit = async (quarter: string, year: number): Promise<string | null> => {
    if (!quarterDialog || !profile) return null;
    const excludeId = quarterDialog.mode === "changeQuarter" ? quarterDialog.report.id : undefined;
    if (quarterTaken(quarter, year, excludeId)) {
      return t("dashboard.quarterExists", { quarter, year });
    }

    try {
      if (quarterDialog.mode === "create") {
        const report = createEmptyReport({ quarter, year, createdBy: profile.displayName });
        await saveReport(report);
        void requestPersistentStorage();
        navigateTo(`/editor/${encodeURIComponent(report.id)}`);
        return null;
      }

      const { report } = quarterDialog;
      setBusyReportId(report.id);
      if (quarterDialog.mode === "duplicate") {
        await saveReport({ ...cloneReport(report, profile.displayName), quarter, year });
        setToast({ message: t("dashboard.duplicated", { quarter, year }) });
      } else {
        await saveReport({ ...report, quarter, year, updatedAt: new Date().toISOString() });
        setToast({ message: t("dashboard.quarterChanged", { quarter, year }) });
      }
      setReports(await listReports());
      setQuarterDialog(null);
      return null;
    } catch (error) {
      return describeError(t, error);
    } finally {
      setBusyReportId(null);
    }
  };

  const handleDelete = async (report: Report) => {
    setBusyReportId(report.id);
    try {
      await deleteReport(report.id);
      setReports((current) => current.filter((item) => item.id !== report.id));
      setToast({
        message: t("dashboard.deleted", { quarter: report.quarter, year: report.year }),
        action: {
          label: t("common.undo"),
          onClick: () => {
            setToast(null);
            void saveReport(report).then(refresh, showError);
          },
        },
      });
    } catch (error) {
      showError(error);
    } finally {
      setBusyReportId(null);
    }
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    try {
      const payload = await readJsonFile(file);
      const info = analyzeSnapshot(payload);
      if (
        info.reportsCount === 0 &&
        !info.name &&
        !info.hasLogo &&
        !info.hasPrimaryColor &&
        !info.hasAi &&
        !info.hasApiKey
      ) {
        setToast({ message: t("dashboard.importFailed") });
        return;
      }
      // Pre-select the harmless parts. AI settings change what is sent to a
      // third party, so they must be reviewed and opted into explicitly.
      setImportState({
        payload,
        info,
        selection: {
          reports: info.reportsCount > 0,
          name: Boolean(info.name),
          logo: info.hasLogo,
          primaryColor: info.hasPrimaryColor,
          ai: false,
          apiKey: false,
          language: info.hasLanguage,
        },
      });
    } catch (error) {
      showError(error);
    }
  };

  const handleImportConfirm = async () => {
    if (!importState) return;
    try {
      const result = await importSnapshotPayload(importState.payload, importState.selection);
      if (result.settingsImported || result.profileImported) {
        await reloadSettings();
      }
      if (result.reportsImported > 0) {
        void requestPersistentStorage();
      }
      const reportsMessage =
        result.reportsImported > 0 ? t("dashboard.imported", { count: result.reportsImported }) : "";
      const settingsMessage =
        result.settingsImported || result.profileImported ? t("dashboard.importedSettings") : "";
      setToast({ message: [reportsMessage, settingsMessage].filter(Boolean).join(" ") || t("dashboard.importFailed") });
      await refresh();
    } catch (error) {
      showError(error);
    } finally {
      setImportState(null);
    }
  };

  if (loading) {
    return <PageSpinner />;
  }

  const openImport = () => importInputRef.current?.click();

  return (
    <main className="app-shell min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <span className="text-lg font-bold text-slate-900">{t("dashboard.brand")}</span>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 sm:flex">
              <HardDrive size={14} aria-hidden />
              {t("dashboard.localStorage")}
            </span>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => void handleImport(event)}
              aria-label={t("common.import")}
            />
            <button className="cbr-btn cbr-btn-outline cbr-btn-sm" onClick={openImport}>
              <Upload size={14} aria-hidden />
              {t("common.import")}
            </button>
            <button className="cbr-btn cbr-btn-outline cbr-btn-sm" onClick={() => setBackupOpen(true)}>
              <Download size={14} aria-hidden />
              {t("common.backup")}
            </button>
            <button className="cbr-btn cbr-btn-ghost cbr-btn-sm" onClick={() => navigateTo("/profile")}>
              <Settings size={14} aria-hidden />
              {t("dashboard.settings")}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t("dashboard.heading")}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {t("dashboard.signedInAs", { name: profile?.displayName || "Local User" })}
            </p>
          </div>
          <button className="cbr-btn cbr-btn-primary" onClick={() => setQuarterDialog({ mode: "create" })}>
            <Plus size={16} aria-hidden />
            {t("dashboard.createReport")}
          </button>
        </div>

        {backupOverdue(settings.lastBackupAt, reports.length) && (
          <BackupReminder lastBackupAt={settings.lastBackupAt} onBackup={() => setBackupOpen(true)} />
        )}

        {reports.length === 0 ? (
          <section className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
            <FileJson className="mx-auto mb-3 text-slate-300" size={40} aria-hidden />
            <h2 className="text-lg font-semibold text-slate-700">{t("dashboard.noReports")}</h2>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button className="cbr-btn cbr-btn-primary" onClick={() => setQuarterDialog({ mode: "create" })}>
                <Plus size={16} aria-hidden />
                {t("dashboard.createReport")}
              </button>
              <button className="cbr-btn cbr-btn-outline" onClick={openImport}>
                <Upload size={16} aria-hidden />
                {t("dashboard.importBackup")}
              </button>
            </div>
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                busy={busyReportId === report.id}
                exporting={exporter.state?.reportId === report.id}
                onDuplicate={() => setQuarterDialog({ mode: "duplicate", report })}
                onChangeQuarter={() => setQuarterDialog({ mode: "changeQuarter", report })}
                onExport={() => setExportTarget(report)}
                onDownloadJson={() => downloadJson(`${reportFileStem(report)}.json`, report)}
                onDelete={() => void handleDelete(report)}
              />
            ))}
          </div>
        )}
      </section>

      {quarterDialog && (
        <QuarterDialog
          title={
            quarterDialog.mode === "create"
              ? t("dashboard.createNewReport")
              : quarterDialog.mode === "duplicate"
                ? t("dashboard.duplicateTitle")
                : t("dashboard.changeQuarter")
          }
          description={
            quarterDialog.mode === "duplicate"
              ? t("dashboard.duplicateDesc")
              : quarterDialog.mode === "changeQuarter"
                ? t("dashboard.changeQuarterDesc")
                : undefined
          }
          submitLabel={
            quarterDialog.mode === "create"
              ? t("dashboard.create")
              : quarterDialog.mode === "duplicate"
                ? t("dashboard.duplicate")
                : t("common.save")
          }
          initialQuarter={quarterDialog.mode === "changeQuarter" ? quarterDialog.report.quarter : ""}
          initialYear={quarterDialog.mode === "changeQuarter" ? quarterDialog.report.year : undefined}
          onSubmit={handleQuarterSubmit}
          onCancel={() => setQuarterDialog(null)}
        />
      )}

      {backupOpen && (
        <BackupExportDialog
          reportCount={reports.length}
          displayName={profile?.displayName ?? ""}
          onClose={() => setBackupOpen(false)}
          onError={showError}
        />
      )}

      {importState && (
        <SelectionDialog
          title={t("backup.importTitle")}
          desc={t("backup.importDesc")}
          confirmLabel={t("backup.import")}
          rows={[
            {
              key: "reports",
              label: t("backup.reports"),
              hint: t("backup.reportsCount", { count: importState.info.reportsCount }),
              available: importState.info.reportsCount > 0,
            },
            {
              key: "name",
              label: t("backup.name"),
              hint: importState.info.name || "",
              available: Boolean(importState.info.name),
            },
            { key: "logo", label: t("backup.logo"), hint: "", available: importState.info.hasLogo },
            {
              key: "primaryColor",
              label: t("backup.primaryColor"),
              hint: "",
              available: importState.info.hasPrimaryColor,
            },
            {
              key: "ai",
              label: t("backup.ai"),
              hint: t("backup.aiReview"),
              available: importState.info.hasAi,
              detail: (
                <RowWarning>
                  {t("backup.aiImportDetail", {
                    model: importState.info.aiModel ?? "—",
                    keywords: importState.info.redactionKeywords.join(", ") || "—",
                  })}
                </RowWarning>
              ),
            },
            {
              key: "apiKey",
              label: t("backup.apiKey"),
              hint: t("backup.apiKeyImportHint"),
              available: importState.info.hasApiKey,
              detail: <RowWarning>{t("backup.apiKeyImportWarning")}</RowWarning>,
            },
            {
              key: "language",
              label: t("backup.language"),
              hint: importState.info.language
                ? t(importState.info.language === "de" ? "settings.languageGerman" : "settings.languageEnglish")
                : "",
              available: importState.info.hasLanguage,
            },
          ]}
          selection={importState.selection}
          onChange={(selection) => setImportState({ ...importState, selection })}
          onCancel={() => setImportState(null)}
          onConfirm={() => void handleImportConfirm()}
          emptyLabel={t("backup.notAvailableImport")}
        />
      )}

      {exportTarget && (
        <ExportDialog
          reportLabel={`${exportTarget.quarter} ${exportTarget.year}`}
          onCancel={() => setExportTarget(null)}
          onChoose={(format) => {
            const report = exportTarget;
            setExportTarget(null);
            void exporter.start(report, format);
          }}
        />
      )}

      {exporter.state && <ExportProgress state={exporter.state} onCancel={exporter.cancel} />}
      {toast && <Toast message={toast.message} action={toast.action} onDismiss={() => setToast(null)} />}
      {exporter.host}
    </main>
  );
}
