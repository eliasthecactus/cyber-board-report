import type { AppSettings, Report } from "@/types";
import { createId, normalizeReport, reportSortValue } from "@/lib/reportFactory";
import { normalizeSettings } from "@/lib/settingsDefaults";

const DB_NAME = "cyber-board-reports-local";
const DB_VERSION = 1;
const REPORT_STORE = "reports";
const SETTINGS_STORE = "settings";
const PROFILE_KEY = "profile";
const SETTINGS_KEY = "app-settings";
const FALLBACK_KEY = "cyber-board-reports:fallback:v1";
const SETTINGS_FALLBACK_KEY = "cyber-board-reports:settings:v1";
const SNAPSHOT_VERSION = 1;

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

/** The localStorage fallback only mirrors reports and profile; settings live under their own key. */
type FallbackSnapshot = Omit<AppSnapshot, "settings">;

interface SettingRecord<T = unknown> {
  key: string;
  value: T;
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
  ai: boolean;
}

/** What a snapshot file actually contains, for the import picker. */
export interface SnapshotInfo {
  reportsCount: number;
  name: string | null;
  hasLogo: boolean;
  hasPrimaryColor: boolean;
  hasAi: boolean;
}

export const FULL_SELECTION: SnapshotSelection = {
  reports: true,
  name: true,
  logo: true,
  primaryColor: true,
  ai: true,
};

function defaultProfile(): LocalProfile {
  return {
    displayName: "Local User",
    updatedAt: new Date().toISOString(),
  };
}

function hasIndexedDB(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (!hasIndexedDB()) {
    return Promise.reject(new Error("IndexedDB is not available"));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

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
      request.onerror = () => reject(request.error || new Error("Failed to open IndexedDB"));
      request.onblocked = () => reject(new Error("IndexedDB upgrade blocked by another tab"));
    });
  }

  return dbPromise;
}

function readFallbackSnapshot(): FallbackSnapshot {
  const raw = window.localStorage.getItem(FALLBACK_KEY);
  if (!raw) {
    return {
      version: SNAPSHOT_VERSION,
      exportedAt: new Date().toISOString(),
      profile: defaultProfile(),
      reports: [],
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<FallbackSnapshot>;
    return {
      version: Number(parsed.version || SNAPSHOT_VERSION),
      exportedAt: parsed.exportedAt || new Date().toISOString(),
      profile: {
        ...defaultProfile(),
        ...(parsed.profile || {}),
      },
      reports: Array.isArray(parsed.reports)
        ? parsed.reports.map((report) => normalizeReport(report))
        : [],
    };
  } catch {
    return {
      version: SNAPSHOT_VERSION,
      exportedAt: new Date().toISOString(),
      profile: defaultProfile(),
      reports: [],
    };
  }
}

function writeFallbackSnapshot(snapshot: FallbackSnapshot): void {
  window.localStorage.setItem(FALLBACK_KEY, JSON.stringify(snapshot));
}

async function idbGetAllReports(): Promise<Report[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const request = db
      .transaction(REPORT_STORE, "readonly")
      .objectStore(REPORT_STORE)
      .getAll();

    request.onsuccess = () => {
      resolve((request.result as Partial<Report>[]).map((report) => normalizeReport(report)));
    };
    request.onerror = () => reject(request.error || new Error("Failed to load reports"));
  });
}

async function idbGetReport(id: string): Promise<Report | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const request = db
      .transaction(REPORT_STORE, "readonly")
      .objectStore(REPORT_STORE)
      .get(id);

    request.onsuccess = () => {
      resolve(request.result ? normalizeReport(request.result as Partial<Report>) : null);
    };
    request.onerror = () => reject(request.error || new Error("Failed to load report"));
  });
}

async function idbSaveReport(report: Report): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const request = db
      .transaction(REPORT_STORE, "readwrite")
      .objectStore(REPORT_STORE)
      .put(normalizeReport(report));

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error("Failed to save report"));
  });
}

async function idbDeleteReport(id: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const request = db
      .transaction(REPORT_STORE, "readwrite")
      .objectStore(REPORT_STORE)
      .delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error("Failed to delete report"));
  });
}

async function idbGetSetting<T>(key: string): Promise<T | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const request = db
      .transaction(SETTINGS_STORE, "readonly")
      .objectStore(SETTINGS_STORE)
      .get(key);

    request.onsuccess = () => {
      const record = request.result as SettingRecord<T> | undefined;
      resolve(record ? record.value : null);
    };
    request.onerror = () => reject(request.error || new Error("Failed to load setting"));
  });
}

async function idbSaveSetting<T>(key: string, value: T): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const request = db
      .transaction(SETTINGS_STORE, "readwrite")
      .objectStore(SETTINGS_STORE)
      .put({ key, value } satisfies SettingRecord<T>);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error("Failed to save setting"));
  });
}

async function idbClearAll(): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([REPORT_STORE, SETTINGS_STORE], "readwrite");
    tx.objectStore(REPORT_STORE).clear();
    tx.objectStore(SETTINGS_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Failed to clear local data"));
  });
}

