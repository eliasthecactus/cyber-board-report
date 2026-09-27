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
