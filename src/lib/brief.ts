import type { Brief, BriefBlock, BriefBlockOf, BriefBlockOptions, BriefBlockType, BriefRect, Report } from "@/types";
import type { TFunction } from "@/lib/i18n";
import { BLOCK_SPECS } from "@/lib/briefGrid";
import { createId } from "@/lib/reportFactory";

/** A new block with the type's default options. */
export function createBlock<T extends BriefBlockType>(
  type: T,
  rect: BriefRect,
  options: Partial<BriefBlockOptions[T]> = {},
): BriefBlockOf<T> {
  return {
    id: createId("block"),
    type,
    ...rect,
    title: "",
    options: { ...structuredClone(BLOCK_SPECS[type].options), ...options },
  };
}

/** The starting point: risk position, what changed, measures and decisions. */
export function createDefaultBrief(t: TFunction): Brief {
  const blocks = (...items: BriefBlock[]) => items;
  return {
    title: "",
    audience: t("brief.defaultAudience"),
    footerNote: t("brief.defaultFooterNote"),
    slides: [
      {
        id: createId("slide"),
        title: t("brief.template.position"),
        blocks: blocks(
          createBlock("headline", { x: 0, y: 0, w: 12, h: 1 }),
          createBlock("stat", { x: 0, y: 1, w: 3, h: 1 }, { metric: "criticalRisks" }),
          createBlock("stat", { x: 3, y: 1, w: 3, h: 1 }, { metric: "worseningRisks" }),
          createBlock("stat", { x: 6, y: 1, w: 3, h: 1 }, { metric: "seriousIncidents" }),
          createBlock("stat", { x: 9, y: 1, w: 3, h: 1 }, { metric: "openDecisions" }),
          createBlock("riskMatrix", { x: 0, y: 2, w: 4, h: 6 }),
          createBlock("riskTable", { x: 4, y: 2, w: 8, h: 6 }, { count: 6 }),
        ),
      },
      {
        id: createId("slide"),
        title: t("brief.template.changes"),
        blocks: blocks(
          createBlock("riskMovement", { x: 0, y: 0, w: 5, h: 4 }),
          createBlock("items", { x: 5, y: 0, w: 7, h: 4 }),
          createBlock("incidents", { x: 0, y: 4, w: 7, h: 4 }),
          createBlock("emergingRisks", { x: 7, y: 4, w: 5, h: 4 }),
        ),
      },
      {
        id: createId("slide"),
        title: t("brief.template.measures"),
        blocks: blocks(
          createBlock("initiatives", { x: 0, y: 0, w: 6, h: 4 }),
          createBlock("kpis", { x: 6, y: 0, w: 6, h: 4 }, { showChart: true }),
          createBlock("decisions", { x: 0, y: 4, w: 7, h: 4 }),
          createBlock("outlook", { x: 7, y: 4, w: 5, h: 4 }),
        ),
      },
    ],
  };
}

export const riskKey = (name: string) => name.trim().toLowerCase();

/**
 * Translate ids picked in one report to the matching items of another. Ids
 * don't survive copying a section between quarters, so items match by name.
 */
function remapIds(
  ids: string[],
  from: readonly { id: string; name: string }[],
  to: readonly { id: string; name: string }[],
): string[] {
  return ids.flatMap((id) => {
    const source = from.find((item) => item.id === id);
    const target = source && to.find((item) => riskKey(item.name) === riskKey(source.name));
    return target ? [target.id] : [];
  });
}

/** A copy of `source`'s brief for `target`, with new ids and picks remapped. */
export function copyBriefFrom(source: Report, target: Report): Brief | null {
  if (!source.brief) {
    return null;
  }
  const copy = structuredClone(source.brief);
  return {
    ...copy,
    slides: copy.slides.map((slide) => ({
      ...slide,
      id: createId("slide"),
      blocks: slide.blocks.map((block): BriefBlock => {
        const fresh = { ...block, id: createId("block") };
        if (fresh.type === "riskTable") {
          const riskIds = remapIds(fresh.options.riskIds, source.topRisks, target.topRisks);
          return { ...fresh, options: { ...fresh.options, riskIds } };
        }
        if (fresh.type === "kpis") {
          const kpiIds = remapIds(fresh.options.kpiIds, source.kpis, target.kpis);
          return { ...fresh, options: { ...fresh.options, kpiIds } };
        }
        return fresh;
      }),
    })),
  };
}