function sortReports(reports: Report[]): Report[] {
  return [...reports].sort((a, b) => reportSortValue(b).localeCompare(reportSortValue(a)));
}

async function useStorage<T>(idbAction: () => Promise<T>, fallbackAction: () => T): Promise<T> {
  if (!hasIndexedDB()) {
    return fallbackAction();
  }

  try {
    return await idbAction();
  } catch (error) {
    console.warn("IndexedDB unavailable, using localStorage fallback.", error);
    return fallbackAction();
  }
}

export async function listReports(): Promise<Report[]> {
  return useStorage(
    async () => sortReports(await idbGetAllReports()),
    () => sortReports(readFallbackSnapshot().reports),
  );
}

export async function getReport(id: string): Promise<Report | null> {
  return useStorage(
    () => idbGetReport(id),
    () => readFallbackSnapshot().reports.find((report) => report.id === id) || null,
  );
}

export async function saveReport(report: Report): Promise<Report> {
  const normalized = normalizeReport({
    ...report,
    updatedAt: report.updatedAt || new Date().toISOString(),
  });

  await useStorage(
    () => idbSaveReport(normalized),
    () => {
      const snapshot = readFallbackSnapshot();
      const reports = snapshot.reports.filter((item) => item.id !== normalized.id);
      writeFallbackSnapshot({ ...snapshot, reports: [...reports, normalized] });
    },
  );

  return normalized;
}

export async function deleteReport(id: string): Promise<void> {
  await useStorage(
    () => idbDeleteReport(id),
    () => {
      const snapshot = readFallbackSnapshot();
      writeFallbackSnapshot({
        ...snapshot,
        reports: snapshot.reports.filter((report) => report.id !== id),
      });
    },
  );
}

export async function getProfile(): Promise<LocalProfile> {
  const profile = await useStorage(
    () => idbGetSetting<LocalProfile>(PROFILE_KEY),
    () => readFallbackSnapshot().profile,
  );

  if (profile) {
    return {
      ...defaultProfile(),
      ...profile,
    };
  }

  const created = defaultProfile();
  await saveProfile(created);
  return created;
}

export async function saveProfile(profile: LocalProfile): Promise<LocalProfile> {
  const normalized: LocalProfile = {
    displayName: profile.displayName.trim() || "Local User",
    updatedAt: new Date().toISOString(),
  };

  await useStorage(
    () => idbSaveSetting(PROFILE_KEY, normalized),
    () => {
      const snapshot = readFallbackSnapshot();
      writeFallbackSnapshot({ ...snapshot, profile: normalized });
    },
  );

  return normalized;
}

function readFallbackSettings(): AppSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_FALLBACK_KEY);
    return normalizeSettings(raw ? (JSON.parse(raw) as Partial<AppSettings>) : null);
  } catch {
    return normalizeSettings(null);
  }
}

export async function getSettings(): Promise<AppSettings> {
  const stored = await useStorage(
    () => idbGetSetting<AppSettings>(SETTINGS_KEY),
    () => readFallbackSettings(),
  );
  return normalizeSettings(stored);
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  const normalized = normalizeSettings({ ...settings, updatedAt: new Date().toISOString() });

  await useStorage(
    () => idbSaveSetting(SETTINGS_KEY, normalized),
    () => window.localStorage.setItem(SETTINGS_FALLBACK_KEY, JSON.stringify(normalized)),
  );

  return normalized;
}

export async function renameReportAuthor(oldName: string, newName: string): Promise<void> {
  const reports = await listReports();
  await Promise.all(
    reports
      .filter((report) => report.createdBy === oldName)
      .map((report) =>
        saveReport({
          ...report,
          createdBy: newName,
          updatedAt: new Date().toISOString(),
        }),
      ),
  );
}

export async function clearLocalData(): Promise<void> {
  await useStorage(
    () => idbClearAll(),
    () => {
      window.localStorage.removeItem(FALLBACK_KEY);
    },
  );
  window.localStorage.removeItem(FALLBACK_KEY);
  window.localStorage.removeItem(SETTINGS_FALLBACK_KEY);
}

export async function exportSnapshot(
  selection: SnapshotSelection = FULL_SELECTION,
): Promise<AppSnapshot> {
  const fullProfile = await getProfile();
  const fullSettings = await getSettings();

  return {
    version: SNAPSHOT_VERSION,
    exportedAt: new Date().toISOString(),
    profile: {
      displayName: selection.name ? fullProfile.displayName : "",
      updatedAt: fullProfile.updatedAt,
    },
    reports: selection.reports ? await listReports() : [],
    settings: {
      language: fullSettings.language,
      openRouterApiKey: selection.ai ? fullSettings.openRouterApiKey : "",
      openRouterModel: selection.ai ? fullSettings.openRouterModel : "",
      redactionRules: selection.ai ? fullSettings.redactionRules : [],
      logo: selection.logo ? fullSettings.logo : "",
      primaryColor: selection.primaryColor ? fullSettings.primaryColor : "",
      updatedAt: fullSettings.updatedAt,
    },
  };
}

