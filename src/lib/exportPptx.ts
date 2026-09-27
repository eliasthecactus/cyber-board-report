import type PptxGenJS from "pptxgenjs";
import type { AppLanguage, AppSettings, DomainItem, DomainTrend, Report } from "@/types";
import { formatDate, type TFunction } from "@/lib/i18n";
import { accentFor, SLIDE_HEIGHT, SLIDE_LIMITS, SLIDE_WIDTH, type Accent } from "@/components/slides/slideConstants";
import { visibleSlides, type SlideId } from "@/components/slides/slideRegistry";
import { levelColor, matrixCell, matrixTone, palette, riskStatColor, riskTrendColor, statusColor } from "@/components/slides/palette";
import { kpiSeries, trendColors } from "@/components/slides/slides/KPISlide";
import { LEVELS, risksForSlide } from "@/components/slides/slides/TopRisksSlide";

/*
 * Native, editable PowerPoint export. Slides are laid out in the same pixel
 * coordinates as the HTML slides (1280 × 720 px = 13.333 × 7.5 in at 96 dpi),
 * so both outputs look alike while every text box stays editable.
 */

type Slide = PptxGenJS.Slide;
type TextOpts = PptxGenJS.TextPropsOptions;

const FONT = "Arial";
const PAD_X = 72;
const CONTENT_W = SLIDE_WIDTH - PAD_X * 2;
const CONTENT_TOP = 132;
const CONTENT_BOTTOM = 636;

/** px → inches */
const u = (px: number) => px / 96;
/** CSS px font size → points */
const pt = (px: number) => px * 0.75;
/** "#rrggbb" → "rrggbb" */
const c = (hex: string) => hex.replace("#", "");

interface Ctx {
  pptx: PptxGenJS;
  report: Report;
  t: TFunction;
  lang: AppLanguage;
  accent: Accent;
  logo: { data: string; w: number; h: number } | null;
  page: number;
  total: number;
}

function text(slide: Slide, value: string, x: number, y: number, w: number, h: number, opts: TextOpts = {}) {
  slide.addText(value, {
    x: u(x),
    y: u(y),
    w: u(w),
    h: u(h),
    fontFace: FONT,
    fontSize: pt(14),
    color: c(palette.body),
    margin: 0,
    valign: "top",
    fit: "shrink",
    ...opts,
  });
}

function box(ctx: Ctx, slide: Slide, x: number, y: number, w: number, h: number, fill: string = palette.surface) {
  slide.addShape(ctx.pptx.ShapeType.roundRect, {
    x: u(x),
    y: u(y),
    w: u(w),
    h: u(h),
    fill: { color: c(fill) },
    line: { color: c(fill), width: 0 },
    rectRadius: 0.08,
  });
}

function badge(ctx: Ctx, slide: Slide, label: string, rightX: number, y: number, color: string) {
  const w = Math.max(60, label.length * 8 + 20);
  slide.addText(label.toUpperCase(), {
    shape: ctx.pptx.ShapeType.roundRect,
    x: u(rightX - w),
    y: u(y),
    w: u(w),
    h: u(22),
    rectRadius: 0.05,
    fill: { color: c(color) },
    color: "FFFFFF",
    bold: true,
    fontFace: FONT,
    fontSize: pt(11),
    align: "center",
    valign: "middle",
    margin: 0,
  });
}

function footer(ctx: Ctx, slide: Slide) {
  const { report, t } = ctx;
  slide.addShape(ctx.pptx.ShapeType.rect, {
    x: u(PAD_X),
    y: u(SLIDE_HEIGHT - 58),
    w: u(32),
    h: u(3),
    fill: { color: c(ctx.accent.fill), transparency: 60 },
    line: { color: c(ctx.accent.fill), width: 0, transparency: 60 },
  });
  text(slide, `${report.quarter} ${report.year} · ${report.title.trim() || t("report.defaultTitle")}`, PAD_X + 44, SLIDE_HEIGHT - 66, 800, 20, {
    fontSize: pt(13),
    color: c(palette.faint),
  });
  text(slide, `${ctx.page} / ${ctx.total}`, SLIDE_WIDTH - PAD_X - 100, SLIDE_HEIGHT - 66, 100, 20, {
    fontSize: pt(13),
    color: c(palette.faint),
    align: "right",
  });
}

