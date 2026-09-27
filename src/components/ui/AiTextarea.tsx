import { useState, type ComponentProps } from "react";
import { Eye, Loader2, Maximize2, Minimize2, RefreshCw, Sparkles, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/settings";
import { useT } from "@/lib/i18n";
import { describeError } from "@/lib/errors";
import { useReportContext } from "@/lib/reportContext";
import { assistText, buildAssistMessages, type AiAction, type ChatMessage } from "@/lib/openrouter";
import { Modal } from "./Modal";

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
  const [preview, setPreview] = useState<ChatMessage[] | null>(null);

  const aiEnabled = Boolean(settings.openRouterApiKey.trim());
  const hasText = value.trim().length > 0;

  const params = (action: AiAction) => ({
    action,
    fieldLabel: aiLabel,
    fieldText: value,
    context: getContext(),
    itemContext: aiContext,
    settings,
  });

  const run = async (action: AiAction) => {
    setError("");
    setBusy(action);
    try {
      const result = await assistText(params(action));
      setPrevious(value);
      onValueChange(result);
    } catch (err) {
      setError(describeError(t, err, "error.ai.generic"));
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

  const actions: { action: AiAction; Icon: typeof Sparkles; needsText: boolean }[] = [
    { action: "fill", Icon: Sparkles, needsText: false },
    { action: "rephrase", Icon: RefreshCw, needsText: true },
    { action: "summarize", Icon: Minimize2, needsText: true },
    { action: "extend", Icon: Maximize2, needsText: true },
  ];

  return (
    <div>
      <textarea
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className={cn("form-input", className)}
        {...textareaProps}
        disabled={busy !== null || textareaProps.disabled}
        aria-busy={busy !== null}
      />

      {aiEnabled && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {actions.map(({ action, Icon, needsText }) => (
            <button
              key={action}
              type="button"
              className="cbr-btn cbr-btn-ghost cbr-btn-xs"
              onClick={() => void run(action)}
              disabled={busy !== null || (needsText && !hasText)}
              title={t(`ai.${action}Title`)}
            >
              <Icon size={12} aria-hidden />
              {t(`ai.${action}`)}
            </button>
          ))}

          <button
            type="button"
            className="cbr-btn cbr-btn-ghost cbr-btn-xs"
            onClick={() => setPreview(buildAssistMessages(params("fill")))}
            disabled={busy !== null}
            title={t("ai.previewTitle")}
          >
            <Eye size={12} aria-hidden />
            {t("ai.preview")}
          </button>

          {previous !== null && busy === null && (
            <button type="button" className="cbr-btn cbr-btn-ghost cbr-btn-xs" onClick={undo}>
              <Undo2 size={12} aria-hidden />
              {t("ai.undo")}
            </button>
          )}

          {busy !== null && (
            <span className="flex items-center gap-1 text-xs text-slate-500" role="status">
              <Loader2 size={12} className="animate-spin" aria-hidden />
              {t("ai.working")}
            </span>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}

      {preview && (
        <Modal
          title={t("ai.previewDialogTitle")}
          description={t("ai.previewDialogDesc", { model: settings.openRouterModel })}
          onClose={() => setPreview(null)}
          className="max-w-3xl"
        >
          <div className="flex flex-col gap-3">
            {preview.map((message) => (
              <section key={message.role}>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {message.role === "system" ? t("ai.previewSystem") : t("ai.previewUser")}
                </h3>
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  {message.content}
                </pre>
              </section>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <button type="button" className="cbr-btn cbr-btn-primary" onClick={() => setPreview(null)} data-autofocus>
              {t("common.close")}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
