import { beforeEach, describe, expect, it } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { normalizeReport } from "./reportFactory";

// Fresh database and module state for every test.
async function loadStorage() {
  globalThis.indexedDB = new IDBFactory();
  const { vi } = await import("vitest");
  vi.resetModules();
  return import("./storage");
}

describe("storage", () => {
  beforeEach(() => localStorage.clear());

  it("saves, lists and deletes reports", async () => {
    const storage = await loadStorage();
    const report = normalizeReport({ quarter: "Q1", year: 2026 });
    await storage.saveReport(report);
    expect((await storage.listReports()).map((r) => r.id)).toEqual([report.id]);
    expect(await storage.getReport(report.id)).toEqual(report);
    await storage.deleteReport(report.id);
    expect(await storage.listReports()).toEqual([]);
  });

  it("leaves the API key out of backups unless selected", async () => {
    const storage = await loadStorage();
    const settings = await storage.getSettings();
    await storage.saveSettings({ ...settings, openRouterApiKey: "sk-or-secret" });

    const standard = await storage.exportSnapshot();
    expect(standard.settings.openRouterApiKey).toBe("");
    expect(JSON.stringify(standard)).not.toContain("sk-or-secret");

    const withKey = await storage.exportSnapshot({ ...storage.DEFAULT_SELECTION, apiKey: true });
    expect(withKey.settings.openRouterApiKey).toBe("sk-or-secret");
  });

  it("imports only the selected settings and never clobbers existing report ids", async () => {
    const storage = await loadStorage();
    const existing = normalizeReport({ id: "same", quarter: "Q1", year: 2026 });
    await storage.saveReport(existing);

    const payload = {
      reports: [{ ...existing, title: "Imported" }],
      settings: { openRouterApiKey: "sk-attacker", openRouterModel: "x/y", redactionRules: [], language: "de" },
    };
    const result = await storage.importSnapshotPayload(payload, {
      ...storage.DEFAULT_SELECTION,
      ai: false,
      apiKey: false,
    });

    expect(result.reportsImported).toBe(1);
    const reports = await storage.listReports();
    expect(reports).toHaveLength(2);
    expect(reports.find((r) => r.id === "same")?.title).toBe("");
    const settings = await storage.getSettings();
    expect(settings.openRouterApiKey).toBe("");
    expect(settings.openRouterModel).not.toBe("x/y");
    expect(settings.language).toBe("de");
  });

  it("skips identical reports and asks about different ones for a taken quarter", async () => {
    const storage = await loadStorage();
    const same = normalizeReport({ id: "a", quarter: "Q1", year: 2026, title: "Same" });
    const changed = normalizeReport({ id: "b", quarter: "Q2", year: 2026, title: "Old" });
    await storage.saveReport(same);
    await storage.saveReport(changed);

    const payload = {
      reports: [
        { ...same, updatedAt: "2030-01-01T00:00:00.000Z" },
        { ...changed, title: "New" },
        { quarter: "Q3", year: 2026, title: "Fresh" },
      ],
    };
    const conflicts = storage.findReportConflicts(payload, await storage.listReports());
    expect(conflicts.map((c) => [c.index, c.quarter, c.existing.id])).toEqual([[1, "Q2", "b"]]);

    const result = await storage.importSnapshotPayload(payload, storage.DEFAULT_SELECTION, { 1: "overwrite" });
    expect(result).toMatchObject({ reportsImported: 2, reportsUnchanged: 1 });
    const reports = await storage.listReports();
    expect(reports).toHaveLength(3);
    expect(reports.find((r) => r.id === "b")?.title).toBe("New");
  });

  it("can ignore or keep both reports for a taken quarter", async () => {
    const storage = await loadStorage();
    const existing = normalizeReport({ id: "a", quarter: "Q1", year: 2026, title: "Old" });
    await storage.saveReport(existing);
    const payload = { reports: [{ ...existing, title: "New" }] };

    await storage.importSnapshotPayload(payload, storage.DEFAULT_SELECTION, { 0: "skip" });
    expect((await storage.listReports()).map((r) => r.title)).toEqual(["Old"]);

    await storage.importSnapshotPayload(payload, storage.DEFAULT_SELECTION, { 0: "keepBoth" });
    expect((await storage.listReports()).map((r) => r.title).sort()).toEqual(["New", "Old"]);
  });

  it("rejects non-image logos on import", async () => {
    const storage = await loadStorage();
    await storage.importSnapshotPayload(
      { settings: { logo: "https://tracker.example/pixel.png" } },
      storage.DEFAULT_SELECTION,
    );
    expect((await storage.getSettings()).logo).toBe("");
  });

  it("migrates data from the old localStorage fallback once", async () => {
    const legacy = normalizeReport({ quarter: "Q3", year: 2024 });
    localStorage.setItem(
      "cyber-board-reports:fallback:v1",
      JSON.stringify({ reports: [legacy], profile: { displayName: "Legacy" } }),
    );
    const storage = await loadStorage();
    expect((await storage.listReports()).map((r) => r.id)).toEqual([legacy.id]);
    expect((await storage.getProfile()).displayName).toBe("Legacy");
    expect(localStorage.getItem("cyber-board-reports:fallback:v1")).toBeNull();
  });
});