function logo(ctx: Ctx, slide: Slide, y: number) {
  if (!ctx.logo) return;
  const scale = Math.min(180 / ctx.logo.w, 44 / ctx.logo.h, 1);
  const w = ctx.logo.w * scale;
  const h = ctx.logo.h * scale;
  slide.addImage({ data: ctx.logo.data, x: u(SLIDE_WIDTH - PAD_X - w), y: u(y), w: u(w), h: u(h) });
}

/** Standard content slide: title, logo, divider and footer. */
function frame(ctx: Ctx, title: string): Slide {
  const slide = ctx.pptx.addSlide();
  slide.background = { color: "FFFFFF" };
  // Accent bar in place of the section icon, which has no PowerPoint equivalent.
  slide.addShape(ctx.pptx.ShapeType.roundRect, {
    x: u(PAD_X),
    y: u(54),
    w: u(6),
    h: u(32),
    fill: { color: c(ctx.accent.fill) },
    line: { color: c(ctx.accent.fill), width: 0 },
    rectRadius: 0.5,
  });
  text(slide, title, PAD_X + 20, 48, 900, 44, {
    fontSize: pt(30),
    bold: true,
    color: c(palette.text),
    valign: "middle",
  });
  logo(ctx, slide, 48);
  slide.addShape(ctx.pptx.ShapeType.line, {
    x: u(PAD_X),
    y: u(112),
    w: u(CONTENT_W),
    h: 0,
    line: { color: c("#f1f5f9"), width: 1 },
  });
  footer(ctx, slide);
  return slide;
}

function emptyNote(slide: Slide, value: string) {
  text(slide, value, PAD_X, CONTENT_TOP, CONTENT_W, 30, { italic: true, fontSize: pt(15), color: c(palette.faint) });
}

function moreNote(ctx: Ctx, slide: Slide, count: number, y: number) {
  if (count > 0) {
    text(slide, ctx.t("slide.more", { count }), PAD_X, y, CONTENT_W, 24, {
      italic: true,
      fontSize: pt(14),
      color: c(palette.faint),
    });
  }
}

// ── Slides ────────────────────────────────────────────────────────────────

function titleSlide(ctx: Ctx) {
  const { report, t, accent } = ctx;
  const slide = ctx.pptx.addSlide();
  slide.background = { color: "FFFFFF" };
  slide.addShape(ctx.pptx.ShapeType.rect, {
    x: u(PAD_X),
    y: u(56),
    w: u(64),
    h: u(3),
    fill: { color: c(accent.fill) },
    line: { color: c(accent.fill), width: 0 },
  });
  logo(ctx, slide, 56);
  const title = report.title.trim() || t("report.defaultTitle");
  const presenter = report.presenter.trim() || report.createdBy;
  text(slide, title.toUpperCase(), 0, 200, SLIDE_WIDTH, 30, {
    align: "center",
    bold: true,
    fontSize: pt(16),
    color: c(accent.text),
    charSpacing: 4,
  });
  slide.addText(
    [
      { text: `${report.quarter} `, options: { color: c(palette.text), bold: true } },
      { text: String(report.year), options: { color: c(palette.faint) } },
    ],
    { x: 0, y: u(240), w: u(SLIDE_WIDTH), h: u(120), align: "center", fontFace: FONT, fontSize: pt(108), margin: 0 },
  );
  slide.addShape(ctx.pptx.ShapeType.rect, {
    x: u(SLIDE_WIDTH / 2 - 40),
    y: u(368),
    w: u(80),
    h: u(3),
    fill: { color: c(accent.fill) },
    line: { color: c(accent.fill), width: 0 },
  });
  text(slide, t("slide.title.preparedBy", { name: presenter }), 0, 410, SLIDE_WIDTH, 28, {
    align: "center",
    fontSize: pt(18),
    color: c(palette.muted),
  });
  text(slide, formatDate(report.createdAt, ctx.lang), 0, 440, SLIDE_WIDTH, 24, {
    align: "center",
    fontSize: pt(15),
    color: c(palette.faint),
  });
  const participants = report.participants.map((p) => p.trim()).filter(Boolean);
  if (participants.length) {
    text(slide, t("slide.title.involved").toUpperCase(), 0, 500, SLIDE_WIDTH, 20, {
      align: "center",
      bold: true,
      fontSize: pt(12),
      color: c(palette.faint),
      charSpacing: 3,
    });
    text(slide, participants.join("   ·   "), 260, 526, SLIDE_WIDTH - 520, 60, {
      align: "center",
      fontSize: pt(14),
      color: c(palette.body),
    });
  }
  footer(ctx, slide);
}

