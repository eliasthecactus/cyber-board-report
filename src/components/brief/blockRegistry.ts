import type { ComponentType } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  Eye,
  Globe,
  Grid3x3,
  Handshake,
  Hash,
  Heading,
  Table2,
  Target,
  Type,
  type LucideIcon,
} from "lucide-react";
import type { BriefBlock, BriefBlockOf, BriefBlockType, BriefMetric, Report } from "@/types";
import type { MessageKey, TFunction } from "@/lib/i18n";
import { BLOCK_SPECS } from "@/lib/briefGrid";
import { selectIncidents, selectInitiatives, selectKpis, selectRisks } from "@/lib/briefMetrics";
import { EmergingRisksBlock, RiskMatrixBlock, RiskMovementBlock, RiskTableBlock } from "./blocks/RiskBlocks";
import { DecisionsBlock, IncidentsBlock, InitiativesBlock, ItemsBlock, KpisBlock } from "./blocks/ListBlocks";
import { HeadlineBlock, headlineText, OutlookBlock, StatBlock, TextBlock } from "./blocks/TextBlocks";
import type { BlockProps } from "./blocks/shared";

/** One editable option, rendered by BlockProperties. */
export type BlockField =
  | { kind: "text"; key: string; label: MessageKey }
  | { kind: "toggle"; key: string; label: MessageKey }
  | { kind: "count"; key: string; label: MessageKey }
  | { kind: "select"; key: string; label: MessageKey; choices: { value: string; label: MessageKey }[] }
  | {
      kind: "picks";
      key: string;
      label: MessageKey;
      hint: MessageKey;
      items: (report: Report) => { id: string; name: string }[];
    };

export interface BlockDefinition<T extends BriefBlockType> {
  label: MessageKey;
  Icon: LucideIcon;
  component: ComponentType<BlockProps<T>>;
  /** "plain" blocks sit directly on the slide, "card" blocks on a tinted surface. */
  surface: "card" | "plain";
  /** Heading above the content: always, only when set by the user, or never (stat tiles use their own). */
  heading: "always" | "custom" | "own";
  /** Default heading, when it differs from the palette label. */
  defaultTitle?: (block: BriefBlockOf<T>, t: TFunction) => string;
  isEmpty: (block: BriefBlockOf<T>, report: Report, prior: Report | null) => boolean;
  fields: BlockField[];
}

const count: BlockField = { kind: "count", key: "count", label: "brief.opt.count" };

const METRICS = BLOCK_SPECS.stat.enums?.metric as readonly BriefMetric[];

