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
  /** Human-readable name of this field, used in the AI prompt. */
  aiLabel: string;
  /**
   * Structured facts about the specific item this field belongs to (e.g. the
   * risk's name, likelihood, impact and trend). Lets the AI write accurate,
   * specific text instead of a generic summary.
   */
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
        className={cn("textarea textarea-bordered w-full", className)}
        {...textareaProps}
        disabled={busy !== null || textareaProps.disabled}
      />

      {aiEnabled && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            className="btn btn-xs btn-ghost gap-1"
            onClick={() => void run("fill")}
            disabled={busy !== null}
            title={t("ai.fillTitle")}
          >
            <Sparkles size={13} />
            {t("ai.fill")}
          </button>
          <button
            type="button"
            className="btn btn-xs btn-ghost gap-1"
            onClick={() => void run("rephrase")}
            disabled={busy !== null || !hasText}
            title={t("ai.rephraseTitle")}
          >
            <RefreshCw size={13} />
            {t("ai.rephrase")}
          </button>
          <button
            type="button"
            className="btn btn-xs btn-ghost gap-1"
            onClick={() => void run("summarize")}
            disabled={busy !== null || !hasText}
            title={t("ai.summarizeTitle")}
          >
            <Minimize2 size={13} />
            {t("ai.summarize")}
          </button>
          <button
            type="button"
            className="btn btn-xs btn-ghost gap-1"
            onClick={() => void run("extend")}
            disabled={busy !== null || !hasText}
            title={t("ai.extendTitle")}
          >
            <Maximize2 size={13} />
            {t("ai.extend")}
          </button>

          {previous !== null && busy === null && (
            <button
              type="button"
              className="btn btn-xs btn-ghost gap-1"
              onClick={undo}
              title={t("ai.undo")}
            >
              <Undo2 size={13} />
              {t("ai.undo")}
            </button>
          )}

          {busy !== null && (
            <span className="flex items-center gap-1 text-xs text-base-content/60">
              <Loader2 size={13} className="animate-spin" />
              {t("ai.working")}
            </span>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
