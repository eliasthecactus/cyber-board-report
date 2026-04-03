"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

interface SessionUser {
  id: string;
  email: string;
  displayName: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/auth");
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setNewName(data.user.displayName);
    } catch {
      router.push("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmed = newName.trim();
    if (!trimmed) {
      setError("Username cannot be empty");
      return;
    }
    if (trimmed.length > 50) {
      setError("Username must be 50 characters or less");
      return;
    }
    if (trimmed.toLowerCase() === user?.displayName.toLowerCase()) {
      setError("New username is the same as current");
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: trimmed }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update username");
      }

      const updatedUser = await res.json();
      setUser(updatedUser);
      setNewName(updatedUser.displayName);
      setSuccess("Username updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update username");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProfile = async () => {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/auth/profile", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete profile");
      router.push("/auth");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete profile");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </main>
    );
  }

  return (
    <>
      <div className="navbar bg-base-300 shadow-sm">
        <div className="flex-1">
          <button onClick={() => router.push("/")} className="btn btn-ghost gap-2">
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <div className="dropdown dropdown-end">
              <button tabIndex={0} className="btn btn-ghost btn-circle avatar">
                <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-lg">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
              </button>
              <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-50 mt-3 w-52 p-2 shadow">
                <li><a onClick={() => router.push("/profile")}>Profile</a></li>
                <li>
                  <a onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    router.push("/auth");
                  }}>Logout</a>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <main className="min-h-screen bg-base-200">
        <div className="max-w-xl mx-auto p-6 space-y-8">
          <h1 className="text-3xl font-bold">Profile Settings</h1>

          {error && (
            <div role="alert" className="alert alert-error">
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div role="alert" className="alert alert-success">
              <span>{success}</span>
            </div>
          )}

          {/* Username */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Username</h2>
            <form onSubmit={handleUpdateName} className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter username"
                className="input input-bordered flex-1"
                disabled={updating}
                maxLength={50}
              />
              <button
                type="submit"
                disabled={updating || newName.trim().toLowerCase() === user?.displayName.toLowerCase()}
                className="btn btn-primary gap-2"
              >
                {updating ? <span className="loading loading-spinner loading-sm"></span> : <Pencil size={16} />}
                {updating ? "Saving..." : "Update"}
              </button>
            </form>
          </section>

          {/* Account Info */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Account Info</h2>
            <div className="overflow-x-auto">
              <table className="table">
                <tbody>
                  <tr>
                    <th className="w-32">User ID</th>
                    <td><code className="text-sm">{user?.id}</code></td>
                  </tr>
                  <tr>
                    <th>Email</th>
                    <td className="text-sm opacity-60">{user?.email} (auto-generated)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Danger Zone */}
          <section>
            <h2 className="text-lg font-semibold text-error mb-3">Danger Zone</h2>
            <div className="border border-error/30 rounded-lg p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Delete account</p>
                <p className="text-sm opacity-60">Permanently remove your account and all reports.</p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn btn-error btn-outline gap-2 shrink-0"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete your account?</h3>
            <p className="py-4">This will permanently delete your account and all your reports. This cannot be undone.</p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>Cancel</button>
              <button className="btn btn-error gap-2" onClick={handleDeleteProfile} disabled={deleting}>
                {deleting && <span className="loading loading-spinner loading-sm"></span>}
                {deleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowDeleteConfirm(false)}>close</button>
          </form>
        </div>
      )}
    </>
  );
}
