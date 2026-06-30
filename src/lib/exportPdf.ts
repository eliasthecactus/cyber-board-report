import { SLIDE_WIDTH, SLIDE_HEIGHT, TOTAL_SLIDES } from "@/components/slides/slideConstants";
import type { Report } from "@/types";

export interface PdfExportCallbacks {
  /** Called before rendering each slide. Return the container element. */
  onSlide: (slideIndex: number) => Promise<HTMLElement | null>;
  /** Called when export finishes (success or error). */
  onDone: () => void;
}

export async function exportReportToPdf(
  report: Report,
  callbacks: PdfExportCallbacks,
): Promise<void> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [SLIDE_WIDTH, SLIDE_HEIGHT],
  });

  try {
    for (let slideIndex = 0; slideIndex < TOTAL_SLIDES; slideIndex += 1) {
      const slideEl = await callbacks.onSlide(slideIndex);
      if (!slideEl) continue;

      // Wait for render; slide 0 is a cold mount so needs extra settle time
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
      await new Promise((r) => window.setTimeout(r, slideIndex === 0 ? 600 : 250));

      const canvas = await html2canvas(slideEl, {
        backgroundColor: "#ffffff",
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        scale: 2,
        useCORS: true,
      });

      if (slideIndex > 0) {
        pdf.addPage([SLIDE_WIDTH, SLIDE_HEIGHT], "landscape");
      }
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, SLIDE_WIDTH, SLIDE_HEIGHT);
    }

    pdf.save(`${report.quarter}-${report.year}-board-report.pdf`);
  } finally {
    callbacks.onDone();
  }
}
