import { HardDriveDownload } from "lucide-react";
import { formatDate, useLanguage, useT } from "@/lib/i18n";

export const BACKUP_REMINDER_DAYS = 14;

/** True when reports exist and no backup was made in the last two weeks. */
export function backupOverdue(lastBackupAt: string, reportCount: number, now = Date.now()): boolean {
  if (reportCount === 0) return false;
  const last = Date.parse(lastBackupAt);
  return Number.isNaN(last) || now - last > BACKUP_REMINDER_DAYS * 24 * 60 * 60 * 1000;
}

export function BackupReminder({ lastBackupAt, onBackup }: { lastBackupAt: string; onBackup: () => void }) {
  const t = useT();
  const lang = useLanguage();
  const never = Number.isNaN(Date.parse(lastBackupAt));
  return (
    <div
      role="note"
      className="mb-5 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
    >
      <span className="flex items-start gap-2">
        <HardDriveDownload size={16} className="mt-0.5 shrink-0" aria-hidden />
        {never ? t("backup.reminderNever") : t("backup.reminder", { date: formatDate(lastBackupAt, lang) })}
      </span>
      <button className="cbr-btn cbr-btn-outline cbr-btn-sm shrink-0" onClick={onBackup}>
        {t("backup.backupNow")}
      </button>
    </div>
  );
}
