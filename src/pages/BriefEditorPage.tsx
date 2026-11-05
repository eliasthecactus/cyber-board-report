import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Edit2,
  LayoutTemplate,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  Undo2,
} from "lucide-react";
import type { Brief, BriefBlock, BriefBlockType, BriefSlide, BriefTheme, Report } from "@/types";
import { BLOCKS, blockDefinition, blockHeading } from "@/components/brief/blockRegistry";
import { BlockProperties } from "@/components/brief/BlockProperties";
import { BriefCanvas } from "@/components/brief/BriefCanvas";
import { BriefSlideView } from "@/components/brief/BriefSlideView";
import ExportDialog from "@/components/export/ExportDialog";
import { ExportProgress } from "@/components/export/ExportProgress";
import { useReportExport, type ExportFormat } from "@/components/export/useReportExport";
import { SlideStage } from "@/components/slides/SlideStage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageMessage, PageSpinner } from "@/components/ui/PageState";
import { Toast } from "@/components/ui/Toast";
import { copyBriefFrom, createBlock, createDefaultBrief } from "@/lib/brief";
import { BRIEF_THEMES, findPlacement, MAX_BRIEF_SLIDES } from "@/lib/briefGrid";
import { describeError } from "@/lib/errors";
import { reportFileStem } from "@/lib/files";
import { useT } from "@/lib/i18n";
import { navigateTo } from "@/lib/navigation";
import { createId } from "@/lib/reportFactory";
import { ReportContextProvider, serializeReportForAi } from "@/lib/reportContext";
import { earlierReports } from "@/lib/sectionImport";
import { getReport, listReports, saveReport } from "@/lib/storage";
import { useAutosave, type SaveState } from "@/lib/useAutosave";

interface BriefEditorPageProps {
  reportId: string;
}

/** Changes closer together than this share one undo step (typing, dragging). */
const UNDO_COALESCE_MS = 800;
const UNDO_LIMIT = 50;
const PDF_FORMATS: readonly ExportFormat[] = ["pdf-print", "pdf-image"];
/** In the registry's order, which groups the blocks by topic. */
const PALETTE = Object.keys(BLOCKS) as BriefBlockType[];

type PendingConfirm = "reset" | "copy" | "deleteSlide";

function saveDotClass(state: SaveState): string {
  if (state === "saved") {
    return "bg-emerald-400";
  }
  return state === "error" ? "bg-red-400" : "bg-amber-400";
}

const panelClass = "rounded-2xl border border-white/[0.07] bg-white/[0.03]";
const sectionLabelClass = "m-0 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/45";
const fieldLabelClass = "text-xs font-medium text-white/55";

/** Colours of the theme previews in the settings: page, tile, ink. */
const THEME_PREVIEW: Record<BriefTheme, [string, string, string]> = {
  midnight: ["#0a0e15", "#1a2330", "#f4f6f9"],
  daylight: ["#eef1f5", "#ffffff", "#0e1420"],
};

const period = (report: Report) => `${report.quarter} ${report.year}`;