/** Inspect a parsed snapshot/report file and report what it can restore. */
export function analyzeSnapshot(payload: unknown): SnapshotInfo {
  const candidate = isRecord(payload)
    ? (payload as Partial<AppSnapshot> | Partial<Report>)
    : {};
  const snapshotCandidate = candidate as Partial<AppSnapshot>;
  const reports = Array.isArray(snapshotCandidate.reports)
    ? (snapshotCandidate.reports as Partial<Report>[])
    : isReportLike(candidate)
      ? [candidate as Partial<Report>]
      : [];
  const settings = isRecord(snapshotCandidate.settings)
    ? (snapshotCandidate.settings as Partial<AppSettings>)
    : null;
  const name = snapshotCandidate.profile?.displayName?.trim() || null;

  return {
    reportsCount: reports.length,
    name,
    hasLogo: Boolean(settings && typeof settings.logo === "string" && settings.logo),
    hasPrimaryColor: Boolean(
      settings &&
        typeof settings.primaryColor === "string" &&
        /^#[0-9a-fA-F]{6}$/.test(settings.primaryColor),
    ),
    hasAi: Boolean(
      settings &&
        ((typeof settings.openRouterApiKey === "string" && settings.openRouterApiKey.trim()) ||
          (typeof settings.openRouterModel === "string" && settings.openRouterModel.trim()) ||
          (Array.isArray(settings.redactionRules) && settings.redactionRules.length > 0)),
    ),
  };
}

export async function importSnapshotPayload(
  payload: unknown,
  selection: SnapshotSelection = FULL_SELECTION,
): Promise<ImportResult> {
  const existing = await listReports();
  const existingIds = new Set(existing.map((report) => report.id));

  const candidate = isRecord(payload)
    ? (payload as Partial<AppSnapshot> | Partial<Report>)
    : {};
  const snapshotCandidate = candidate as Partial<AppSnapshot>;
  const reports = Array.isArray(snapshotCandidate.reports)
    ? (snapshotCandidate.reports as Partial<Report>[])
    : isReportLike(candidate)
      ? [candidate as Partial<Report>]
      : [];

  const hasSettings = isRecord(snapshotCandidate.settings);

  // A backup may legitimately omit reports (e.g. a settings-only export, or a
  // file the user trimmed down). Only reject files with nothing we can restore.
  if (reports.length === 0 && !hasSettings) {
    throw new Error("The selected file does not contain report or settings data.");
  }

  let imported = 0;
  if (selection.reports) {
    for (const reportInput of reports) {
      const report = normalizeReport(reportInput);
      const id = existingIds.has(report.id) ? createId() : report.id;
      existingIds.add(id);

      await saveReport({
        ...report,
        id,
        updatedAt: new Date().toISOString(),
      });
      imported += 1;
    }
  }

  const incomingProfile = snapshotCandidate.profile;
  let profileImported = false;
  if (selection.name && incomingProfile?.displayName) {
    await saveProfile({
      displayName: incomingProfile.displayName,
      updatedAt: new Date().toISOString(),
    });
    profileImported = true;
  }

  // Restore only the selected settings fields. Fields that are absent or blank
  // (e.g. an API key the user deliberately stripped before sharing) are left
  // untouched rather than wiping the current value.
  let settingsImported = false;
  if (hasSettings) {
    const incoming = snapshotCandidate.settings as Partial<AppSettings>;
    const current = await getSettings();
    const patch: Partial<AppSettings> = {};
    if (selection.ai) {
      if (typeof incoming.openRouterApiKey === "string" && incoming.openRouterApiKey.trim()) {
        patch.openRouterApiKey = incoming.openRouterApiKey;
      }
      if (typeof incoming.openRouterModel === "string" && incoming.openRouterModel.trim()) {
        patch.openRouterModel = incoming.openRouterModel;
      }
      if (Array.isArray(incoming.redactionRules)) {
        patch.redactionRules = incoming.redactionRules;
      }
    }
    if (selection.logo && typeof incoming.logo === "string" && incoming.logo) {
      patch.logo = incoming.logo;
    }
    if (
      selection.primaryColor &&
      typeof incoming.primaryColor === "string" &&
      /^#[0-9a-fA-F]{6}$/.test(incoming.primaryColor)
    ) {
      patch.primaryColor = incoming.primaryColor;
    }
    if (Object.keys(patch).length > 0) {
      await saveSettings(normalizeSettings({ ...current, ...patch }));
      settingsImported = true;
    }
  }

  return {
    reportsImported: imported,
    profileImported,
    settingsImported,
  };
}

function isReportLike(value: Partial<AppSnapshot> | Partial<Report>): value is Partial<Report> {
  return Boolean(
    value &&
      typeof value === "object" &&
      "quarter" in value &&
      "year" in value,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