export const BLOCKS: { [T in BriefBlockType]: BlockDefinition<T> } = {
  headline: {
    label: "brief.block.headline",
    Icon: Heading,
    component: HeadlineBlock,
    surface: "plain",
    heading: "custom",
    isEmpty: (block, report) => !headlineText(report, block.options.source).trim(),
    fields: [
      {
        kind: "select",
        key: "source",
        label: "brief.opt.source",
        choices: [
          { value: "highlight", label: "brief.opt.source.highlight" },
          { value: "summary", label: "brief.opt.source.summary" },
        ],
      },
    ],
  },
  stat: {
    label: "brief.block.stat",
    Icon: Hash,
    component: StatBlock,
    surface: "card",
    heading: "own",
    isEmpty: () => false,
    fields: [
      {
        kind: "select",
        key: "metric",
        label: "brief.opt.metric",
        choices: METRICS.map((metric) => ({ value: metric, label: `brief.metric.${metric}` as const })),
      },
    ],
  },
  riskMatrix: {
    label: "brief.block.riskMatrix",
    Icon: Grid3x3,
    component: RiskMatrixBlock,
    surface: "card",
    heading: "always",
    isEmpty: (_, report) => report.topRisks.length === 0,
    fields: [],
  },
  riskTable: {
    label: "brief.block.riskTable",
    Icon: Table2,
    component: RiskTableBlock,
    surface: "card",
    heading: "always",
    isEmpty: (block, report) => selectRisks(report, block.options).length === 0,
    fields: [
      count,
      { kind: "toggle", key: "showRatings", label: "brief.opt.showRatings" },
      { kind: "toggle", key: "showDescription", label: "brief.opt.showDescription" },
      { kind: "toggle", key: "showMitigation", label: "brief.opt.showMitigation" },
      { kind: "toggle", key: "showOwner", label: "brief.opt.showOwner" },
      {
        kind: "picks",
        key: "riskIds",
        label: "brief.opt.pickRisks",
        hint: "brief.opt.pickRisksHint",
        items: (report) => report.topRisks,
      },
    ],
  },
  riskMovement: {
    label: "brief.block.riskMovement",
    Icon: ArrowLeftRight,
    component: RiskMovementBlock,
    surface: "card",
    heading: "always",
    isEmpty: (_, __, prior) => prior === null,
    fields: [
      { kind: "toggle", key: "showWorsened", label: "brief.movement.worsened" },
      { kind: "toggle", key: "showNew", label: "brief.movement.added" },
      { kind: "toggle", key: "showImproved", label: "brief.movement.improved" },
      { kind: "toggle", key: "showRemoved", label: "brief.movement.removed" },
    ],
  },
  emergingRisks: {
    label: "brief.block.emergingRisks",
    Icon: AlertTriangle,
    component: EmergingRisksBlock,
    surface: "card",
    heading: "always",
    isEmpty: (_, report) => report.emergingRisks.length === 0,
    fields: [count],
  },
  incidents: {
    label: "brief.block.incidents",
    Icon: AlertCircle,
    component: IncidentsBlock,
    surface: "card",
    heading: "always",
    isEmpty: (block, report) => selectIncidents(report, block.options).length === 0,
    fields: [
      count,
      {
        kind: "select",
        key: "minSeverity",
        label: "brief.opt.minSeverity",
        choices: [
          { value: "low", label: "enum.low" },
          { value: "medium", label: "enum.medium" },
          { value: "high", label: "enum.high" },
          { value: "critical", label: "enum.critical" },
        ],
      },
      { kind: "toggle", key: "showOutcome", label: "brief.opt.showOutcome" },
    ],
  },
  items: {
    label: "brief.block.items",
    Icon: Globe,
    component: ItemsBlock,
    surface: "card",
    heading: "always",
    defaultTitle: (block, t) => t(`section.${block.options.source}`),
    isEmpty: (block, report) => report[block.options.source].every((item) => !item.text.trim()),
    fields: [
      {
        kind: "select",
        key: "source",
        label: "brief.opt.source",
        choices: [
          { value: "threatLandscape", label: "section.threatLandscape" },
          { value: "processItems", label: "section.processItems" },
          { value: "humanItems", label: "section.humanItems" },
          { value: "technologyItems", label: "section.technologyItems" },
        ],
      },
      count,
      { kind: "toggle", key: "showDetail", label: "brief.opt.showDetail" },
    ],
  },
  kpis: {
    label: "brief.block.kpis",
    Icon: BarChart3,
    component: KpisBlock,
    surface: "card",
    heading: "always",
    isEmpty: (block, report) => selectKpis(report, block.options).length === 0,
    fields: [
      count,
      { kind: "toggle", key: "showChart", label: "brief.opt.showChart" },
      { kind: "toggle", key: "showTarget", label: "brief.opt.showTarget" },
      {
        kind: "picks",
        key: "kpiIds",
        label: "brief.opt.pickKpis",
        hint: "brief.opt.pickKpisHint",
        items: (report) => report.kpis,
      },
    ],
  },
  initiatives: {
    label: "brief.block.initiatives",
    Icon: Target,
    component: InitiativesBlock,
    surface: "card",
    heading: "always",
    isEmpty: (block, report) => selectInitiatives(report, block.options).length === 0,
    fields: [
      count,
      {
        kind: "select",
        key: "filter",
        label: "brief.opt.filter",
        choices: [
          { value: "all", label: "brief.opt.filter.all" },
          { value: "needsAttention", label: "brief.opt.filter.needsAttention" },
        ],
      },
    ],
  },
  decisions: {
    label: "brief.block.decisions",
    Icon: Handshake,
    component: DecisionsBlock,
    surface: "card",
    heading: "always",
    isEmpty: (_, report) => report.decisionsRequired.length === 0,
    fields: [count, { kind: "toggle", key: "showRationale", label: "brief.opt.showRationale" }],
  },
  outlook: {
    label: "brief.block.outlook",
    Icon: Eye,
    component: OutlookBlock,
    surface: "card",
    heading: "always",
    isEmpty: (_, report) => !report.outlook.trim(),
    fields: [],
  },
  text: {
    label: "brief.block.text",
    Icon: Type,
    component: TextBlock,
    surface: "card",
    heading: "custom",
    isEmpty: (block) => !block.options.text.trim(),
    fields: [{ kind: "text", key: "text", label: "brief.opt.text" }],
  },
};

/** The definition of a block, for code that handles every block type alike. */
export function blockDefinition(block: BriefBlock): BlockDefinition<BriefBlockType> {
  return BLOCKS[block.type] as unknown as BlockDefinition<BriefBlockType>;
}

/** The heading a block shows, or "" for none. */
export function blockHeading(block: BriefBlock, t: TFunction): string {
  const definition = blockDefinition(block);
  if (definition.heading === "own") {
    return "";
  }
  const custom = block.title.trim();
  if (custom || definition.heading === "custom") {
    return custom;
  }
  return definition.defaultTitle?.(block as never, t) ?? t(definition.label);
}
