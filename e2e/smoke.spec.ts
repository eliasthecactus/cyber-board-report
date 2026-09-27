import { expect, test, type Page } from "@playwright/test";

/** Fail the test on CSP violations or uncaught errors. */
function watchForErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /Content Security Policy|Refused to/i.test(message.text())) {
      errors.push(message.text());
    }
  });
  return errors;
}

async function createReport(page: Page, quarter = "Q3", year = "2026") {
  await page.goto("./");
  await page.getByRole("button", { name: "Create report" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Create New Report" });
  await dialog.getByLabel("Quarter").selectOption(quarter);
  await dialog.getByLabel("Year").fill(year);
  await dialog.getByRole("button", { name: "Create" }).click();
  await expect(page).toHaveURL(/#\/editor\//);
}

test("create, edit, preview and export a report", async ({ page }) => {
  const errors = watchForErrors(page);
  await createReport(page);

  await page.getByRole("button", { name: "Executive Summary" }).click();
  const summary = page.getByLabel("Summary:");
  await summary.fill("Risk posture improved; phishing remains the top concern.");

  // Navigate away immediately: the pending edit must still be saved.
  await page.getByRole("button", { name: "Preview" }).click();
  await expect(page).toHaveURL(/#\/slides\//);
  await page.getByRole("button", { name: "Go to slide 2" }).click();
  await expect(page.getByText("phishing remains the top concern")).toBeVisible();

  // Hiding empty slides leaves the title and executive summary.
  await page.getByLabel("Hide empty slides").check();
  await expect(page.getByRole("button", { name: /Go to slide/ })).toHaveCount(2);

  await page.getByRole("button", { name: "Export" }).click();
  const pptxDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: /PowerPoint/ }).click();
  expect((await pptxDownload).suggestedFilename()).toBe("q3-2026-board-report.pptx");

  await page.getByRole("button", { name: "Export" }).click();
  const pdfDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: /PDF image/ }).click();
  expect((await pdfDownload).suggestedFilename()).toBe("q3-2026-board-report.pdf");

  expect(errors).toEqual([]);
});

test("edits survive a reload and deletes can be undone", async ({ page }) => {
  await createReport(page, "Q1", "2027");
  await page.getByLabel("Report Title").fill("Resilience review");
  await page.getByRole("button", { name: "Back to dashboard" }).click();
  await expect(page).toHaveURL(/#\/$/);

  await page.reload();
  const card = page.getByRole("heading", { name: "Q1 2027", exact: true });
  await expect(card).toBeVisible();
  await page.getByRole("button", { name: "Edit: Q1 2027" }).click();
  await expect(page.getByLabel("Report Title")).toHaveValue("Resilience review");
  await page.getByRole("button", { name: "Back to dashboard" }).click();

  await page.getByRole("button", { name: "Delete: Q1 2027" }).click();
  await expect(card).toHaveCount(0);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(card).toBeVisible();
});

test("dialogs are keyboard accessible", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Create report" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Create New Report" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Quarter")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});