function executiveSummarySlide(ctx: Ctx) {
  const { report, t } = ctx;
  const slide = frame(ctx, t("section.executiveSummary"));
  let y = CONTENT_TOP;
  if (report.executiveSummaryHighlight) {
    box(ctx, slide, PAD_X, y, CONTENT_W, 110);
    text(slide, t("slide.exec.keyTakeaway").toUpperCase(), PAD_X + 20, y + 18, CONTENT_W - 40, 18, {
      bold: true,
      fontSize: pt(13),
      color: c(ctx.accent.text),
    });
    text(slide, report.executiveSummaryHighlight, PAD_X + 20, y + 40, CONTENT_W - 40, 56, {
      fontSize: pt(18),
      color: c("#334155"),
    });
    y += 130;
  }
  text(slide, report.executiveSummary || t("slide.exec.noSummary"), PAD_X, y, CONTENT_W, CONTENT_BOTTOM - y, {
    fontSize: pt(19),
    lineSpacingMultiple: 1.3,
  });
}

function topRisksSlide(ctx: Ctx) {
  const { report, t } = ctx;
  const slide = frame(ctx, t("section.topRisks"));
  if (report.topRisks.length === 0) {
    emptyNote(slide, t("slide.risks.none"));
    return;
  }

  const stats = [
    [t("slide.risks.critical"), report.topRisks.filter((r) => r.likelihood === "critical" || r.businessImpact === "critical").length, riskStatColor.critical],
    [t("slide.risks.worsening"), report.topRisks.filter((r) => r.trend === "worsening").length, riskStatColor.worsening],
    [t("slide.risks.improving"), report.topRisks.filter((r) => r.trend === "improving").length, riskStatColor.improving],
  ] as const;
  const statW = (CONTENT_W - 24) / 3;
  stats.forEach(([label, value, color], i) => {
    const x = PAD_X + i * (statW + 12);
    box(ctx, slide, x, CONTENT_TOP, statW, 72);
    text(slide, label.toUpperCase(), x + 16, CONTENT_TOP + 10, statW - 32, 16, { bold: true, fontSize: pt(12), color: c(palette.faint) });
    text(slide, String(value), x + 16, CONTENT_TOP + 28, statW - 32, 36, { bold: true, fontSize: pt(28), color: c(color) });
  });

  const top = CONTENT_TOP + 92;
  const listW = report.showRiskMatrix ? CONTENT_W * 0.56 : CONTENT_W;
  const columns = report.showRiskMatrix ? 1 : 2;
  const cardW = (listW - (columns - 1) * 8) / columns;
  text(slide, t("slide.risks.highPriority").toUpperCase(), PAD_X, top, listW, 18, { bold: true, fontSize: pt(13), color: c(palette.faint) });
  risksForSlide(report).forEach((risk, i) => {
    const x = PAD_X + (i % columns) * (cardW + 8);
    const y = top + 26 + Math.floor(i / columns) * 76;
    box(ctx, slide, x, y, cardW, 68);
    const arrow = risk.trend === "worsening" ? "↑" : risk.trend === "improving" ? "↓" : "–";
    text(slide, risk.name, x + 12, y + 10, cardW - 44, 20, { bold: true, fontSize: pt(15), color: c(palette.text) });
    text(slide, arrow, x + cardW - 28, y + 8, 16, 20, { bold: true, fontSize: pt(16), color: c(riskTrendColor[risk.trend]) });
    if (risk.description) {
      text(slide, risk.description, x + 12, y + 32, cardW - 24, 30, { fontSize: pt(13), color: c(palette.muted) });
    }
  });

  if (report.showRiskMatrix) {
    const mx = PAD_X + listW + 20;
    const mw = CONTENT_W - listW - 20;
    text(slide, t("slide.risks.distribution").toUpperCase(), mx, top, mw, 18, { bold: true, fontSize: pt(13), color: c(palette.faint) });
    const headers = [t("slide.risks.mLow"), t("slide.risks.mMed"), t("slide.risks.mHigh"), t("slide.risks.mCrit")];
    const headerCell = (value: string): PptxGenJS.TableCell => ({
      text: value.toUpperCase(),
      options: { bold: true, color: c(palette.faint), fontSize: pt(11), align: "center", valign: "middle" },
    });
    const rows: PptxGenJS.TableRow[] = [
      [headerCell(""), ...headers.map(headerCell)],
      ...LEVELS.map((likelihood, row) => [
        headerCell(headers[row].charAt(0)),
        ...LEVELS.map((impact): PptxGenJS.TableCell => {
          const count = report.topRisks.filter((r) => r.likelihood === likelihood && r.businessImpact === impact).length;
          const tone = matrixCell[matrixTone(likelihood, impact)];
          return {
            text: count ? String(count) : "",
            options: { fill: { color: c(tone.bg) }, color: c(tone.fg), bold: true, fontSize: pt(14), align: "center", valign: "middle" },
          };
        }),
      ]),
    ];
    slide.addTable(rows, {
      x: u(mx),
      y: u(top + 26),
      w: u(mw),
      colW: [u(mw * 0.12), ...Array(4).fill(u(mw * 0.22))],
      rowH: [u(24), ...Array(4).fill(u(50))],
      fontFace: FONT,
      border: { type: "solid", color: "FFFFFF", pt: 2 },
      margin: 0,
    });
    text(slide, `${t("ed.risks.likelihood")} ↓   ·   ${t("ed.risks.impact")} →`.toUpperCase(), mx, top + 256, mw, 18, {
      bold: true,
      fontSize: pt(11),
      color: c(palette.faint),
      align: "center",
    });
  }
}

