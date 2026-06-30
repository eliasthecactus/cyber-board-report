import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Copy,
  Download,
  Edit2,
  FileJson,
  FileText,
  HardDrive,
  Loader2,
  Play,
  Plus,
  Settings,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { Report } from "@/types";
import { backupFilename, downloadJson, readJsonFile } from "@/lib/files";
import { createEmptyReport, cloneReport } from "@/lib/reportFactory";
import { navigateTo } from "@/lib/navigation";
import { exportReportToPdf } from "@/lib/exportPdf";
import SlideRenderer from "@/components/slides/SlideRenderer";
import { SLIDE_WIDTH, SLIDE_HEIGHT } from "@/components/slides/slideConstants";
import { useT } from "@/lib/i18n";
import { useSettings } from "@/lib/settings";
import {
  analyzeSnapshot,
  deleteReport,
  exportSnapshot,
  FULL_SELECTION,
  getProfile,
  importSnapshotPayload,
  listReports,
  saveReport,
  type LocalProfile,
  type SnapshotInfo,
  type SnapshotSelection,
} from "@/lib/storage";

interface QuarterFormState {
  quarter: string;
  year: number;
}

const initialFormState = (): QuarterFormState => ({
  quarter: "",
  year: new Date().getFullYear(),
});

type DialogMode = "create" | "duplicate" | "changeQuarter";

