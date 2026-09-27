import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
  busy?: boolean;
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  danger = false,
  busy = false,
}: ConfirmDialogProps) {
  const t = useT();
  return (
    <Modal title={title} description={body} onClose={onCancel} busy={busy}>
      <div className="flex justify-end gap-2">
        <button type="button" className="cbr-btn cbr-btn-ghost" onClick={onCancel} disabled={busy}>
          {t("common.cancel")}
        </button>
        <button
          type="button"
          className={`cbr-btn ${danger ? "cbr-btn-danger" : "cbr-btn-primary"}`}
          onClick={onConfirm}
          disabled={busy}
          data-autofocus
        >
          {busy && <Loader2 size={14} className="animate-spin" aria-hidden />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