const TREND_ARROW: Record<DomainTrend, string> = { more: "↗", stable: "–", less: "↘" };

function listSlide(ctx: Ctx, title: string, items: DomainItem[], emptyKey: "slide.threat.none" | "slide.domain.none", showTrend: boolean) {
  const { t } = ctx;
  const slide = frame(ctx, title);
  const visible = items.filter((item) => item.text.trim());
  if (visible.length === 0) {
    emptyNote(slide, t(emptyKey));
    return;
  }
  const shown = visible.slice(0, SLIDE_LIMITS.domainItems);
  const cardW = (CONTENT_W - 12) / 2;
  const cardH = 112;
  shown.forEach((item, i) => {
    const x = PAD_X + (i % 2) * (cardW + 12);
    const y = CONTENT_TOP + Math.floor(i / 2) * (cardH + 12);
    box(ctx, slide, x, y, cardW, cardH);
    text(slide, TREND_ARROW[item.trend], x + 16, y + 14, 24, 24, { bold: true, fontSize: pt(16), color: c(palette.muted), align: "center" });
    text(slide, item.text, x + 52, y + 14, cardW - 68, 22, { bold: true, fontSize: pt(15), color: c(palette.text) });
    if (item.detail) {
      text(slide, item.detail, x + 52, y + 38, cardW - 68, showTrend ? 44 : 60, { fontSize: pt(13), color: c(palette.body) });
    }
    if (showTrend) {
      text(slide, t(`trend.${item.trend}`).toUpperCase(), x + 52, y + cardH - 26, cardW - 68, 16, { bold: true, fontSize: pt(11), color: c(palette.muted) });
    }
  });
  moreNote(ctx, slide, visible.length - shown.length, CONTENT_TOP + 3 * (cardH + 12));
}

