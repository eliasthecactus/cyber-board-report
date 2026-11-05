import { Trash2 } from "lucide-react";
import type { BriefBlock, Report } from "@/types";
import { useT } from "@/lib/i18n";
import { MAX_BLOCK_ITEMS } from "@/lib/briefGrid";
import { AiTextarea } from "@/components/ui/AiTextarea";
import { NumberInput } from "@/components/ui/NumberInput";
import { blockDefinition, type BlockField } from "./blockRegistry";

interface BlockPropertiesProps {
  block: BriefBlock;
  report: Report;
  onChange: (patch: Partial<Pick<BriefBlock, "title">> & { options?: Record<string, unknown> }) => void;
  onDelete: () => void;
}

function Field({
  field,
  options,
  report,
  onOption,
}: {
  field: BlockField;
  options: Record<string, unknown>;
  report: Report;
  onOption: (key: string, value: unknown) => void;
}) {
  const t = useT();
  const value = options[field.key];

  switch (field.kind) {
    case "text":
      return (
        <AiTextarea
          aiLabel={t(field.label)}
          aria-label={t(field.label)}
          value={value as string}
          onValueChange={(next) => onOption(field.key, next)}
          rows={6}
        />
      );
    case "toggle":
      return (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
          <input
            type="checkbox"
            className="h-4 w-4 accent-white"
            checked={value as boolean}
            onChange={(event) => onOption(field.key, event.target.checked)}
          />
          {t(field.label)}
        </label>
      );
    case "count":
      return (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-white/55">{t(field.label)}</span>
          <NumberInput
            className="form-input form-input-sm"
            min={1}
            max={MAX_BLOCK_ITEMS}
            value={value as number}
            onValueChange={(next) => onOption(field.key, Math.min(MAX_BLOCK_ITEMS, Math.max(1, next ?? 1)))}
          />
        </label>
      );
    case "select":
      return (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-white/55">{t(field.label)}</span>
          <select
            className="form-input form-input-sm"
            value={value as string}
            onChange={(event) => onOption(field.key, event.target.value)}
          >
            {field.choices.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {t(choice.label)}
              </option>
            ))}
          </select>
        </label>
      );
    case "picks": {
      const picked = value as string[];
      const items = field.items(report).filter((item) => item.name.trim());
      if (items.length === 0) {
        return null;
      }
      return (
        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-1 p-0 text-xs font-medium text-white/55">{t(field.label)}</legend>
          <div className="flex max-h-44 flex-col gap-1 overflow-y-auto">
            {items.map((item) => (
              <label key={item.id} className="flex cursor-pointer items-start gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 accent-white"
                  checked={picked.includes(item.id)}
                  onChange={(event) =>
                    onOption(
                      field.key,
                      event.target.checked ? [...picked, item.id] : picked.filter((id) => id !== item.id),
                    )
                  }
                />
                <span className="min-w-0">{item.name}</span>
              </label>
            ))}
          </div>
          <p className="mb-0 mt-1 text-xs text-white/50">{t(field.hint)}</p>
        </fieldset>
      );
    }
  }
}

/** Settings of the selected block. The fields come from the block registry. */
export function BlockProperties({ block, report, onChange, onDelete }: BlockPropertiesProps) {
  const t = useT();
  const definition = blockDefinition(block);
  const options = block.options as Record<string, unknown>;
  const Icon = definition.Icon;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="m-0 flex items-center gap-2 text-sm font-semibold text-white">
        <Icon size={15} aria-hidden />
        {t(definition.label)}
      </h2>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-white/55">{t("brief.props.heading")}</span>
        <input
          type="text"
          className="form-input form-input-sm"
          placeholder={t("brief.props.headingPlaceholder")}
          value={block.title}
          onChange={(event) => onChange({ title: event.target.value })}
        />
      </label>

      {definition.fields.map((field) => (
        <Field
          key={field.key}
          field={field}
          options={options}
          report={report}
          onOption={(key, value) => onChange({ options: { ...options, [key]: value } })}
        />
      ))}

      <button type="button" className="cbr-btn cbr-btn-danger cbr-btn-sm mt-2 self-start" onClick={onDelete}>
        <Trash2 size={14} aria-hidden />
        {t("brief.props.delete")}
      </button>
    </div>
  );
}
