import { lazy, Suspense } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { navigateTo, useHashRoute } from "@/lib/navigation";
import { useT } from "@/lib/i18n";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const ReportEditorPage = lazy(() => import("@/pages/ReportEditorPage"));
const SlidesViewerPage = lazy(() => import("@/pages/SlidesViewerPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));

export default function App() {
  const route = useHashRoute();
  const t = useT();

  if (route.name === "dashboard") {
    return (
      <Suspense fallback={<AppLoading />}>
        <DashboardPage />
      </Suspense>
    );
  }

  if (route.name === "editor") {
    return (
      <Suspense fallback={<AppLoading />}>
        <ReportEditorPage reportId={route.id} />
      </Suspense>
    );
  }

  if (route.name === "slides") {
    return (
      <Suspense fallback={<AppLoading />}>
        <SlidesViewerPage reportId={route.id} />
      </Suspense>
    );
  }

  if (route.name === "profile") {
    return (
      <Suspense fallback={<AppLoading />}>
        <ProfilePage />
      </Suspense>
    );
  }

  return (
    <main className="app-shell flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <AlertTriangle className="text-amber-500" size={24} />
          <h1 className="text-xl font-bold text-slate-900">{t("notFound.title")}</h1>
        </div>
        <button className="cbr-btn cbr-btn-primary" onClick={() => navigateTo("/")}>
          {t("notFound.back")}
        </button>
      </section>
    </main>
  );
}

function AppLoading() {
  return (
    <main className="app-shell flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
    </main>
  );
}