function kpiSlide(ctx: Ctx) {
  const { report, t, pptx } = ctx;
  const slide = frame(ctx, t("ed.kpi.title"));
  if (report.kpis.length === 0) {
    emptyNote(slide, t("slide.kpi.none"));
    return;
  }
  const cardW = (CONTENT_W - 24) / 3;
  const cardH = (CONTENT_BOTTOM - CONTENT_TOP - 12) / 2;
  report.kpis.slice(0, SLIDE_LIMITS.kpis).forEach((kpi, i) => {
    const x = PAD_X + (i % 3) * (cardW + 12);
    const y = CONTENT_TOP + Math.floor(i / 3) * (cardH + 12);
    const colors = trendColors(kpi);
    box(ctx, slide, x, y, cardW, cardH);
    text(slide, kpi.name.toUpperCase(), x + 14, y + 14, cardW - 60, 32, { bold: true, fontSize: pt(12), color: c(palette.muted) });
    const arrow = kpi.trend === "up" ? "↗" : kpi.trend === "down" ? "↘" : "–";
    text(slide, arrow, x + cardW - 42, y + 12, 28, 28, {
      shape: pptx.ShapeType.roundRect,
      fill: { color: c(colors.bg) },
      color: c(colors.fg),
      bold: true,
      fontSize: pt(16),
      align: "center",
      valign: "middle",
    });
    slide.addText(
      [
        { text: String(kpi.value), options: { bold: true, fontSize: pt(30), color: c(palette.text) } },
        { text: kpi.unit ? ` ${kpi.unit}` : "", options: { fontSize: pt(14), color: c(palette.muted) } },
      ],
      { x: u(x + 14), y: u(y + 48), w: u(cardW - 28), h: u(40), fontFace: FONT, margin: 0, valign: "bottom" },
    );
    if (kpi.targetValue !== undefined) {
      text(slide, t("slide.kpi.target", { value: kpi.targetValue }), x + 14, y + 92, cardW - 28, 18, { fontSize: pt(12), color: c(palette.muted) });
    }
    const series = kpiSeries(kpi, report);
    if (series.length >= 2) {
      slide.addChart(
        pptx.ChartType.line,
        [{ name: kpi.name || "KPI", labels: series.map((p) => p.quarter), values: series.map((p) => p.value) }],
        {
          x: u(x + 8),
          y: u(y + cardH - 110),
          w: u(cardW - 16),
          h: u(100),
          chartColors: [c(ctx.accent.text)],
          lineSize: 2,
          lineDataSymbolSize: 5,
          showLegend: false,
          valAxisHidden: true,
          catAxisLabelFontSize: 8,
          catAxisLabelColor: c(palette.faint),
          catAxisLineShow: false,
          valGridLine: { color: c(palette.border), style: "dash", size: 0.5 },
          catGridLine: { style: "none" },
        },
      );
    }
  });
}

function incidentsSlide(ctx: Ctx) {
  const { report, t } = ctx;
  const slide = frame(ctx, t("ed.inc.title"));
  if (report.incidents.length === 0) {
    emptyNote(slide, t("slide.incidents.none"));
    return;
  }
  const cardH = 150;
  report.incidents.slice(0, SLIDE_LIMITS.incidents).forEach((incident, i) => {
    const y = CONTENT_TOP + i * (cardH + 12);
    const severity = incident.severity || "medium";
    box(ctx, slide, PAD_X, y, CONTENT_W, cardH);
    text(slide, incident.title, PAD_X + 16, y + 14, CONTENT_W - 180, 24, { bold: true, fontSize: pt(17), color: c(palette.text) });
    badge(ctx, slide, t(`enum.${severity}`), PAD_X + CONTENT_W - 16, y + 14, levelColor[severity]);
    const lines = [
      [t("slide.incidents.businessImpact"), incident.businessImpact],
      [t("slide.incidents.outcome"), incident.outcome],
      ...(incident.lessonsLearned ? [[t("slide.incidents.lesson"), incident.lessonsLearned]] : []),
    ];
    const runs: PptxGenJS.TextProps[] = lines.flatMap(([label, value]) => [
      { text: `${label} `, options: { bold: true, color: c("#334155") } },
      { text: value, options: { breakLine: true } },
    ]);
    slide.addText(runs, {
      x: u(PAD_X + 16),
      y: u(y + 46),
      w: u(CONTENT_W - 32),
      h: u(cardH - 56),
      fontFace: FONT,
      fontSize: pt(14),
      color: c(palette.body),
      margin: 0,
      valign: "top",
      fit: "shrink",
    });
  });
  moreNote(ctx, slide, report.incidents.length - SLIDE_LIMITS.incidents, CONTENT_TOP + 3 * (cardH + 12));
}

