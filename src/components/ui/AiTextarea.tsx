import { useState, type ComponentProps } from "react";
import { Loader2, Maximize2, Minimize2, RefreshCw, Sparkles, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/settings";
import { useT } from "@/lib/i18n";
import { useReportContext } from "@/lib/reportContext";
import { assistText, type AiAction } from "@/lib/openrouter";

interface AiTextareaProps extends Omit<ComponentProps<"textarea">, "value" | "onChange"> {
  value: string;
  onValueChange: (value: string) => void;
  aiLabel: string;
  aiContext?: string;
}

export function AiTextarea({
  value,
  onValueChange,
  aiLabel,
  aiContext,
  className,
  ...textareaProps
}: AiTextareaProps) {
  const { settings } = useSettings();
  const t = useT();
  const getContext = useReportContext();
  const [busy, setBusy] = useState<AiAction | null>(null);
  const [error, setError] = useState("");
  const [previous, setPrevious] = useState<string | null>(null);

  const aiEnabled = Boolean(settings.openRouterApiKey.trim());
  const hasText = value.trim().length > 0;

  const run = async (action: AiAction) => {
    setError("");
    setBusy(action);
    try {
      const result = await assistText({
        action,
        fieldLabel: aiLabel,
        fieldText: value,
        context: getContext(),
        itemContext: aiContext,
        settings,
      });
      setPrevious(value);
      onValueChange(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI request failed.");
    } finally {
      setBusy(null);
    }
  };

  const undo = () => {
    if (previous === null) {
      return;
    }
    onValueChange(previous);
    setPrevious(null);
  };

  return (
    <div>
      <textarea
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className={cn("form-input", className)}
        {...textareaProps}
        disabled={busy !== null || textareaProps.disabled}
      />

      {aiEnabled && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <button
            type="button"
            className="cbr-btn cbr-btn-ghost cbr-btn-xs"
            onClick={() => void run("fill")}
            disabled={busy !== null}
            title={t("ai.fillTitle")}
          >
            <Sparkles size={12} />
            {t("ai.fill")}
          </button>
          <button
            type="button"
            className="cbr-btn cbr-btn-ghost cbr-btn-xs"
            onClick={() => void run("rephrase")}
            disabled={busy !== null || !hasText}
            title={t("ai.rephraseTitle")}
          >
            <RefreshCw size={12} />
            {t("ai.rephrase")}
          </button>
          <button
            type="button"
            className="cbr-btn cbr-btn-ghost cbr-btn-xs"
            onClick={() => void run("summarize")}
            disabled={busy !== null || !hasText}
            title={t("ai.summarizeTitle")}
          >
            <Minimize2 size={12} />
            {t("ai.summarize")}
          </button>
          <button
            type="button"
            className="cbr-btn cbr-btn-ghost cbr-btn-xs"
            onClick={() => void run("extend")}
            disabled={busy !== null || !hasText}
            title={t("ai.extendTitle")}
          >
            <Maximize2 size={12} />
            {t("ai.extend")}
          </button>

          {previous !== null && busy === null && (
            <button
              type="button"
              className="cbr-btn cbr-btn-ghost cbr-btn-xs"
              onClick={undo}
              title={t("ai.undo")}
            >
              <Undo2 size={12} />
              {t("ai.undo")}
            </button>
          )}

          {busy !== null && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Loader2 size={12} className="animate-spin" />
              {t("ai.working")}
            </span>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
