import type { Report } from "@/types";
import { createId, normalizeReport, reportSortValue } from "@/lib/reportFactory";

const DB_NAME = "cyber-board-reports-local";
const DB_VERSION = 1;
const REPORT_STORE = "reports";
const SETTINGS_STORE = "settings";
const PROFILE_KEY = "profile";
const FALLBACK_KEY = "cyber-board-reports:fallback:v1";
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
}

interface SettingRecord<T = unknown> {
  key: string;
  value: T;
}

export interface ImportResult {
  reportsImported: number;
  profileImported: boolean;
}

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

function readFallbackSnapshot(): AppSnapshot {
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
    const parsed = JSON.parse(raw) as Partial<AppSnapshot>;
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

function writeFallbackSnapshot(snapshot: AppSnapshot): void {
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
}

export async function exportSnapshot(): Promise<AppSnapshot> {
  return {
    version: SNAPSHOT_VERSION,
    exportedAt: new Date().toISOString(),
    profile: await getProfile(),
    reports: await listReports(),
  };
}

export async function importSnapshotPayload(payload: unknown): Promise<ImportResult> {
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

  if (reports.length === 0) {
    throw new Error("The selected file does not contain report data.");
  }

  let imported = 0;
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

  const incomingProfile = snapshotCandidate.profile;
  if (incomingProfile?.displayName) {
    await saveProfile({
      displayName: incomingProfile.displayName,
      updatedAt: new Date().toISOString(),
    });
  }

  return {
    reportsImported: imported,
    profileImported: Boolean(incomingProfile?.displayName),
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
