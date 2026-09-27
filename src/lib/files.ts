import { AppError } from "@/lib/errors";

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoke on the next tick: some browsers start the download asynchronously.
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadJson(filename: string, data: unknown): void {
  downloadBlob(filename, new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
}

export async function readJsonFile(file: File): Promise<unknown> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    throw new AppError("file.readFailed");
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new AppError("file.invalidJson");
  }
}

export function backupFilename(prefix = "cyber-board-reports"): string {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.json`;
}

/** File name stem for a report's exports, e.g. "q3-2026-board-report". */
export function reportFileStem(report: { quarter: string; year: number }): string {
  return `${report.quarter}-${report.year}-board-report`.toLowerCase();
}
