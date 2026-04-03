"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Report } from "@/types";
import { Plus, Edit2, Play, Trash2, Share2, X, UserPlus, Users } from "lucide-react";

interface SessionUser {
  id: string;
  email: string;
  displayName: string;
}

interface ReportListItem extends Report {
  isOwner: boolean;
  ownerDisplayName?: string;
}

interface Collaborator {
  userId: string;
  displayName: string;
}

export default function Home() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [formData, setFormData] = useState({ quarter: "", year: new Date().getFullYear() });

  // Share modal state
  const [sharingReport, setSharingReport] = useState<ReportListItem | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [shareUsername, setShareUsername] = useState("");
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [removingUser, setRemovingUser] = useState<string | null>(null);

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
      fetchReports();
    } catch (error) {
      router.push("/auth");
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports");
      if (res.status === 401) {
        router.push("/auth");
        return;
      }
      const data = await res.json();
      setReports(data);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.quarter) return;

    setCreating(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quarter: formData.quarter,
          year: parseInt(formData.year as any),
        }),
      });
      if (!res.ok) throw new Error("Failed to create report");
      const newReport = await res.json();
      setReports([newReport, ...reports]);
      setFormData({ quarter: "", year: new Date().getFullYear() });
      setShowDialog(false);
    } catch (error) {
      console.error("Failed to create report:", error);
      alert("Failed to create report");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed with status ${res.status}`);
      setReports(reports.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Failed to delete report:", error);
      alert("Failed to delete report");
    } finally {
      setDeleting(null);
    }
  };

  const openShareModal = async (report: ReportListItem) => {
    setSharingReport(report);
    setShareUsername("");
    setShareError(null);
    setCollaborators([]);
    try {
      const res = await fetch(`/api/reports/${report.id}/shares`);
      if (res.ok) setCollaborators(await res.json());
    } catch (error) {
      console.error("Failed to load collaborators:", error);
    }
  };

  const handleAddShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharingReport || !shareUsername.trim()) return;
    setShareLoading(true);
    setShareError(null);
    try {
      const res = await fetch(`/api/reports/${sharingReport.id}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: shareUsername.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setShareError(data.error || "Failed to share");
        return;
      }
      setCollaborators([...collaborators, data]);
      setShareUsername("");
    } catch (error) {
      setShareError("Failed to share report");
    } finally {
      setShareLoading(false);
    }
  };

  const handleRemoveShare = async (userId: string) => {
    if (!sharingReport) return;
    setRemovingUser(userId);
    try {
      await fetch(`/api/reports/${sharingReport.id}/shares`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      setCollaborators(collaborators.filter((c) => c.userId !== userId));
    } catch (error) {
      console.error("Failed to remove collaborator:", error);
    } finally {
      setRemovingUser(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-base-100">
      <div className="navbar bg-base-300 shadow-sm">
        <div className="flex-1">
          <span className="btn btn-ghost text-xl">Cyber Board Reports</span>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <div className="dropdown dropdown-end">
              <button
                tabIndex={0}
                className="btn btn-ghost btn-circle avatar"
              >
                <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-lg">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
              </button>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content bg-base-100 rounded-box z-50 mt-3 w-52 p-2 shadow"
              >
                <li><a onClick={() => router.push("/profile")}>Profile Settings</a></li>
                <li><a onClick={handleLogout}>Logout</a></li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header with Create Button */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Reports Dashboard</h1>
              <p className="text-lg text-base-content/60">
                Create and manage quarterly security board reports
              </p>
            </div>
            <button
              onClick={() => setShowDialog(true)}
              className="btn btn-primary gap-2"
            >
              <Plus size={20} />
              Create New Report
            </button>
          </div>

          {/* Modal Dialog */}
          {showDialog && (
            <div className="modal modal-open">
              <div className="modal-box w-full max-w-md">
                <h2 className="text-2xl font-semibold mb-4">Create New Report</h2>
                <form onSubmit={handleCreateReport} className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Quarter</span>
                    </label>
                    <select
                      value={formData.quarter}
                      onChange={(e) => setFormData({...formData, quarter: e.target.value})}
                      required
                      disabled={creating}
                      className="select select-bordered w-full"
                    >
                      <option value="">Select a quarter</option>
                      <option value="Q1">Q1</option>
                      <option value="Q2">Q2</option>
                      <option value="Q3">Q3</option>
                      <option value="Q4">Q4</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Year</span>
                    </label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                      required
                      disabled={creating}
                      className="input input-bordered w-full"
                    />
                  </div>

                  <div className="modal-action gap-3">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setShowDialog(false)}
                      disabled={creating}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={creating || !formData.quarter}
                    >
                      {creating ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Creating...
                        </>
                      ) : (
                        "Create Report"
                      )}
                    </button>
                  </div>
                </form>
              </div>
              <form method="dialog" className="modal-backdrop">
                <button onClick={() => setShowDialog(false)}>close</button>
              </form>
            </div>
          )}

          {/* Reports Grid */}
          {reports.length === 0 ? (
            <div className="alert">
              <div>
                <p className="text-lg font-semibold">No reports yet</p>
                <p>Create your first quarterly security report to get started.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => (
                <div key={report.id} className="card bg-base-100 shadow-md border border-base-300">
                  <div className="card-body">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="card-title">
                        {report.quarter} {report.year}
                      </h2>
                      {!report.isOwner && (
                        <span className="badge badge-outline badge-sm gap-1 shrink-0">
                          <Users size={11} />
                          Shared
                        </span>
                      )}
                    </div>
                    <p className="text-sm opacity-70">
                      Created: {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                    {report.isOwner ? (
                      <p className="text-sm">
                        By: <strong>{report.createdBy}</strong>
                      </p>
                    ) : (
                      <p className="text-sm opacity-70">
                        Shared by <strong>{report.ownerDisplayName || report.createdBy}</strong>
                      </p>
                    )}

                    <div className="card-actions justify-end gap-2 mt-4">
                      {report.isOwner && (
                        <button
                          onClick={() => openShareModal(report)}
                          className="btn btn-sm btn-ghost gap-1"
                          title="Share report"
                        >
                          <Share2 size={16} />
                          Share
                        </button>
                      )}
                      <Link
                        href={`/editor/${report.id}`}
                        className="btn btn-sm btn-outline gap-1"
                      >
                        <Edit2 size={16} />
                        Edit
                      </Link>
                      <Link
                        href={`/slides/${report.id}`}
                        className="btn btn-sm btn-primary gap-1"
                      >
                        <Play size={16} />
                        View
                      </Link>
                      {report.isOwner && (
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="btn btn-sm btn-error gap-1"
                          disabled={deleting === report.id}
                        >
                          {deleting === report.id ? (
                            <span className="loading loading-spinner loading-sm"></span>
                          ) : (
                            <><Trash2 size={16} />Delete</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {sharingReport && (
        <div className="modal modal-open">
          <div className="modal-box w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">
                Share — {sharingReport.quarter} {sharingReport.year}
              </h3>
              <button
                className="btn btn-ghost btn-sm btn-circle"
                onClick={() => setSharingReport(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Add collaborator form */}
            <form onSubmit={handleAddShare} className="flex gap-2 mb-4">
              <input
                type="text"
                className="input input-bordered input-sm flex-1"
                placeholder="Enter username"
                value={shareUsername}
                onChange={(e) => { setShareUsername(e.target.value); setShareError(null); }}
                disabled={shareLoading}
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm gap-1"
                disabled={shareLoading || !shareUsername.trim()}
              >
                {shareLoading
                  ? <span className="loading loading-spinner loading-xs"></span>
                  : <UserPlus size={15} />}
                Add
              </button>
            </form>

            {shareError && (
              <div className="alert alert-error alert-sm text-sm mb-3 py-2">
                {shareError}
              </div>
            )}

            {/* Collaborators list */}
            <div className="space-y-1">
              {collaborators.length === 0 ? (
                <p className="text-sm opacity-60 text-center py-4">No collaborators yet</p>
              ) : (
                collaborators.map((c) => (
                  <div key={c.userId} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-base-200">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-secondary text-secondary-content flex items-center justify-center font-bold text-xs">
                        {c.displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm">{c.displayName}</span>
                    </div>
                    <button
                      className="btn btn-ghost btn-xs text-error"
                      onClick={() => handleRemoveShare(c.userId)}
                      disabled={removingUser === c.userId}
                    >
                      {removingUser === c.userId
                        ? <span className="loading loading-spinner loading-xs"></span>
                        : <X size={14} />}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setSharingReport(null)}>close</button>
          </form>
        </div>
      )}
    </main>
  );
}