import { SLIDE_HEIGHT, SLIDE_WIDTH } from "@/components/slides/slideConstants";

export class ExportCancelledError extends Error {
  constructor() {
    super("Export cancelled");
    this.name = "ExportCancelledError";
  }
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Resolve once a freshly rendered slide is safe to capture: web fonts are
 * loaded, every image (the logo) is decoded and the browser has painted.
 * Charts render synchronously (see FixedChart), so no fixed delay is needed.
 */
export async function waitForSlideReady(element: HTMLElement): Promise<void> {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  await Promise.all(
    [...element.querySelectorAll("img")].map((img) =>
      img.complete && img.naturalWidth > 0 ? Promise.resolve() : img.decode().catch(() => undefined),
    ),
  );
  await nextFrame();
  await nextFrame();
}

export interface ImagePdfOptions {
  slideCount: number;
  /** Render slide `index` and return its root element. */
  renderSlide: (index: number) => Promise<HTMLElement | null>;
  signal?: AbortSignal;
  onProgress?: (done: number, total: number) => void;
}

/**
 * Rasterise each slide with html2canvas and assemble a PDF. Used where a
 * pixel-exact file is wanted without the browser's print dialog.
 */
export async function buildImagePdf(options: ImagePdfOptions): Promise<Blob> {
  const { slideCount, renderSlide, signal, onProgress } = options;
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [SLIDE_WIDTH, SLIDE_HEIGHT],
    compress: true,
  });

  for (let index = 0; index < slideCount; index += 1) {
    if (signal?.aborted) {
      throw new ExportCancelledError();
    }
    onProgress?.(index, slideCount);

    const slide = await renderSlide(index);
    if (!slide) {
      continue;
    }
    await waitForSlideReady(slide);

    const canvas = await html2canvas(slide, {
      backgroundColor: "#ffffff",
      width: SLIDE_WIDTH,
      height: SLIDE_HEIGHT,
      scale: 2,
      useCORS: true,
      logging: false,
    });

    if (index > 0) {
      pdf.addPage([SLIDE_WIDTH, SLIDE_HEIGHT], "landscape");
    }
    // Flat slide graphics compress well as lossless PNG. For small files,
    // the vector (print) export is the better choice.
    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      0,
      0,
      SLIDE_WIDTH,
      SLIDE_HEIGHT,
      undefined,
      "FAST",
    );
  }

  onProgress?.(slideCount, slideCount);
  return pdf.output("blob");
}
