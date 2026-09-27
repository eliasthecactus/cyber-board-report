import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useT } from "@/lib/i18n";

interface ToastProps {
  message: string;
  onDismiss: () => void;
  action?: { label: string; onClick: () => void };
  /** Auto-dismiss after this many ms; 0 keeps it until dismissed. */
  duration?: number;
}

/** Bottom-centre status message, announced to screen readers. */
export function Toast({ message, onDismiss, action, duration = 8000 }: ToastProps) {
  const t = useT();
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!duration) {
      return;
    }
    const timer = window.setTimeout(() => onDismissRef.current(), duration);
    return () => window.clearTimeout(timer);
  }, [duration, message]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-[60] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg"
    >
      <span>{message}</span>
      {action && (
        <button
          type="button"
          className="rounded px-2 py-1 font-semibold text-sky-300 hover:bg-white/10"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
      <button
        type="button"
        className="rounded p-1 text-slate-300 hover:bg-white/10"
        onClick={onDismiss}
        aria-label={t("common.dismiss")}
      >
        <X size={14} aria-hidden />
      </button>
    </div>
  );
}
