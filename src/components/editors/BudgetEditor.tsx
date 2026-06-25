import { BudgetResources } from "@/types";
import { AiTextarea } from "@/components/ui/AiTextarea";
import { useT } from "@/lib/i18n";

interface BudgetEditorProps {
  data: BudgetResources;
  onUpdate: (data: BudgetResources) => void;
}

export default function BudgetEditor({ data, onUpdate }: BudgetEditorProps) {
  const t = useT();
  const updateField = (field: keyof BudgetResources, value: string) => {
    onUpdate({ ...data, [field]: value });
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{t("ed.budget.title")}</h2>
      <p className="text-sm text-slate-500 mb-5">{t("ed.budget.desc")}</p>

      <div className="mb-5">
        <label>
          <span className="text-sm font-medium text-slate-700">{t("ed.budget.budgetLabel")}</span>
        </label>
        <AiTextarea
          aiLabel={t("ed.budget.budgetLabel")}
          placeholder={t("ed.budget.budgetPlaceholder")}
          value={data.budget}
          onValueChange={(value) => updateField("budget", value)}
          rows={3}
        />
      </div>

      <div className="mb-5">
        <label>
          <span className="text-sm font-medium text-slate-700">{t("ed.budget.allocationLabel")}</span>
        </label>
        <AiTextarea
          aiLabel={t("ed.budget.allocationLabel")}
          placeholder={t("ed.budget.allocationPlaceholder")}
          value={data.allocation}
          onValueChange={(value) => updateField("allocation", value)}
          rows={3}
        />
      </div>

      <div className="mb-5">
        <label>
          <span className="text-sm font-medium text-slate-700">{t("ed.budget.constraintsLabel")}</span>
        </label>
        <AiTextarea
          aiLabel={t("ed.budget.constraintsLabel")}
          placeholder={t("ed.budget.constraintsPlaceholder")}
          value={data.constraints}
          onValueChange={(value) => updateField("constraints", value)}
          rows={3}
        />
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mt-5">
        <div>
          <span>{t("ed.budget.tip")}</span>
        </div>
      </div>
    </div>
  );
}
