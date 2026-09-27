import type { AppSettings, Report } from "@/types";
import { createId, normalizeReport, reportSortValue } from "@/lib/reportFactory";
import { normalizeSettings } from "@/lib/settingsDefaults";
import { IS_DEV_CHANNEL } from "@/lib/channel";

// Dev and prod share an origin on GitHub Pages, so dev gets its own database.
const DB_NAME = IS_DEV_CHANNEL ? "cyber-board-reports-local-dev" : "cyber-board-reports-local";
const DB_VERSION = 1;
const REPORT_STORE = "reports";
const SETTINGS_STORE = "settings";
const PROFILE_KEY = "profile";
const SETTINGS_KEY = "app-settings";
const SNAPSHOT_VERSION = 1;

// Earlier versions fell back to localStorage when IndexedDB failed. That data
// is migrated into IndexedDB once on startup and then removed.
const LEGACY_FALLBACK_KEY = "cyber-board-reports:fallback:v1";
const LEGACY_SETTINGS_KEY = "cyber-board-reports:settings:v1";

export interface LocalProfile {
  displayName: string;
  updatedAt: string;
}

export interface AppSnapshot {
  version: number;
  exportedAt: string;
  profile: LocalProfile;
  reports: Report[];
  /** App settings (language, AI config, redaction rules, logo). */
  settings: AppSettings;
}

export interface ImportResult {
  reportsImported: number;
  profileImported: boolean;
  settingsImported: boolean;
}

/** Which parts of a snapshot to export or import. */
export interface SnapshotSelection {
  reports: boolean;
  name: boolean;
  logo: boolean;
  primaryColor: boolean;
  /** AI model and redaction rules (not the API key). */
  ai: boolean;
  /** The OpenRouter API key. Off by default: backups are often shared. */
  apiKey: boolean;
  language: boolean;
}

/** What a snapshot file actually contains, for the import picker. */
export interface SnapshotInfo {
  reportsCount: number;
  name: string | null;
  hasLogo: boolean;
  hasPrimaryColor: boolean;
  hasAi: boolean;
  hasApiKey: boolean;
  hasLanguage: boolean;
  language: string | null;
  /** AI settings in the file, shown so the user can review them before import. */
  aiModel: string | null;
  redactionKeywords: string[];
}

/** Everything except the API key. */
export const DEFAULT_SELECTION: SnapshotSelection = {
  reports: true,
  name: true,
  logo: true,
  primaryColor: true,
  ai: true,
  apiKey: false,
  language: true,
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function defaultProfile(): LocalProfile {
  return {
    displayName: "Local User",
    updatedAt: new Date().toISOString(),
  };
}

// ── IndexedDB ─────────────────────────────────────────────────────────────

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new StorageError("unavailable"));
  }

  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(REPORT_STORE)) {
          db.createObjectStore(REPORT_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: "key" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new StorageError("open", request.error));
      request.onblocked = () => reject(new StorageError("blocked"));
    })
      .then(async (db) => {
        try {
          // The legacy data belongs to production; dev must not take it.
          if (!IS_DEV_CHANNEL) await migrateLegacyLocalStorage(db);
        } catch (error) {
          // Keep the legacy copy in place and try again on the next start.
          console.warn("Could not migrate legacy localStorage data.", error);
        }
        return db;
      })
      .catch((error: unknown) => {
        // Allow a later call to retry instead of caching the failure forever.
        dbPromise = null;
        throw error;
      });
  }

  return dbPromise;
}

/** Error with a stable `code` the UI can translate. */
export class StorageError extends Error {
  constructor(
    public readonly code: "unavailable" | "open" | "blocked" | "quota" | "failed",
    cause?: unknown,
  ) {
    super(`Local storage error: ${code}`, { cause });
    this.name = "StorageError";
  }
}

function toStorageError(error: unknown): StorageError {
  if (error instanceof StorageError) {
    return error;
  }
  if (error instanceof DOMException && error.name === "QuotaExceededError") {
    return new StorageError("quota", error);
  }
  return new StorageError("failed", error);
}

