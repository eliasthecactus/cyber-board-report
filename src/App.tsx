import { lazy, Suspense } from "react";
import { AlertTriangle } from "lucide-react";
import { navigateTo, useHashRoute } from "@/lib/navigation";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const ReportEditorPage = lazy(() => import("@/pages/ReportEditorPage"));
const SlidesViewerPage = lazy(() => import("@/pages/SlidesViewerPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));

export default function App() {
  const route = useHashRoute();

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
      <section className="w-full max-w-md rounded-lg border border-base-300 bg-base-100 p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <AlertTriangle className="text-warning" size={24} />
          <h1 className="text-xl font-bold">Page not found</h1>
        </div>
        <button className="btn btn-primary" onClick={() => navigateTo("/")}>
          Back to dashboard
        </button>
      </section>
    </main>
  );
}

function AppLoading() {
  return (
    <main className="app-shell flex min-h-screen items-center justify-center">
      <span className="loading loading-spinner loading-lg" aria-label="Loading" />
    </main>
  );
}
