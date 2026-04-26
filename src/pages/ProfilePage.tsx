import { type FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Download, Pencil, Trash2 } from "lucide-react";
import { backupFilename, downloadJson } from "@/lib/files";
import { navigateTo } from "@/lib/navigation";
import {
  clearLocalData,
  exportSnapshot,
  getProfile,
  renameReportAuthor,
  saveProfile,
  type LocalProfile,
} from "@/lib/storage";

export default function ProfilePage() {
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const storedProfile = await getProfile();
      setProfile(storedProfile);
      setNewName(storedProfile.displayName);
      setLoading(false);
    };

    void loadProfile();
  }, []);

  const handleUpdateName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const trimmed = newName.trim();
    if (!profile) {
      return;
    }
    if (!trimmed) {
      setError("Display name cannot be empty.");
      return;
    }
    if (trimmed.length > 50) {
      setError("Display name must be 50 characters or less.");
      return;
    }
    if (trimmed.toLowerCase() === profile.displayName.toLowerCase()) {
      setError("Display name is unchanged.");
      return;
    }

    setUpdating(true);
    try {
      const updatedProfile = await saveProfile({
        displayName: trimmed,
        updatedAt: new Date().toISOString(),
      });
      await renameReportAuthor(profile.displayName, updatedProfile.displayName);
      setProfile(updatedProfile);
      setNewName(updatedProfile.displayName);
      setSuccess("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setUpdating(false);
    }
  };

  const handleBackup = async () => {
    downloadJson(backupFilename(), await exportSnapshot());
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      await clearLocalData();
      setShowDeleteConfirm(false);
      navigateTo("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear local data.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg" aria-label="Loading" />
      </main>
    );
  }

  return (
    <main className="app-shell min-h-screen">
      <header className="border-b border-base-300 bg-base-100/95">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button className="btn btn-ghost gap-2" onClick={() => navigateTo("/")}>
            <ArrowLeft size={18} />
            Dashboard
          </button>
          <button className="btn btn-outline btn-sm gap-2" onClick={() => void handleBackup()}>
            <Download size={16} />
            Backup
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <h1 className="mb-6 text-3xl font-bold">Profile Settings</h1>

        {error && (
          <div role="alert" className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div role="alert" className="alert alert-success mb-4">
            <span>{success}</span>
          </div>
        )}

        <section className="mb-6 rounded-lg border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Display Name</h2>
          <form onSubmit={handleUpdateName} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Enter display name"
              className="input input-bordered flex-1"
              disabled={updating}
              maxLength={50}
            />
            <button
              type="submit"
              disabled={
                updating || newName.trim().toLowerCase() === profile?.displayName.toLowerCase()
              }
              className="btn btn-primary gap-2"
            >
              {updating ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <Pencil size={16} />
              )}
              {updating ? "Saving" : "Update"}
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-error/30 bg-base-100 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-error">Local Data</h2>
              <p className="text-sm text-base-content/60">
                Clearing data removes reports and settings from this browser profile.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn btn-error btn-outline gap-2"
            >
              <Trash2 size={16} />
              Clear data
            </button>
          </div>
        </section>
      </section>

      {showDeleteConfirm && (
        <div className="modal modal-open">
          <div className="modal-box rounded-lg">
            <h3 className="text-lg font-bold">Clear local data?</h3>
            <p className="py-4">
              This removes every report and profile setting stored by this app in this browser.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-error gap-2"
                onClick={() => void handleDeleteAll()}
                disabled={deleting}
              >
                {deleting && <span className="loading loading-spinner loading-sm" />}
                {deleting ? "Clearing" : "Clear data"}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowDeleteConfirm(false)}>close</button>
          </form>
        </div>
      )}
    </main>
  );
}
