import { lazy, Suspense } from "react";
import { AlertTriangle } from "lucide-react";
import { useHashRoute } from "@/lib/navigation";
import { useT } from "@/lib/i18n";
import { useSettings } from "@/lib/settings";
import { describeError } from "@/lib/errors";
import { PageMessage, PageSpinner } from "@/components/ui/PageState";
import { IS_DEV_CHANNEL } from "@/lib/channel";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const ReportEditorPage = lazy(() => import("@/pages/ReportEditorPage"));
const SlidesViewerPage = lazy(() => import("@/pages/SlidesViewerPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));

export default function App() {
  const route = useHashRoute();
  const t = useT();
  const { loading, storageError } = useSettings();

  if (loading) {
    return <PageSpinner />;
  }

  let page;
  switch (route.name) {
    case "dashboard":
      page = <DashboardPage />;
      break;
    case "editor":
      // Keyed so switching reports remounts the editor, which saves any
      // pending edits of the previous report first.
      page = <ReportEditorPage key={route.id} reportId={route.id} />;
      break;
    case "slides":
      page = <SlidesViewerPage key={route.id} reportId={route.id} />;
      break;
    case "profile":
      page = <ProfilePage />;
      break;
    default:
      page = <PageMessage title={t("notFound.title")} />;
  }

  return (
    <>
      {IS_DEV_CHANNEL && (
        <div className="bg-amber-400 px-4 py-1 text-center text-xs font-semibold text-amber-950">
          {t("channel.devBanner")}
        </div>
      )}
      {storageError !== null && (
        <div role="alert" className="flex items-start gap-2 bg-red-600 px-4 py-2 text-sm text-white">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
          {describeError(t, storageError)}
        </div>
      )}
      <Suspense fallback={<PageSpinner />}>{page}</Suspense>
    </>
  );
}
