import { useState } from "react";
import { useT } from "@/lib/i18n";
import { useSettings } from "@/lib/settings";
import { backupFilename, downloadJson } from "@/lib/files";
import { DEFAULT_SELECTION, exportSnapshot, type SnapshotSelection } from "@/lib/storage";
import { RowWarning, SelectionDialog } from "./SelectionDialog";

interface BackupExportDialogProps {
  reportCount: number;
  displayName: string;
  onClose: () => void;
  onError: (error: unknown) => void;
}

/** Choose what to include in a JSON backup, then download it. */
export function BackupExportDialog({ reportCount, displayName, onClose, onError }: BackupExportDialogProps) {
  const t = useT();
  const { settings, update } = useSettings();
  const [selection, setSelection] = useState<SnapshotSelection>(DEFAULT_SELECTION);

  const confirm = async () => {
    try {
      downloadJson(backupFilename(), await exportSnapshot(selection));
      if (selection.reports) {
        await update({ lastBackupAt: new Date().toISOString() });
      }
      onClose();
    } catch (error) {
      onError(error);
    }
  };

  return (
    <SelectionDialog
      title={t("backup.exportTitle")}
      desc={t("backup.exportDesc")}
      confirmLabel={t("backup.export")}
      rows={[
        {
          key: "reports",
          label: t("backup.reports"),
          hint: t("backup.reportsCount", { count: reportCount }),
          available: reportCount > 0,
        },
        { key: "name", label: t("backup.name"), hint: displayName, available: Boolean(displayName) },
        { key: "logo", label: t("backup.logo"), hint: "", available: Boolean(settings.logo) },
        {
          key: "primaryColor",
          label: t("backup.primaryColor"),
          hint: settings.primaryColor.toUpperCase(),
          available: Boolean(settings.primaryColor),
        },
        {
          key: "ai",
          label: t("backup.ai"),
          hint: settings.openRouterModel,
          available: Boolean(settings.openRouterModel || settings.redactionRules.length),
        },
        {
          key: "apiKey",
          label: t("backup.apiKey"),
          hint: t("backup.apiKeyHint"),
          available: Boolean(settings.openRouterApiKey.trim()),
          detail: <RowWarning>{t("backup.apiKeyWarning")}</RowWarning>,
        },
        {
          key: "language",
          label: t("backup.language"),
          hint: t(settings.language === "de" ? "settings.languageGerman" : "settings.languageEnglish"),
          available: true,
        },
      ]}
      selection={selection}
      onChange={setSelection}
      onCancel={onClose}
      onConfirm={() => void confirm()}
      emptyLabel={t("backup.notAvailableExport")}
    />
  );
}
