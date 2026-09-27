import { AiError } from "@/lib/openrouter";
import { StorageError } from "@/lib/storage";
import type { MessageKey, TFunction } from "@/lib/i18n";

/** Error whose message is a translation key (e.g. thrown by file helpers). */
export class AppError extends Error {
  constructor(public readonly key: MessageKey) {
    super(key);
    this.name = "AppError";
  }
}

/** Turn any thrown value into a user-facing, translated message. */
export function describeError(t: TFunction, error: unknown, fallback: MessageKey = "error.generic"): string {
  if (error instanceof AppError) {
    return t(error.key);
  }
  if (error instanceof AiError) {
    return error.code === "http" ? t("error.ai.http", { detail: error.detail }) : t(`error.ai.${error.code}`);
  }
  if (error instanceof StorageError) {
    return t(`error.storage.${error.code}`);
  }
  if (error instanceof Error && error.message === "import.nothing") {
    return t("dashboard.importFailed");
  }
  return t(fallback);
}
