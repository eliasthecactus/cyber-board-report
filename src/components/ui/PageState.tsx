import { Loader2 } from "lucide-react";
import { navigateTo } from "@/lib/navigation";
import { useT } from "@/lib/i18n";

export function PageSpinner() {
  const t = useT();
  return (
    <main className="app-shell flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-hidden />
      <span className="sr-only">{t("common.loading")}</span>
    </main>
  );
}

/** Full-page message with a way back to the dashboard (not found, errors). */
export function PageMessage({ title }: { title: string }) {
  const t = useT();
  return (
    <main className="app-shell flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-3 text-xl font-bold text-slate-900">{title}</h1>
        <button className="cbr-btn cbr-btn-primary" onClick={() => navigateTo("/")}>
          {t("notFound.back")}
        </button>
      </section>
    </main>
  );
}