function initiativesSlide(ctx: Ctx) {
  const { report, t, pptx } = ctx;
  const slide = frame(ctx, t("slide.initiatives.title"));
  if (report.initiatives.length === 0) {
    emptyNote(slide, t("slide.initiatives.none"));
    return;
  }
  const cardW = (CONTENT_W - 12) / 2;
  const cardH = 150;
  const shown = report.initiatives.slice(0, SLIDE_LIMITS.initiatives);
  shown.forEach((initiative, i) => {
    const x = PAD_X + (i % 2) * (cardW + 12);
    const y = CONTENT_TOP + Math.floor(i / 2) * (cardH + 12);
    const color = statusColor[initiative.status];
    box(ctx, slide, x, y, cardW, cardH);
    text(slide, initiative.name, x + 14, y + 14, cardW - 170, 36, { bold: true, fontSize: pt(15), color: c(palette.text) });
    badge(ctx, slide, t(`slide.status.${initiative.status}`), x + cardW - 14, y + 14, color);
    const barW = cardW - 28 - 52;
    slide.addShape(pptx.ShapeType.roundRect, { x: u(x + 14), y: u(y + 58), w: u(barW), h: u(6), fill: { color: c(palette.border) }, line: { color: c(palette.border), width: 0 }, rectRadius: 0.5 });
    if (initiative.progress > 0) {
      slide.addShape(pptx.ShapeType.roundRect, { x: u(x + 14), y: u(y + 58), w: u((barW * initiative.progress) / 100), h: u(6), fill: { color: c(color) }, line: { color: c(color), width: 0 }, rectRadius: 0.5 });
    }
    text(slide, `${initiative.progress}%`, x + cardW - 60, y + 52, 46, 18, { bold: true, fontSize: pt(13), color: c(palette.body), align: "right" });
    let noteY = y + 78;
    if (initiative.statusNote) {
      text(slide, t("slide.initiatives.status", { text: initiative.statusNote }), x + 14, noteY, cardW - 28, 32, { fontSize: pt(12) });
      noteY += 34;
    }
    if (initiative.blockers) {
      text(slide, t("slide.initiatives.blockers", { text: initiative.blockers }), x + 14, noteY, cardW - 28, y + cardH - noteY - 8, { fontSize: pt(12), color: c(palette.blocker) });
    }
  });
  moreNote(ctx, slide, report.initiatives.length - shown.length, CONTENT_TOP + 3 * (cardH + 12));
}

function outlookSlide(ctx: Ctx) {
  const { report, t } = ctx;
  const slide = frame(ctx, t("slide.outlook.title"));
  const risks = report.emergingRisks.filter((r) => r.description.trim()).slice(0, SLIDE_LIMITS.emergingRisks);
  const boxH = risks.length ? 220 : CONTENT_BOTTOM - CONTENT_TOP;
  if (report.outlook) {
    box(ctx, slide, PAD_X, CONTENT_TOP, CONTENT_W, boxH);
    text(slide, report.outlook, PAD_X + 16, CONTENT_TOP + 16, CONTENT_W - 32, boxH - 32, { fontSize: pt(18), lineSpacingMultiple: 1.3 });
  } else {
    emptyNote(slide, t("slide.outlook.none"));
  }
  if (risks.length) {
    let y = CONTENT_TOP + boxH + 20;
    text(slide, t("slide.outlook.keyEmerging").toUpperCase(), PAD_X, y, CONTENT_W, 18, { bold: true, fontSize: pt(13), color: c(palette.muted) });
    y += 28;
    for (const risk of risks) {
      box(ctx, slide, PAD_X, y, CONTENT_W, 50);
      text(slide, risk.description, PAD_X + 16, y + 12, CONTENT_W - 160, 26, { fontSize: pt(16), color: c("#334155"), valign: "middle" });
      badge(ctx, slide, t(`enum.${risk.impact}`), PAD_X + CONTENT_W - 16, y + 14, levelColor[risk.impact]);
      y += 58;
    }
  }
}