export default function BriefEditorPage({ reportId }: BriefEditorPageProps) {
  const t = useT();
  const [report, setReport] = useState<Report | null>(null);
  const [earlier, setEarlier] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [overflowing, setOverflowing] = useState<ReadonlySet<string>>(new Set());
  const [history, setHistory] = useState<Brief[]>([]);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const prior = earlier.at(-1) ?? null;
  const latestBrief = useRef<Brief | null>(null);
  const lastChange = useRef(0);
  const { saveState, flush, markSaved } = useAutosave(report, saveReport);
  const handleExportError = useCallback((error: unknown) => setMessage(describeError(t, error)), [t]);
  const exporter = useReportExport(handleExportError);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const storedReport = await getReport(reportId);
        if (cancelled) return;
        if (storedReport) {
          markSaved(storedReport);
          const reports = await listReports();
          if (cancelled) return;
          setEarlier(earlierReports(reports, storedReport));
        }
        setReport(storedReport);
      } catch (error) {
        if (!cancelled) setLoadError(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [reportId, markSaved]);

  useEffect(() => {
    latestBrief.current = report?.brief ?? null;
  }, [report]);

  const replaceBrief = useCallback((brief: Brief) => {
    setReport((current) => (current ? { ...current, brief, updatedAt: new Date().toISOString() } : current));
  }, []);

  /** Apply a change to the brief, recording an undo step unless one was just made. */
  const changeBrief = useCallback((update: (brief: Brief) => Brief) => {
    const now = Date.now();
    const snapshot = latestBrief.current;
    if (snapshot && now - lastChange.current > UNDO_COALESCE_MS) {
      setHistory((items) => [...items.slice(-(UNDO_LIMIT - 1)), snapshot]);
    }
    lastChange.current = now;
    setReport((current) =>
      current?.brief ? { ...current, brief: update(current.brief), updatedAt: new Date().toISOString() } : current,
    );
  }, []);

  const changeSlide = useCallback(
    (index: number, update: (slide: BriefSlide) => BriefSlide) => {
      changeBrief((brief) => ({
        ...brief,
        slides: brief.slides.map((slide, position) => (position === index ? update(slide) : slide)),
      }));
    },
    [changeBrief],
  );

  const handleBlocksChange = useCallback(
    (blocks: BriefBlock[]) => changeSlide(slideIndex, (slide) => ({ ...slide, blocks })),
    [changeSlide, slideIndex],
  );

  const handleDeleteBlock = useCallback(
    (id: string) => {
      changeSlide(slideIndex, (slide) => ({ ...slide, blocks: slide.blocks.filter((block) => block.id !== id) }));
      setSelectedId(null);
    },
    [changeSlide, slideIndex],
  );

  const handleOverflow = useCallback((id: string, isOverflowing: boolean) => {
    setOverflowing((current) => {
      if (current.has(id) === isOverflowing) {
        return current;
      }
      const next = new Set(current);
      if (isOverflowing) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  /** Every block with a problem, in reading order. */
  const problems = useMemo(() => {
    const list: { block: BriefBlock; slide: number; problem: string }[] = [];
    report?.brief?.slides.forEach((slide, index) => {
      for (const block of slide.blocks) {
        const definition = blockDefinition(block);
        if (overflowing.has(block.id)) {
          list.push({ block, slide: index, problem: t("brief.warn.overflow") });
        } else if (definition.isEmpty(block as never, report, prior)) {
          list.push({ block, slide: index, problem: t("brief.warn.empty") });
        }
      }
    });
    return list;
  }, [report, prior, overflowing, t]);

  const warnings = useMemo(
    () => Object.fromEntries(problems.map(({ block, problem }) => [block.id, problem])),
    [problems],
  );

  const getAiContext = useCallback(() => (report ? serializeReportForAi(report) : ""), [report]);

  const leaveTo = async (path: string) => {
    await flush().catch(() => undefined);
    navigateTo(path);
  };

  if (loading) {
    return <PageSpinner />;
  }

  if (!report) {
    return <PageMessage title={loadError ? describeError(t, loadError) : t("editor.reportNotFound")} />;
  }

  const brief = report.brief;
  const canCopy = Boolean(prior?.brief);

  const startFresh = () => {
    setSlideIndex(0);
    setSelectedId(null);
    replaceBrief(createDefaultBrief(t));
  };

  const startFromPrior = () => {
    const copy = prior && copyBriefFrom(prior, report);
    if (copy) {
      setSlideIndex(0);
      setSelectedId(null);
      replaceBrief(copy);
    }
  };

  const header = (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#07090e]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1760px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <button
            className="cbr-btn cbr-btn-ghost cbr-btn-sm cbr-btn-icon"
            onClick={() => void leaveTo("/")}
            aria-label={t("common.backToDashboard")}
            title={t("common.backToDashboard")}
          >
            <ArrowLeft size={16} aria-hidden />
          </button>
          <h1 className="m-0 truncate text-[15px] font-semibold tracking-[-0.01em] text-white">
            {t("brief.pageTitle", { quarter: report.quarter, year: report.year })}
          </h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <button
            className="cbr-btn cbr-btn-ghost cbr-btn-sm"
            onClick={() => void flush().catch(() => undefined)}
            disabled={saveState === "saving"}
            title={t(`editor.saveTitle.${saveState}`)}
          >
            {saveState === "saving" ? (
              <Loader2 size={12} className="animate-spin" aria-hidden />
            ) : (
              <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${saveDotClass(saveState)}`} />
            )}
            <span aria-live="polite">{t(`editor.save.${saveState}`)}</span>
          </button>
          {brief && (
            <button
              className="cbr-btn cbr-btn-ghost cbr-btn-sm"
              disabled={history.length === 0}
              onClick={() => {
                const previous = history.at(-1);
                if (previous) {
                  setHistory(history.slice(0, -1));
                  lastChange.current = 0;
                  setSelectedId(null);
                  setSlideIndex((index) => Math.min(index, previous.slides.length - 1));
                  replaceBrief(previous);
                }
              }}
            >
              <Undo2 size={14} aria-hidden />
              {t("brief.undo")}
            </button>
          )}
          <button
            className="cbr-btn cbr-btn-ghost cbr-btn-sm"
            onClick={() => void leaveTo(`/editor/${encodeURIComponent(report.id)}`)}
          >
            <Edit2 size={14} aria-hidden />
            {t("dashboard.edit")}
          </button>
          {brief && (
            <button
              className="cbr-btn cbr-btn-primary cbr-btn-sm ml-1.5"
              onClick={() => setExportOpen(true)}
              disabled={exporter.state !== null}
            >
              {exporter.state ? (
                <Loader2 size={14} className="animate-spin" aria-hidden />
              ) : (
                <Download size={14} aria-hidden />
              )}
              {exporter.state ? t("slidesView.exporting") : t("slidesView.export")}
            </button>
          )}
        </div>
      </div>
    </header>
  );

  if (!brief) {
    const startClass =
      "flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-left transition-colors hover:border-white/20 hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-white";
    return (
      <main className="brief-studio min-h-screen">
        {header}
        <section className="mx-auto max-w-xl px-4 py-16">
          <h2 className="m-0 text-[28px] font-semibold tracking-[-0.02em] text-white">{t("brief.start.title")}</h2>
          <p className="mb-7 mt-2 text-sm leading-relaxed text-white/60">{t("brief.start.desc", { max: MAX_BRIEF_SLIDES })}</p>
          <div className="flex flex-col gap-2.5">
            <button type="button" onClick={startFresh} className={startClass}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-white">
                <LayoutTemplate size={18} aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-medium text-white">{t("brief.start.template")}</span>
                <span className="block text-xs text-white/55">{t("brief.start.templateHint")}</span>
              </span>
            </button>
            {prior && canCopy && (
              <button type="button" onClick={startFromPrior} className={startClass}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-white">
                  <Copy size={18} aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-medium text-white">
                    {t("brief.start.copy", { period: period(prior) })}
                  </span>
                  <span className="block text-xs text-white/55">{t("brief.start.copyHint")}</span>
                </span>
              </button>
            )}
          </div>
        </section>
      </main>
    );
  }

  const slide = brief.slides[slideIndex] ?? brief.slides[0];
  const selectedBlock = slide.blocks.find((block) => block.id === selectedId) ?? null;

  const addBlock = (type: BriefBlockType) => {
    const rect = findPlacement(type, slide.blocks);
    if (!rect) {
      setMessage(t("brief.slideFull"));
      return;
    }
    const block = createBlock(type, rect) as BriefBlock;
    handleBlocksChange([...slide.blocks, block]);
    setSelectedId(block.id);
  };

  const addSlide = () => {
    changeBrief((current) => ({
      ...current,
      slides: [...current.slides, { id: createId("slide"), title: t("brief.newSlide"), blocks: [] }],
    }));
    setSlideIndex(brief.slides.length);
    setSelectedId(null);
  };

  const moveSlide = (offset: -1 | 1) => {
    const target = slideIndex + offset;
    changeBrief((current) => {
      const slides = [...current.slides];
      [slides[slideIndex], slides[target]] = [slides[target], slides[slideIndex]];
      return { ...current, slides };
    });
    setSlideIndex(target);
  };

  const confirmAction = () => {
    if (pendingConfirm === "deleteSlide") {
      changeBrief((current) => ({ ...current, slides: current.slides.filter((_, index) => index !== slideIndex) }));
      setSlideIndex(Math.max(0, slideIndex - 1));
      setSelectedId(null);
    } else {
      // Replacing the brief is a change that can be undone.
      setHistory((items) => [...items.slice(-(UNDO_LIMIT - 1)), brief]);
      if (pendingConfirm === "reset") {
        startFresh();
      } else {
        startFromPrior();
      }
    }
    setPendingConfirm(null);
  };

  const confirmBody =
    pendingConfirm === "deleteSlide"
      ? t("brief.deleteSlideConfirm", { title: slide.title })
      : pendingConfirm === "copy" && prior
        ? t("brief.settings.copyConfirm", { period: period(prior) })
        : t("brief.settings.resetConfirm");

  return (
    <ReportContextProvider getContext={getAiContext}>
      <main className="brief-studio min-h-screen">
        {header}

        <section className="mx-auto grid max-w-[1760px] grid-cols-1 gap-4 px-4 py-4 sm:px-5 lg:grid-cols-[208px_minmax(0,1fr)_272px]">
          {/* Block palette */}
          <aside className={`${panelClass} p-3 lg:sticky lg:top-[68px] lg:self-start`}>
            <h2 className={sectionLabelClass}>{t("brief.blocks")}</h2>
            <p className="mb-2.5 mt-1 text-xs leading-snug text-white/50">{t("brief.blocksHint")}</p>
            <div className="grid grid-cols-2 gap-0.5 lg:grid-cols-1">
              {PALETTE.map((type) => {
                const { Icon, label } = BLOCKS[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addBlock(type)}
                    className="group flex items-center gap-2.5 rounded-lg px-1.5 py-1 text-left text-[13px] text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-white"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-white/60 transition-colors group-hover:bg-white/[0.12] group-hover:text-white">
                      <Icon size={14} aria-hidden />
                    </span>
                    <span className="min-w-0 leading-tight">{t(label)}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Slide being edited, with the slide strip below */}
          <div className="flex min-w-0 flex-col gap-3">
            <BriefCanvas
              report={report}
              earlier={earlier}
              brief={brief}
              slideIndex={slideIndex}
              selectedId={selectedId}
              warnings={warnings}
              onSelect={setSelectedId}
              onBlocksChange={handleBlocksChange}
              onDelete={handleDeleteBlock}
              onOverflow={handleOverflow}
            />
            <p className="m-0 text-xs text-white/45">{t("brief.canvasHint")}</p>

            <nav aria-label={t("brief.slides")} className="flex flex-wrap items-start gap-3">
              {brief.slides.map((item, index) => (
                <div key={item.id} className="w-48">
                  <button
                    type="button"
                    onClick={() => {
                      setSlideIndex(index);
                      setSelectedId(null);
                    }}
                    aria-current={index === slideIndex ? "true" : undefined}
                    aria-label={t("brief.goToSlide", { number: index + 1 })}
                    className={`block w-full overflow-hidden rounded-lg outline-offset-2 transition focus-visible:outline-2 focus-visible:outline-white ${
                      index === slideIndex ? "ring-2 ring-white" : "opacity-70 ring-1 ring-white/10 hover:opacity-100"
                    }`}
                  >
                    <span aria-hidden className="pointer-events-none block">
                      <SlideStage mode="width">
                        <BriefSlideView
                          report={report}
                          earlier={earlier}
                          brief={brief}
                          slideIndex={index}
                          onOverflow={handleOverflow}
                        />
                      </SlideStage>
                    </span>
                  </button>
                  <p className="m-0 mt-1.5 truncate text-xs text-white/60">
                    <span className="mr-1.5 tabular-nums text-white/35">{index + 1}</span>
                    {item.title}
                  </p>
                  {index === slideIndex && (
                    <div className="mt-0.5 flex gap-0.5">
                      <button
                        className="cbr-btn cbr-btn-ghost cbr-btn-xs cbr-btn-icon"
                        onClick={() => moveSlide(-1)}
                        disabled={index === 0}
                        aria-label={t("brief.moveSlideEarlier")}
                        title={t("brief.moveSlideEarlier")}
                      >
                        <ChevronLeft size={14} aria-hidden />
                      </button>
                      <button
                        className="cbr-btn cbr-btn-ghost cbr-btn-xs cbr-btn-icon"
                        onClick={() => moveSlide(1)}
                        disabled={index === brief.slides.length - 1}
                        aria-label={t("brief.moveSlideLater")}
                        title={t("brief.moveSlideLater")}
                      >
                        <ChevronRight size={14} aria-hidden />
                      </button>
                      <button
                        className="cbr-btn cbr-btn-ghost cbr-btn-xs cbr-btn-icon"
                        onClick={() => setPendingConfirm("deleteSlide")}
                        disabled={brief.slides.length === 1}
                        aria-label={t("brief.deleteSlide")}
                        title={t("brief.deleteSlide")}
                      >
                        <Trash2 size={14} aria-hidden />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {brief.slides.length < MAX_BRIEF_SLIDES && (
                <button className="cbr-btn cbr-btn-outline cbr-btn-sm mt-10" onClick={addSlide}>
                  <Plus size={14} aria-hidden />
                  {t("brief.addSlide")}
                </button>
              )}
            </nav>
          </div>

          {/* Properties */}
          <aside className={`${panelClass} p-4 lg:sticky lg:top-[68px] lg:max-h-[calc(100vh-5.5rem)] lg:self-start lg:overflow-y-auto`}>
            {selectedBlock ? (
              <BlockProperties
                key={selectedBlock.id}
                block={selectedBlock}
                report={report}
                onChange={(patch) =>
                  handleBlocksChange(
                    slide.blocks.map((block) =>
                      block.id === selectedBlock.id ? ({ ...block, ...patch } as BriefBlock) : block,
                    ),
                  )
                }
                onDelete={() => handleDeleteBlock(selectedBlock.id)}
              />
            ) : (
              <div className="flex flex-col gap-3">
                <h2 className={sectionLabelClass}>
                  {t("brief.settings.slide")}
                </h2>
                <label className="flex flex-col gap-1">
                  <span className={fieldLabelClass}>{t("brief.settings.slideTitle")}</span>
                  <input
                    type="text"
                    className="form-input form-input-sm"
                    value={slide.title}
                    onChange={(event) => {
                      const title = event.target.value;
                      changeSlide(slideIndex, (current) => ({ ...current, title }));
                    }}
                  />
                </label>

                <h2 className={`${sectionLabelClass} mt-3`}>{t("brief.settings.brief")}</h2>
                <fieldset className="m-0 border-0 p-0">
                  <legend className={`mb-1 p-0 ${fieldLabelClass}`}>{t("brief.settings.theme")}</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {BRIEF_THEMES.map((theme) => {
                      const [page, tile, ink] = THEME_PREVIEW[theme];
                      return (
                        <label
                          key={theme}
                          className={`cursor-pointer rounded-xl border p-1.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-white ${
                            brief.theme === theme ? "border-white" : "border-white/10 hover:border-white/30"
                          }`}
                        >
                          <input
                            type="radio"
                            name="brief-theme"
                            className="sr-only"
                            checked={brief.theme === theme}
                            onChange={() => changeBrief((current) => ({ ...current, theme }))}
                          />
                          <span
                            aria-hidden
                            className="mb-1.5 flex h-11 items-end gap-1 rounded-lg p-1.5"
                            style={{ backgroundColor: page }}
                          >
                            <span className="h-full flex-1 rounded" style={{ backgroundColor: tile }} />
                            <span className="h-3/5 flex-1 rounded" style={{ backgroundColor: ink }} />
                          </span>
                          <span className="block px-0.5 text-xs font-medium text-white">{t(`brief.theme.${theme}`)}</span>
                          <span className="block px-0.5 text-[11px] text-white/50">{t(`brief.theme.${theme}Hint`)}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <label className="flex flex-col gap-1">
                  <span className={fieldLabelClass}>{t("brief.settings.audience")}</span>
                  <input
                    type="text"
                    className="form-input form-input-sm"
                    value={brief.audience}
                    onChange={(event) => {
                      const audience = event.target.value;
                      changeBrief((current) => ({ ...current, audience }));
                    }}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={fieldLabelClass}>{t("brief.settings.title")}</span>
                  <input
                    type="text"
                    className="form-input form-input-sm"
                    placeholder={t("brief.defaultTitle")}
                    value={brief.title}
                    onChange={(event) => {
                      const title = event.target.value;
                      changeBrief((current) => ({ ...current, title }));
                    }}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={fieldLabelClass}>{t("brief.settings.footerNote")}</span>
                  <input
                    type="text"
                    className="form-input form-input-sm"
                    value={brief.footerNote}
                    onChange={(event) => {
                      const footerNote = event.target.value;
                      changeBrief((current) => ({ ...current, footerNote }));
                    }}
                  />
                </label>

                <div className="mt-3 flex flex-col items-start gap-1">
                  {prior && canCopy && (
                    <button className="cbr-btn cbr-btn-ghost cbr-btn-sm" onClick={() => setPendingConfirm("copy")}>
                      <Copy size={14} aria-hidden />
                      {t("brief.settings.copy", { period: period(prior) })}
                    </button>
                  )}
                  <button className="cbr-btn cbr-btn-ghost cbr-btn-sm" onClick={() => setPendingConfirm("reset")}>
                    <RotateCcw size={14} aria-hidden />
                    {t("brief.settings.reset")}
                  </button>
                </div>
              </div>
            )}
          </aside>
        </section>

        {pendingConfirm && (
          <ConfirmDialog
            title={pendingConfirm === "deleteSlide" ? t("brief.deleteSlide") : t("brief.settings.reset")}
            body={confirmBody}
            confirmLabel={pendingConfirm === "deleteSlide" ? t("common.delete") : t("brief.settings.confirm")}
            danger
            onConfirm={confirmAction}
            onCancel={() => setPendingConfirm(null)}
          />
        )}

        {exportOpen && (
          <ExportDialog
            reportLabel={period(report)}
            title={t("brief.export.title")}
            formats={PDF_FORMATS}
            warnings={problems.map(({ block, slide: index, problem }) =>
              t("brief.warn.item", {
                slide: index + 1,
                block: blockHeading(block, t) || t(blockDefinition(block).label),
                problem,
              }),
            )}
            onCancel={() => setExportOpen(false)}
            onChoose={(format) => {
              setExportOpen(false);
              void exporter.start(report, format, {
                slideCount: brief.slides.length,
                renderSlide: (index) => (
                  <BriefSlideView report={report} earlier={earlier} brief={brief} slideIndex={index} />
                ),
                fileStem: reportFileStem(report, "brief"),
              });
            }}
          />
        )}

        {exporter.state && <ExportProgress state={exporter.state} onCancel={exporter.cancel} />}
        {message && <Toast message={message} onDismiss={() => setMessage(null)} />}
        {exporter.host}
      </main>
    </ReportContextProvider>
  );
}