export default function DashboardPage() {
  const t = useT();
  const { settings, reload: reloadSettings } = useSettings();
  const [reports, setReports] = useState<Report[]>([]);
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogMode, setDialogMode] = useState<DialogMode | null>(null);
  const [targetReport, setTargetReport] = useState<Report | null>(null);
  const [formData, setFormData] = useState<QuarterFormState>(initialFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyReportId, setBusyReportId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [exportingReportId, setExportingReportId] = useState<string | null>(null);
  const [exportSlide, setExportSlide] = useState<number | null>(null);
  const [exportReport, setExportReport] = useState<Report | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportSelection, setExportSelection] = useState<SnapshotSelection>(FULL_SELECTION);
  const [importState, setImportState] = useState<{
    payload: unknown;
    info: SnapshotInfo;
    selection: SnapshotSelection;
  } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    const [storedProfile, storedReports] = await Promise.all([
      getProfile(),
      listReports(),
    ]);
    setProfile(storedProfile);
    setReports(storedReports);
    setLoading(false);
  };

  const quarterExists = (quarter: string, year: number, excludeId?: string): boolean => {
    return reports.some(
      (r) => r.quarter === quarter && r.year === year && r.id !== excludeId,
    );
  };

  const openDialog = (mode: DialogMode, report?: Report) => {
    setFormData(initialFormState());
    setFormError(null);
    setTargetReport(report || null);
    setDialogMode(mode);
  };

  const closeDialog = () => {
    setDialogMode(null);
    setTargetReport(null);
    setFormError(null);
  };

  const handleDialogSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.quarter || !profile) return;

    const excludeId = dialogMode === "changeQuarter" ? targetReport?.id : undefined;
    if (quarterExists(formData.quarter, formData.year, excludeId)) {
      setFormError(t("dashboard.quarterExists", { quarter: formData.quarter, year: formData.year }));
      return;
    }

    if (dialogMode === "create") {
      const report = createEmptyReport({
        quarter: formData.quarter,
        year: Number(formData.year),
        createdBy: profile.displayName,
      });
      await saveReport(report);
      closeDialog();
      navigateTo(`/editor/${encodeURIComponent(report.id)}`);
    } else if (dialogMode === "duplicate" && targetReport) {
      setBusyReportId(targetReport.id);
      const duplicate = cloneReport(targetReport, profile.displayName);
      duplicate.quarter = formData.quarter;
      duplicate.year = Number(formData.year);
      await saveReport(duplicate);
      setReports(await listReports());
      setBusyReportId(null);
      closeDialog();
      setMessage(t("dashboard.duplicated", { quarter: formData.quarter, year: formData.year }));
    } else if (dialogMode === "changeQuarter" && targetReport) {
      setBusyReportId(targetReport.id);
      await saveReport({
        ...targetReport,
        quarter: formData.quarter,
        year: Number(formData.year),
        updatedAt: new Date().toISOString(),
      });
      setReports(await listReports());
      setBusyReportId(null);
      closeDialog();
      setMessage(t("dashboard.quarterChanged", { quarter: formData.quarter, year: formData.year }));
    }
  };

  const handleDelete = async (report: Report) => {
    if (
      !window.confirm(
        t("dashboard.deleteConfirm", { quarter: report.quarter, year: report.year }),
      )
    ) {
      return;
    }

    setBusyReportId(report.id);
    await deleteReport(report.id);
    setReports((current) => current.filter((item) => item.id !== report.id));
    setBusyReportId(null);
  };

  const openExportDialog = () => {
    setExportSelection(FULL_SELECTION);
    setExportOpen(true);
  };

  const handleExportConfirm = async () => {
    const snapshot = await exportSnapshot(exportSelection);
    downloadJson(backupFilename(), snapshot);
    setExportOpen(false);
  };

  const handleExportReport = (report: Report) => {
    downloadJson(
      backupFilename(`${report.quarter}-${report.year}-board-report`.toLowerCase()),
      report,
    );
  };

  const handleExportPdf = async (report: Report) => {
    setExportingReportId(report.id);
    setExportReport(report);
    // Wait for render of the off-screen slide area
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
    try {
      await exportReportToPdf(report, {
        onSlide: async (slideIndex) => {
          setExportSlide(slideIndex);
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
          return (exportRef.current?.firstElementChild as HTMLElement | null);
        },
        onDone: () => {
          setExportSlide(null);
          setExportReport(null);
          setExportingReportId(null);
        },
      });
    } catch (error) {
      console.error("PDF export error:", error);
      setExportSlide(null);
      setExportReport(null);
      setExportingReportId(null);
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
      if (info.reportsCount === 0 && !info.name && !info.hasLogo && !info.hasPrimaryColor && !info.hasAi) {
        setMessage(t("dashboard.importFailed"));
        return;
      }
      // Pre-select everything the file actually contains.
      setImportState({
        payload,
        info,
        selection: {
          reports: info.reportsCount > 0,
          name: Boolean(info.name),
          logo: info.hasLogo,
          primaryColor: info.hasPrimaryColor,
          ai: info.hasAi,
          language: info.hasLanguage,
        },
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("dashboard.importFailed"));
    }
  };

  const handleImportConfirm = async () => {
    if (!importState) return;
    try {
      const result = await importSnapshotPayload(importState.payload, importState.selection);
      if (result.settingsImported || result.profileImported) {
        await reloadSettings();
      }
      if (result.reportsImported === 0 && (result.settingsImported || result.profileImported)) {
        setMessage(t("dashboard.importedSettingsOnly"));
      } else {
        const base =
          result.reportsImported === 1
            ? t("dashboard.importedOne")
            : t("dashboard.importedMany", { count: result.reportsImported });
        setMessage(
          result.settingsImported || result.profileImported
            ? `${base} ${t("dashboard.importedSettings")}`
            : base,
        );
      }
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("dashboard.importFailed"));
    } finally {
      setImportState(null);
    }
  };

  const dialogTitle =
    dialogMode === "create"
      ? t("dashboard.createNewReport")
      : dialogMode === "duplicate"
        ? t("dashboard.duplicateTitle")
        : t("dashboard.changeQuarter");

  const dialogDesc =
    dialogMode === "duplicate"
      ? t("dashboard.duplicateDesc")
      : dialogMode === "changeQuarter"
        ? t("dashboard.changeQuarterDesc")
        : null;

  if (loading) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </main>
    );
  }

  return (
    <main className="app-shell min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            className="text-lg font-bold text-slate-900 hover:text-primary transition-colors"
            onClick={() => navigateTo("/")}
          >
            {t("dashboard.brand")}
          </button>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 sm:flex">
              <HardDrive size={14} />
              {t("dashboard.localStorage")}
            </span>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImport}
            />
            <button
              className="cbr-btn cbr-btn-outline cbr-btn-sm"
              onClick={() => importInputRef.current?.click()}
            >
              <Upload size={14} />
              {t("common.import")}
            </button>
            <button className="cbr-btn cbr-btn-outline cbr-btn-sm" onClick={openExportDialog}>
              <Download size={14} />
              {t("common.backup")}
            </button>
            <button className="cbr-btn cbr-btn-ghost cbr-btn-sm" onClick={() => navigateTo("/profile")}>
              <Settings size={14} />
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
          <button className="cbr-btn cbr-btn-primary" onClick={() => openDialog("create")}>
            <Plus size={16} />
            {t("dashboard.createReport")}
          </button>
        </div>

        {/* Toast message */}
        {message && (
          <div className="mb-5 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
            <span className="text-slate-700">{message}</span>
            <button className="cbr-btn cbr-btn-ghost cbr-btn-xs" onClick={() => setMessage(null)}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Empty state */}
        {reports.length === 0 ? (
          <section className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
            <FileJson className="mx-auto mb-3 text-slate-300" size={40} />
            <h2 className="text-lg font-semibold text-slate-700">{t("dashboard.noReports")}</h2>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button className="cbr-btn cbr-btn-primary" onClick={() => openDialog("create")}>
                <Plus size={16} />
                {t("dashboard.createReport")}
              </button>
              <button
                className="cbr-btn cbr-btn-outline"
                onClick={() => importInputRef.current?.click()}
              >
                <Upload size={16} />
                {t("dashboard.importBackup")}
              </button>
            </div>
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reports.map((report) => (
              <article
                key={report.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {report.quarter} {report.year}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {t("dashboard.updated", {
                        date: new Date(report.updatedAt).toLocaleString(),
                      })}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {report.createdBy}
                  </span>
                </div>

                <dl className="mb-5 grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                    <dt className="text-xs text-slate-400">{t("dashboard.risks")}</dt>
                    <dd className="text-lg font-semibold text-slate-800">{report.topRisks.length}</dd>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                    <dt className="text-xs text-slate-400">{t("dashboard.kpis")}</dt>
                    <dd className="text-lg font-semibold text-slate-800">{report.kpis.length}</dd>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                    <dt className="text-xs text-slate-400">{t("dashboard.decisions")}</dt>
                    <dd className="text-lg font-semibold text-slate-800">{report.decisionsRequired.length}</dd>
                  </div>
                </dl>

                <div className="flex flex-wrap justify-end gap-1.5">
                  <button
                    className="cbr-btn cbr-btn-outline cbr-btn-sm"
                    onClick={() => navigateTo(`/editor/${encodeURIComponent(report.id)}`)}
                  >
                    <Edit2 size={14} />
                    {t("dashboard.edit")}
                  </button>
                  <button
                    className="cbr-btn cbr-btn-primary cbr-btn-sm"
                    onClick={() => navigateTo(`/slides/${encodeURIComponent(report.id)}`)}
                  >
                    <Play size={14} />
                    {t("dashboard.view")}
                  </button>
                  <button
                    className="cbr-btn cbr-btn-ghost cbr-btn-sm cbr-btn-icon"
                    title={t("dashboard.duplicate")}
                    onClick={() => openDialog("duplicate", report)}
                    disabled={busyReportId === report.id}
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    className="cbr-btn cbr-btn-ghost cbr-btn-sm cbr-btn-icon"
                    title={t("dashboard.changeQuarter")}
                    onClick={() => openDialog("changeQuarter", report)}
                    disabled={busyReportId === report.id}
                  >
                    <CalendarDays size={14} />
                  </button>
                  <button
                    className="cbr-btn cbr-btn-ghost cbr-btn-sm cbr-btn-icon"
                    title={t("dashboard.exportPdf")}
                    onClick={() => void handleExportPdf(report)}
                    disabled={exportingReportId === report.id}
                  >
                    {exportingReportId === report.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <FileText size={14} />
                    )}
                  </button>
                  <button
                    className="cbr-btn cbr-btn-ghost cbr-btn-sm cbr-btn-icon"
                    title={t("dashboard.exportReport")}
                    onClick={() => handleExportReport(report)}
                  >
                    <Download size={14} />
                  </button>
                  <button
                    className="cbr-btn cbr-btn-ghost cbr-btn-sm cbr-btn-icon text-red-500"
                    title={t("common.delete")}
                    onClick={() => void handleDelete(report)}
                    disabled={busyReportId === report.id}
                  >
                    {busyReportId === report.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Quarter dialog (create / duplicate / change quarter) */}
      {dialogMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-semibold text-slate-900">{dialogTitle}</h2>
            {dialogDesc && (
              <p className="mb-4 text-sm text-slate-500">{dialogDesc}</p>
            )}
            {!dialogDesc && <div className="mb-4" />}
            <form onSubmit={handleDialogSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  {t("dashboard.quarter")}
                </label>
                <select
                  value={formData.quarter}
                  onChange={(event) => {
                    setFormData({ ...formData, quarter: event.target.value });
                    setFormError(null);
                  }}
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
                  value={formData.year}
                  onChange={(event) => {
                    setFormData({ ...formData, year: Number(event.target.value) });
                    setFormError(null);
                  }}
                  required
                  min="2000"
                  max="2100"
                  className="form-input"
                />
              </div>

              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="cbr-btn cbr-btn-ghost"
                  onClick={closeDialog}
                >
                  {t("common.cancel")}
                </button>
                <button type="submit" className="cbr-btn cbr-btn-primary" disabled={!formData.quarter}>
                  {dialogMode === "create"
                    ? t("dashboard.create")
                    : dialogMode === "duplicate"
                      ? t("dashboard.duplicate")
                      : t("common.save")}
                </button>
              </div>
            </form>
          </div>
          <div
            className="fixed inset-0 -z-10"
            onClick={closeDialog}
          />
        </div>
      )}

      {/* Export selection dialog */}
      {exportOpen && (
        <SelectionDialog
          title={t("backup.exportTitle")}
          desc={t("backup.exportDesc")}
          confirmLabel={t("backup.export")}
          rows={[
            {
              key: "reports",
              label: t("backup.reports"),
              hint: t("backup.reportsCount", { count: reports.length }),
              available: reports.length > 0,
            },
            {
              key: "name",
              label: t("backup.name"),
              hint: profile?.displayName || "",
              available: Boolean(profile?.displayName),
            },
            { key: "logo", label: t("backup.logo"), hint: "", available: Boolean(settings.logo) },
            {
              key: "primaryColor",
              label: t("backup.primaryColor"),
              hint: (settings.primaryColor || "").toUpperCase(),
              available: Boolean(settings.primaryColor),
            },
            {
              key: "ai",
              label: t("backup.ai"),
              hint: "",
              available: Boolean(settings.openRouterApiKey || settings.redactionRules.length),
            },
            {
              key: "language",
              label: t("backup.language"),
              hint: t(settings.language === "de" ? "settings.languageGerman" : "settings.languageEnglish"),
              available: true,
            },
          ]}
          selection={exportSelection}
          onChange={setExportSelection}
          onCancel={() => setExportOpen(false)}
          onConfirm={() => void handleExportConfirm()}
          emptyLabel={t("backup.notAvailableExport")}
          nothingSelected={t("backup.nothingSelected")}
        />
      )}

      {/* Import selection dialog */}
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
            { key: "ai", label: t("backup.ai"), hint: "", available: importState.info.hasAi },
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
          nothingSelected={t("backup.nothingSelected")}
        />
      )}

      {/* Off-screen render for PDF export */}
      {exportReport && (
        <div
          ref={exportRef}
          aria-hidden
          style={{
            position: "fixed",
            top: 0,
            left: -100000,
            width: SLIDE_WIDTH,
            height: SLIDE_HEIGHT,
            pointerEvents: "none",
          }}
        >
          {exportSlide !== null && <SlideRenderer report={exportReport} slideIndex={exportSlide} />}
        </div>
      )}
    </main>
  );
}

interface SelectionRow {
  key: keyof SnapshotSelection;
  label: string;
  hint: string;
  available: boolean;
}

interface SelectionDialogProps {
  title: string;
  desc: string;
  confirmLabel: string;
  rows: SelectionRow[];
  selection: SnapshotSelection;
  onChange: (selection: SnapshotSelection) => void;
  onCancel: () => void;
  onConfirm: () => void;
  emptyLabel: string;
  nothingSelected: string;
}

function SelectionDialog({
  title,
  desc,
  confirmLabel,
  rows,
  selection,
  onChange,
  onCancel,
  onConfirm,
  emptyLabel,
  nothingSelected,
}: SelectionDialogProps) {
  const t = useT();
  const anySelected = rows.some((row) => row.available && selection[row.key]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mb-4 text-sm text-slate-500">{desc}</p>

        <div className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <label
              key={row.key}
              className={`flex items-center gap-3 rounded-lg border p-3 ${
                row.available
                  ? "cursor-pointer border-slate-200 hover:bg-slate-50"
                  : "border-slate-100 opacity-50"
              }`}
            >
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 accent-primary"
                checked={row.available && selection[row.key]}
                disabled={!row.available}
                onChange={(e) => onChange({ ...selection, [row.key]: e.target.checked })}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-800">{row.label}</span>
                <span className="block truncate text-xs text-slate-400">
                  {row.available ? row.hint : emptyLabel}
                </span>
              </span>
            </label>
          ))}
        </div>

        {!anySelected && <p className="mt-3 text-sm text-amber-600">{nothingSelected}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="cbr-btn cbr-btn-ghost" onClick={onCancel}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="cbr-btn cbr-btn-primary"
            onClick={onConfirm}
            disabled={!anySelected}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
      <div className="fixed inset-0 -z-10" onClick={onCancel} />
    </div>
  );
}