function decisionsSlide(ctx: Ctx) {
  const { report, t, pptx } = ctx;
  const slide = frame(ctx, t("section.decisionsRequired"));
  if (report.decisionsRequired.length === 0) {
    emptyNote(slide, t("slide.decisions.none"));
    return;
  }
  const cardH = 112;
  const shown = report.decisionsRequired.slice(0, SLIDE_LIMITS.decisions);
  shown.forEach((decision, i) => {
    const y = CONTENT_TOP + i * (cardH + 10);
    box(ctx, slide, PAD_X, y, CONTENT_W, cardH);
    text(slide, String(i + 1), PAD_X + 16, y + 14, 28, 28, {
      shape: pptx.ShapeType.roundRect,
      fill: { color: c(ctx.accent.fill) },
      color: c(ctx.accent.onFill),
      bold: true,
      fontSize: pt(13),
      align: "center",
      valign: "middle",
    });
    text(slide, decision.title, PAD_X + 56, y + 14, CONTENT_W - 72, 28, { bold: true, fontSize: pt(18), color: c(palette.text), valign: "middle" });
    slide.addText(
      [
        { text: `${t("slide.decisions.rationale")} `, options: { bold: true, color: c("#334155") } },
        { text: decision.rationale, options: { breakLine: true } },
        { text: `${t("slide.decisions.impact")} `, options: { bold: true, color: c("#334155") } },
        { text: decision.impact },
      ],
      { x: u(PAD_X + 56), y: u(y + 48), w: u(CONTENT_W - 72), h: u(cardH - 56), fontFace: FONT, fontSize: pt(15), color: c(palette.body), margin: 0, valign: "top", fit: "shrink" },
    );
  });
  moreNote(ctx, slide, report.decisionsRequired.length - shown.length, CONTENT_TOP + SLIDE_LIMITS.decisions * (cardH + 10));
}

const BUILDERS: Record<SlideId, (ctx: Ctx) => void> = {
  title: titleSlide,
  executiveSummary: executiveSummarySlide,
  topRisks: topRisksSlide,
  threatLandscape: (ctx) => listSlide(ctx, ctx.t("slide.threat.title"), ctx.report.threatLandscape, "slide.threat.none", true),
  kpis: kpiSlide,
  incidents: incidentsSlide,
  processItems: (ctx) => listSlide(ctx, ctx.t("slide.process.title"), ctx.report.processItems, "slide.domain.none", false),
  humanItems: (ctx) => listSlide(ctx, ctx.t("slide.human.title"), ctx.report.humanItems, "slide.domain.none", false),
  technologyItems: (ctx) => listSlide(ctx, ctx.t("slide.technology.title"), ctx.report.technologyItems, "slide.domain.none", false),
  initiatives: initiativesSlide,
  outlook: outlookSlide,
  decisionsRequired: decisionsSlide,
};

function imageSize(dataUrl: string): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export async function buildPptx(
  report: Report,
  settings: Pick<AppSettings, "logo" | "primaryColor">,
  t: TFunction,
  lang: AppLanguage,
): Promise<Blob> {
  const { default: PptxGenJSClass } = await import("pptxgenjs");
  const pptx = new PptxGenJSClass();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = `${report.quarter} ${report.year} – ${report.title.trim() || t("report.defaultTitle")}`;
  pptx.author = report.presenter.trim() || report.createdBy;
  pptx.company = "";

  const size = settings.logo ? await imageSize(settings.logo) : null;
  const slides = visibleSlides(report);
  const ctx: Ctx = {
    pptx,
    report,
    t,
    lang,
    accent: accentFor(settings.primaryColor),
    logo: settings.logo && size ? { data: settings.logo, ...size } : null,
    page: 0,
    total: slides.length,
  };

  for (const [index, slide] of slides.entries()) {
    ctx.page = index + 1;
    BUILDERS[slide.id](ctx);
  }

  return (await pptx.write({ outputType: "blob", compression: true })) as Blob;
}
