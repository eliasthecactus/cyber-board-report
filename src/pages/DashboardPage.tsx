import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import {
  Copy,
  Download,
  Edit2,
  FileJson,
  HardDrive,
  Play,
  Plus,
  Settings,
  Trash2,
  Upload,
} from "lucide-react";
import type { Report } from "@/types";
import { backupFilename, downloadJson, readJsonFile } from "@/lib/files";
import { createEmptyReport, cloneReport } from "@/lib/reportFactory";
import { navigateTo } from "@/lib/navigation";
import { useT } from "@/lib/i18n";
import { useSettings } from "@/lib/settings";
import {
  deleteReport,
  exportSnapshot,
  getProfile,
  importSnapshotPayload,
  listReports,
  saveReport,
  type LocalProfile,
} from "@/lib/storage";

interface CreateFormState {
  quarter: string;
  year: number;
}

const initialFormState = (): CreateFormState => ({
  quarter: "",
  year: new Date().getFullYear(),
});

export default function DashboardPage() {
  const t = useT();
  const { reload: reloadSettings } = useSettings();
  const [reports, setReports] = useState<Report[]>([]);
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<CreateFormState>(initialFormState);
  const [busyReportId, setBusyReportId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

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

  const handleCreateReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.quarter || !profile) {
      return;
    }

    const report = createEmptyReport({
      quarter: formData.quarter,
      year: Number(formData.year),
      createdBy: profile.displayName,
    });

    await saveReport(report);
    setFormData(initialFormState());
    setShowCreateDialog(false);
    navigateTo(`/editor/${encodeURIComponent(report.id)}`);
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

  const handleDuplicate = async (report: Report) => {
    if (!profile) {
      return;
    }

    setBusyReportId(report.id);
    const duplicate = cloneReport(report, profile.displayName);
    await saveReport(duplicate);
    setReports(await listReports());
    setBusyReportId(null);
    setMessage(t("dashboard.duplicated", { quarter: report.quarter, year: report.year }));
  };

  const handleExportAll = async () => {
    const snapshot = await exportSnapshot();
    downloadJson(backupFilename(), snapshot);
  };

  const handleExportReport = (report: Report) => {
    downloadJson(
      backupFilename(`${report.quarter}-${report.year}-board-report`.toLowerCase()),
      report,
    );
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const payload = await readJsonFile(file);
      const result = await importSnapshotPayload(payload);
      if (result.settingsImported) {
        await reloadSettings();
      }
      if (result.reportsImported === 0 && result.settingsImported) {
        setMessage(t("dashboard.importedSettingsOnly"));
      } else {
        const base =
          result.reportsImported === 1
            ? t("dashboard.importedOne")
            : t("dashboard.importedMany", { count: result.reportsImported });
        setMessage(result.settingsImported ? `${base} ${t("dashboard.importedSettings")}` : base);
      }
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("dashboard.importFailed"));
    } finally {
      event.target.value = "";
    }
  };

  if (loading) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg" aria-label={t("common.loading")} />
      </main>
    );
  }

  return (
    <main className="app-shell min-h-screen">
      <header className="border-b border-base-300 bg-base-100/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button className="btn btn-ghost px-2 text-xl font-bold" onClick={() => navigateTo("/")}>
            {t("dashboard.brand")}
          </button>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="hidden items-center gap-2 rounded border border-base-300 px-3 py-2 text-sm text-base-content/70 sm:flex">
              <HardDrive size={16} />
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
              className="btn btn-outline btn-sm gap-2"
              onClick={() => importInputRef.current?.click()}
            >
              <Upload size={16} />
              {t("common.import")}
            </button>
            <button className="btn btn-outline btn-sm gap-2" onClick={handleExportAll}>
              <Download size={16} />
              {t("common.backup")}
            </button>
            <button className="btn btn-ghost btn-sm gap-2" onClick={() => navigateTo("/profile")}>
              <Settings size={16} />
              {t("dashboard.settings")}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-base-content">{t("dashboard.heading")}</h1>
            <p className="mt-1 text-sm text-base-content/60">
              {t("dashboard.signedInAs", { name: profile?.displayName || "Local User" })}
            </p>
          </div>
          <button className="btn btn-primary gap-2" onClick={() => setShowCreateDialog(true)}>
            <Plus size={18} />
            {t("dashboard.createReport")}
          </button>
        </div>

        {message && (
          <div className="alert mb-5 flex items-center justify-between border border-base-300 bg-base-100">
            <span>{message}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setMessage(null)}>
              {t("dashboard.dismiss")}
            </button>
          </div>
        )}

        {reports.length === 0 ? (
          <section className="rounded-lg border border-dashed border-base-300 bg-base-100 p-8 text-center">
            <FileJson className="mx-auto mb-3 text-base-content/40" size={36} />
            <h2 className="text-xl font-semibold">{t("dashboard.noReports")}</h2>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button className="btn btn-primary gap-2" onClick={() => setShowCreateDialog(true)}>
                <Plus size={18} />
                {t("dashboard.createReport")}
              </button>
              <button
                className="btn btn-outline gap-2"
                onClick={() => importInputRef.current?.click()}
              >
                <Upload size={18} />
                {t("dashboard.importBackup")}
              </button>
            </div>
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reports.map((report) => (
              <article
                key={report.id}
                className="rounded-lg border border-base-300 bg-base-100 p-5 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">
                      {report.quarter} {report.year}
                    </h2>
                    <p className="text-sm text-base-content/60">
                      {t("dashboard.updated", {
                        date: new Date(report.updatedAt).toLocaleString(),
                      })}
                    </p>
                  </div>
                  <span className="badge badge-outline shrink-0">{report.createdBy}</span>
                </div>

                <dl className="mb-5 grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded border border-base-300 p-2">
                    <dt className="text-base-content/50">{t("dashboard.risks")}</dt>
                    <dd className="font-semibold">{report.topRisks.length}</dd>
                  </div>
                  <div className="rounded border border-base-300 p-2">
                    <dt className="text-base-content/50">{t("dashboard.kpis")}</dt>
                    <dd className="font-semibold">{report.kpis.length}</dd>
                  </div>
                  <div className="rounded border border-base-300 p-2">
                    <dt className="text-base-content/50">{t("dashboard.decisions")}</dt>
                    <dd className="font-semibold">{report.decisionsRequired.length}</dd>
                  </div>
                </dl>

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    className="btn btn-outline btn-sm gap-1"
                    onClick={() => navigateTo(`/editor/${encodeURIComponent(report.id)}`)}
                  >
                    <Edit2 size={15} />
                    {t("dashboard.edit")}
                  </button>
                  <button
                    className="btn btn-primary btn-sm gap-1"
                    onClick={() => navigateTo(`/slides/${encodeURIComponent(report.id)}`)}
                  >
                    <Play size={15} />
                    {t("dashboard.view")}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    title={t("dashboard.duplicate")}
                    onClick={() => void handleDuplicate(report)}
                    disabled={busyReportId === report.id}
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    title={t("dashboard.exportReport")}
                    onClick={() => handleExportReport(report)}
                  >
                    <Download size={15} />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm text-error"
                    title={t("common.delete")}
                    onClick={() => void handleDelete(report)}
                    disabled={busyReportId === report.id}
                  >
                    {busyReportId === report.id ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showCreateDialog && (
        <div className="modal modal-open">
          <div className="modal-box w-full max-w-md rounded-lg">
            <h2 className="mb-4 text-2xl font-semibold">{t("dashboard.createNewReport")}</h2>
            <form onSubmit={handleCreateReport} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("dashboard.quarter")}</span>
                </label>
                <select
                  value={formData.quarter}
                  onChange={(event) =>
                    setFormData({ ...formData, quarter: event.target.value })
                  }
                  required
                  className="select select-bordered w-full"
                >
                  <option value="">{t("dashboard.selectQuarter")}</option>
                  <option value="Q1">Q1</option>
                  <option value="Q2">Q2</option>
                  <option value="Q3">Q3</option>
                  <option value="Q4">Q4</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("dashboard.year")}</span>
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(event) =>
                    setFormData({ ...formData, year: Number(event.target.value) })
                  }
                  required
                  min="2000"
                  max="2100"
                  className="input input-bordered w-full"
                />
              </div>

              <div className="modal-action gap-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowCreateDialog(false)}
                >
                  {t("common.cancel")}
                </button>
                <button type="submit" className="btn btn-primary" disabled={!formData.quarter}>
                  {t("dashboard.create")}
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowCreateDialog(false)}>{t("common.close")}</button>
          </form>
        </div>
      )}
    </main>
  );
}
