import { ArrowDownRight, ArrowUpRight, Minus, Plus, Trash2 } from "lucide-react";
import type { DomainTrend } from "@/types";
import { createId } from "@/lib/reportFactory";
import { AiTextarea } from "@/components/ui/AiTextarea";
import { useT } from "@/lib/i18n";

export interface ListItem {
  id: string;
  text: string;
  detail?: string;
  trend: DomainTrend;
}

interface ItemListEditorProps<T extends ListItem> {
  data: T[];
  onUpdate: (data: T[]) => void;
  idPrefix: string;
  titleKey: string;
  descKey: string;
  placeholderKey: string;
  detailPlaceholderKey: string;
  addKey: string;
  emptyKey: string;
  tipKey?: string;
  aiLabelKey: string;
}

const trendIcon: Record<DomainTrend, typeof Minus> = {
  more: ArrowUpRight,
  stable: Minus,
  less: ArrowDownRight,
};

// Neutral color: the arrow conveys direction; we don't imply good vs. bad.
const TREND_COLOR = "#64748b";

export default function ItemListEditor<T extends ListItem>({
  data,
  onUpdate,
  idPrefix,
  titleKey,
  descKey,
  placeholderKey,
  detailPlaceholderKey,
  addKey,
  emptyKey,
  tipKey,
  aiLabelKey,
}: ItemListEditorProps<T>) {
  const t = useT();

  const addItem = () => {
    onUpdate([...data, { id: createId(idPrefix), text: "", detail: "", trend: "stable" } as T]);
  };

  const updateItem = (id: string, patch: Partial<ListItem>) => {
    onUpdate(data.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeItem = (id: string) => {
    onUpdate(data.filter((item) => item.id !== id));
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{t(titleKey)}</h2>
      <p className="text-sm text-slate-500 mb-5">{t(descKey)}</p>

      {data.length === 0 ? (
        <p className="mb-4 text-sm text-slate-400">{t(emptyKey)}</p>
      ) : (
        <div className="mb-4 flex flex-col gap-3">
          {data.map((item) => {
            const TrendIcon = trendIcon[item.trend];
            return (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center gap-2.5">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white"
                    style={{ color: TREND_COLOR }}
                  >
                    <TrendIcon size={16} />
                  </span>
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => updateItem(item.id, { text: e.target.value })}
                    placeholder={t(placeholderKey)}
                    className="form-input min-w-0 flex-1 font-semibold"
                  />
                  <div className="w-36 shrink-0">
                    <select
                      value={item.trend}
                      onChange={(e) =>
                        updateItem(item.id, { trend: e.target.value as DomainTrend })
                      }
                      className="form-input form-input-sm"
                    >
                      <option value="more">{t("trend.more")}</option>
                      <option value="stable">{t("trend.stable")}</option>
                      <option value="less">{t("trend.less")}</option>
                    </select>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="cbr-btn cbr-btn-ghost cbr-btn-sm cbr-btn-icon shrink-0 text-red-500"
                    aria-label={t("common.remove")}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="pl-[38px]">
                  <AiTextarea
                    value={item.detail || ""}
                    onValueChange={(value) => updateItem(item.id, { detail: value })}
                    aiLabel={t(aiLabelKey)}
                    aiContext={item.text}
                    placeholder={t(detailPlaceholderKey)}
                    rows={2}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button onClick={addItem} className="cbr-btn cbr-btn-primary cbr-btn-sm">
        <Plus size={16} className="mr-1" />
        {t(addKey)}
      </button>

      {tipKey && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mt-5">
          <span>{t(tipKey)}</span>
        </div>
      )}
    </div>
  );
}