/**
 * Run `fn` inside one transaction and resolve with the value of the request
 * it returns once the transaction has committed.
 */
async function tx<T>(
  stores: string | string[],
  mode: IDBTransactionMode,
  fn: (transaction: IDBTransaction) => IDBRequest<T> | void,
): Promise<T> {
  const db = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    let transaction: IDBTransaction;
    try {
      transaction = db.transaction(stores, mode);
    } catch (error) {
      reject(toStorageError(error));
      return;
    }
    const request = fn(transaction);
    transaction.oncomplete = () => resolve(request ? request.result : (undefined as T));
    transaction.onerror = () => reject(toStorageError(transaction.error));
    transaction.onabort = () => reject(toStorageError(transaction.error));
  });
}

async function migrateLegacyLocalStorage(db: IDBDatabase): Promise<void> {
  let reportsRaw: string | null;
  let settingsRaw: string | null;
  try {
    reportsRaw = localStorage.getItem(LEGACY_FALLBACK_KEY);
    settingsRaw = localStorage.getItem(LEGACY_SETTINGS_KEY);
  } catch {
    return;
  }
  if (!reportsRaw && !settingsRaw) {
    return;
  }

  const legacy = safeParse(reportsRaw) as { reports?: unknown; profile?: unknown } | null;
  const reports = Array.isArray(legacy?.reports) ? legacy.reports : [];
  const settings = safeParse(settingsRaw);

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([REPORT_STORE, SETTINGS_STORE], "readwrite");
    const reportStore = transaction.objectStore(REPORT_STORE);
    const settingStore = transaction.objectStore(SETTINGS_STORE);
    for (const report of reports) {
      // `add` never overwrites data that already exists in IndexedDB.
      reportStore.add(normalizeReport(report)).onerror = (event) => event.preventDefault();
    }
    if (isRecord(legacy?.profile)) {
      settingStore.add({ key: PROFILE_KEY, value: legacy.profile }).onerror = (event) =>
        event.preventDefault();
    }
    if (isRecord(settings)) {
      settingStore.add({ key: SETTINGS_KEY, value: normalizeSettings(settings) }).onerror = (
        event,
      ) => event.preventDefault();
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  localStorage.removeItem(LEGACY_FALLBACK_KEY);
  localStorage.removeItem(LEGACY_SETTINGS_KEY);
}

function safeParse(raw: string | null): unknown {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function getSetting<T>(key: string): Promise<T | null> {
  const record = await tx<{ key: string; value: T } | undefined>(SETTINGS_STORE, "readonly", (t) =>
    t.objectStore(SETTINGS_STORE).get(key),
  );
  return record ? record.value : null;
}

async function putSetting<T>(key: string, value: T): Promise<void> {
  await tx(SETTINGS_STORE, "readwrite", (t) => t.objectStore(SETTINGS_STORE).put({ key, value }));
}

/**
 * Ask the browser not to evict this origin's data under storage pressure.
 * Without it, IndexedDB is "best effort" and can be cleared silently.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) {
    return false;
  }
  try {
    return (await navigator.storage.persisted()) || (await navigator.storage.persist());
  } catch {
    return false;
  }
}

// ── Reports ───────────────────────────────────────────────────────────────

function sortReports(reports: Report[]): Report[] {
  return [...reports].sort((a, b) => reportSortValue(b).localeCompare(reportSortValue(a)));
}

export async function listReports(): Promise<Report[]> {
  const stored = await tx<unknown[]>(REPORT_STORE, "readonly", (t) =>
    t.objectStore(REPORT_STORE).getAll(),
  );
  return sortReports(stored.map((report) => normalizeReport(report as Partial<Report>)));
}

export async function getReport(id: string): Promise<Report | null> {
  const stored = await tx<unknown>(REPORT_STORE, "readonly", (t) =>
    t.objectStore(REPORT_STORE).get(id),
  );
  return stored ? normalizeReport(stored as Partial<Report>) : null;
}

export async function saveReport(report: Report): Promise<Report> {
  const normalized = normalizeReport({
    ...report,
    updatedAt: report.updatedAt || new Date().toISOString(),
  });
  await tx(REPORT_STORE, "readwrite", (t) => t.objectStore(REPORT_STORE).put(normalized));
  return normalized;
}

export async function deleteReport(id: string): Promise<void> {
  await tx(REPORT_STORE, "readwrite", (t) => t.objectStore(REPORT_STORE).delete(id));
}

export async function renameReportAuthor(oldName: string, newName: string): Promise<void> {
  const reports = await listReports();
  const now = new Date().toISOString();
  await tx(REPORT_STORE, "readwrite", (t) => {
    const store = t.objectStore(REPORT_STORE);
    for (const report of reports) {
      if (report.createdBy === oldName) {
        store.put({ ...report, createdBy: newName, updatedAt: now });
      }
    }
  });
}

// ── Profile & settings ────────────────────────────────────────────────────

export async function getProfile(): Promise<LocalProfile> {
  const profile = await getSetting<LocalProfile>(PROFILE_KEY);
  if (profile) {
    return { ...defaultProfile(), ...profile };
  }
  return saveProfile(defaultProfile());
}

export async function saveProfile(profile: LocalProfile): Promise<LocalProfile> {
  const normalized: LocalProfile = {
    displayName: profile.displayName.trim() || "Local User",
    updatedAt: new Date().toISOString(),
  };
  await putSetting(PROFILE_KEY, normalized);
  return normalized;
}

export async function getSettings(): Promise<AppSettings> {
  return normalizeSettings(await getSetting<AppSettings>(SETTINGS_KEY));
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  const normalized = normalizeSettings({ ...settings, updatedAt: new Date().toISOString() });
  await putSetting(SETTINGS_KEY, normalized);
  return normalized;
}

export async function clearLocalData(): Promise<void> {
  await tx([REPORT_STORE, SETTINGS_STORE], "readwrite", (t) => {
    t.objectStore(REPORT_STORE).clear();
    t.objectStore(SETTINGS_STORE).clear();
  });
}

// ── Backup / import ───────────────────────────────────────────────────────

export async function exportSnapshot(
  selection: SnapshotSelection = DEFAULT_SELECTION,
): Promise<AppSnapshot> {
  const [fullProfile, fullSettings, reports] = await Promise.all([
    getProfile(),
    getSettings(),
    selection.reports ? listReports() : Promise.resolve([]),
  ]);

  return {
    version: SNAPSHOT_VERSION,
    exportedAt: new Date().toISOString(),
    profile: {
      displayName: selection.name ? fullProfile.displayName : "",
      updatedAt: fullProfile.updatedAt,
    },
    reports,
    settings: {
      language: fullSettings.language,
      openRouterApiKey: selection.apiKey ? fullSettings.openRouterApiKey : "",
      openRouterModel: selection.ai ? fullSettings.openRouterModel : "",
      redactionRules: selection.ai ? fullSettings.redactionRules : [],
      logo: selection.logo ? fullSettings.logo : "",
      primaryColor: selection.primaryColor ? fullSettings.primaryColor : "",
      lastBackupAt: "",
      updatedAt: fullSettings.updatedAt,
    },
  };
}

function snapshotParts(payload: unknown) {
  const candidate = isRecord(payload) ? payload : {};
  const reports: unknown[] = Array.isArray(candidate.reports)
    ? candidate.reports
    : isReportLike(candidate)
      ? [candidate]
      : [];
  const settings = isRecord(candidate.settings) ? (candidate.settings as Partial<AppSettings>) : null;
  const profile = isRecord(candidate.profile) ? candidate.profile : null;
  return { reports, settings, profile };
}

/** Inspect a parsed snapshot/report file and report what it can restore. */
export function analyzeSnapshot(payload: unknown): SnapshotInfo {
  const { reports, settings, profile } = snapshotParts(payload);
  const name = typeof profile?.displayName === "string" ? profile.displayName.trim() || null : null;
  const language =
    settings?.language === "en" || settings?.language === "de" ? settings.language : null;
  const aiModel =
    typeof settings?.openRouterModel === "string" && settings.openRouterModel.trim()
      ? settings.openRouterModel.trim()
      : null;
  const redactionKeywords = Array.isArray(settings?.redactionRules)
    ? settings.redactionRules
        .map((rule) => (isRecord(rule) && typeof rule.keyword === "string" ? rule.keyword : ""))
        .filter(Boolean)
    : [];

  return {
    reportsCount: reports.length,
    name,
    hasLogo: typeof settings?.logo === "string" && settings.logo.startsWith("data:image/"),
    hasPrimaryColor: typeof settings?.primaryColor === "string" && HEX_COLOR.test(settings.primaryColor),
    hasAi: Boolean(aiModel || redactionKeywords.length),
    hasApiKey: typeof settings?.openRouterApiKey === "string" && Boolean(settings.openRouterApiKey.trim()),
    hasLanguage: language !== null,
    language,
    aiModel,
    redactionKeywords,
  };
}

export async function importSnapshotPayload(
  payload: unknown,
  selection: SnapshotSelection,
): Promise<ImportResult> {
  const { reports, settings: incoming, profile } = snapshotParts(payload);

  // A backup may legitimately omit reports (e.g. a settings-only export).
  // Only reject files with nothing we can restore.
  if (reports.length === 0 && !incoming) {
    throw new Error("import.nothing");
  }

  let imported = 0;
  if (selection.reports && reports.length > 0) {
    const existingIds = new Set((await listReports()).map((report) => report.id));
    const now = new Date().toISOString();
    const toSave = reports.map((reportInput) => {
      const report = normalizeReport(reportInput as Partial<Report>);
      const reportId = existingIds.has(report.id) ? createId() : report.id;
      existingIds.add(reportId);
      return { ...report, id: reportId, updatedAt: now };
    });
    await tx(REPORT_STORE, "readwrite", (t) => {
      const store = t.objectStore(REPORT_STORE);
      toSave.forEach((report) => store.put(report));
    });
    imported = toSave.length;
  }

  let profileImported = false;
  if (selection.name && typeof profile?.displayName === "string" && profile.displayName.trim()) {
    await saveProfile({ displayName: profile.displayName, updatedAt: new Date().toISOString() });
    profileImported = true;
  }

  // Restore only the selected settings fields. Fields that are absent or blank
  // (e.g. an API key stripped before sharing) leave the current value alone.
  let settingsImported = false;
  if (incoming) {
    const patch: Partial<AppSettings> = {};
    if (selection.language && (incoming.language === "en" || incoming.language === "de")) {
      patch.language = incoming.language;
    }
    if (selection.ai) {
      if (typeof incoming.openRouterModel === "string" && incoming.openRouterModel.trim()) {
        patch.openRouterModel = incoming.openRouterModel;
      }
      if (Array.isArray(incoming.redactionRules)) {
        patch.redactionRules = incoming.redactionRules;
      }
    }
    if (
      selection.apiKey &&
      typeof incoming.openRouterApiKey === "string" &&
      incoming.openRouterApiKey.trim()
    ) {
      patch.openRouterApiKey = incoming.openRouterApiKey;
    }
    if (selection.logo && typeof incoming.logo === "string" && incoming.logo.startsWith("data:image/")) {
      patch.logo = incoming.logo;
    }
    if (
      selection.primaryColor &&
      typeof incoming.primaryColor === "string" &&
      HEX_COLOR.test(incoming.primaryColor)
    ) {
      patch.primaryColor = incoming.primaryColor;
    }
    if (Object.keys(patch).length > 0) {
      await saveSettings(normalizeSettings({ ...(await getSettings()), ...patch }));
      settingsImported = true;
    }
  }

  return { reportsImported: imported, profileImported, settingsImported };
}

function isReportLike(value: Record<string, unknown>): boolean {
  return "quarter" in value && "year" in value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
