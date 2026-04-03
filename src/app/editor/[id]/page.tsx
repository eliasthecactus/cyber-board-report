"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Report, ReportSection } from "@/types";
import ExecutiveSummaryEditor from "@/components/editors/ExecutiveSummaryEditor";
import TopRisksEditor from "@/components/editors/TopRisksEditor";
import ThreatLandscapeEditor from "@/components/editors/ThreatLandscapeEditor";
import KPIEditor from "@/components/editors/KPIEditor";
import IncidentsEditor from "@/components/editors/IncidentsEditor";
import ProgramStatusEditor from "@/components/editors/ProgramStatusEditor";
import BudgetEditor from "@/components/editors/BudgetEditor";
import ComplianceEditor from "@/components/editors/ComplianceEditor";
import SupplyChainEditor from "@/components/editors/SupplyChainEditor";
import InitiativesEditor from "@/components/editors/InitiativesEditor";
import OutlookEditor from "@/components/editors/OutlookEditor";
import DecisionsEditor from "@/components/editors/DecisionsEditor";
import {
  FileText,
  AlertTriangle,
  Globe,
  BarChart3,
  AlertCircle,
  CheckCircle,
  DollarSign,
  ScrollText,
  Link2,
  Target,
  Eye,
  Handshake,
  Save,
  Play,
  ArrowLeft,
  Share2,
  X,
  UserPlus,
} from "lucide-react";

interface Collaborator {
  userId: string;
  displayName: string;
}

const SECTIONS: { id: ReportSection; label: string; Icon: any }[] = [
  { id: "executiveSummary", label: "Executive Summary", Icon: FileText },
  { id: "topRisks", label: "Top Risks", Icon: AlertTriangle },
  { id: "threatLandscape", label: "Threat Landscape", Icon: Globe },
  { id: "kpis", label: "KPIs", Icon: BarChart3 },
  { id: "incidents", label: "Incidents", Icon: AlertCircle },
  { id: "programStatus", label: "Program Status", Icon: CheckCircle },
  { id: "budgetResources", label: "Budget & Resources", Icon: DollarSign },
  { id: "complianceAudit", label: "Compliance & Audit", Icon: ScrollText },
  { id: "supplyChainRisk", label: "Supply Chain Risk", Icon: Link2 },
  { id: "initiatives", label: "Initiatives", Icon: Target },
  { id: "outlook", label: "Outlook", Icon: Eye },
  { id: "decisionsRequired", label: "Decisions Required", Icon: Handshake },
];

export default function ReportEditor() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [activeSection, setActiveSection] = useState<ReportSection>(
    "executiveSummary"
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<{ id: string; displayName: string } | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUsername, setShareUsername] = useState("");
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [removingUser, setRemovingUser] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndFetch();
  }, [reportId]);

  const checkAuthAndFetch = async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      if (!authRes.ok) {
        router.push("/auth");
        return;
      }
      const authData = await authRes.json();
      setUser(authData.user);
      await fetchReport();
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/auth");
    }
  };

  const fetchReport = async () => {
    try {
      const res = await fetch(`/api/reports/${reportId}`);
      if (res.status === 401) {
        router.push("/auth");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch report");
      const data = await res.json();
      // API now returns { report, isOwner, collaborators }
      const { report: reportData, isOwner: ownerStatus, collaborators: collabs } = data;
      setReport(reportData);
      setIsOwner(ownerStatus ?? true);
      setCollaborators(collabs ?? []);
    } catch (error) {
      console.error("Failed to fetch report:", error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!report) return;
    setSaving(true);
    try {
      await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });
    } catch (error) {
      console.error("Failed to save report:", error);
      alert("Failed to save changes");
    } finally {
      setSaving(false);
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

  const handleSectionUpdate = (section: ReportSection, data: any) => {
    if (!report) return;
    setReport({
      ...report,
      [section]: data,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareUsername.trim()) return;
    setShareLoading(true);
    setShareError(null);
    try {
      const res = await fetch(`/api/reports/${reportId}/shares`, {
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
    } catch {
      setShareError("Failed to share report");
    } finally {
      setShareLoading(false);
    }
  };

  const handleRemoveShare = async (userId: string) => {
    setRemovingUser(userId);
    try {
      await fetch(`/api/reports/${reportId}/shares`, {
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

  if (loading) return <main className="p-6">Loading...</main>;
  if (!report) return <main className="p-6">Report not found</main>;

  return (
    <>
      <div className="navbar bg-base-300 shadow-sm">
        <div className="flex-1 flex flex-row flex-nowrap gap-2 items-center">
          <button className="btn btn-ghost btn-sm gap-1" onClick={() => router.push("/")}>
            <ArrowLeft size={16} />
          </button>
          <div className="flex flex-col items-start gap-0">
            <span className="text-lg font-bold">{report.quarter} {report.year} Board Report</span>
            <span className="text-xs opacity-50 hidden sm:inline">Updated: {new Date(report.updatedAt).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-primary btn-sm gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <span className="loading loading-spinner loading-sm"></span> : <Save size={16} />}
            {saving ? "Saving..." : "Save"}
          </button>
          <button className="btn btn-ghost btn-sm gap-2" onClick={() => router.push(`/slides/${reportId}`)}>
            <Play size={16} />
            Preview
          </button>
          {isOwner && (
            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => { setShowShareModal(true); setShareUsername(""); setShareError(null); }}
            >
              <Share2 size={16} />
              Share
            </button>
          )}
          {user && (
            <div className="dropdown dropdown-end">
              <button tabIndex={0} className="btn btn-ghost btn-circle avatar">
                <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-lg">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
              </button>
              <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-50 mt-3 w-52 p-2 shadow">
                <li><a onClick={() => router.push("/profile")}>Profile Settings</a></li>
                <li><a onClick={handleLogout}>Logout</a></li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <main className="min-h-screen p-6 bg-base-200">
        <div className="max-w-7xl mx-auto">

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <nav className="lg:col-span-1">
              <div className="card bg-base-100 shadow-sm sticky top-6">
                <div className="card-body">
                  {SECTIONS.map((section) => {
                    const Icon = section.Icon;
                    const isActive = activeSection === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`btn btn-sm btn-block justify-start gap-2 ${isActive ? "btn-primary" : "btn-ghost"}`}
                      >
                        <Icon size={18} />
                        <span className="text-left">{section.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </nav>

            <div className="lg:col-span-3">
              <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                  {activeSection === "executiveSummary" && (
                    <ExecutiveSummaryEditor
                      data={report.executiveSummary}
                      onUpdate={(data) => handleSectionUpdate("executiveSummary", data)}
                    />
                  )}
                  {activeSection === "topRisks" && (
                    <TopRisksEditor
                      data={report.topRisks}
                      onUpdate={(data) => handleSectionUpdate("topRisks", data)}
                    />
                  )}
                  {activeSection === "threatLandscape" && (
                    <ThreatLandscapeEditor
                      data={report.threatLandscape}
                      onUpdate={(data) => handleSectionUpdate("threatLandscape", data)}
                    />
                  )}
                  {activeSection === "kpis" && (
                    <KPIEditor
                      data={report.kpis}
                      onUpdate={(data) => handleSectionUpdate("kpis", data)}
                    />
                  )}
                  {activeSection === "incidents" && (
                    <IncidentsEditor
                      data={report.incidents}
                      onUpdate={(data) => handleSectionUpdate("incidents", data)}
                    />
                  )}
                  {activeSection === "programStatus" && (
                    <ProgramStatusEditor
                      data={report.programStatus}
                      onUpdate={(data) => handleSectionUpdate("programStatus", data)}
                    />
                  )}
                  {activeSection === "budgetResources" && (
                    <BudgetEditor
                      data={report.budgetResources}
                      onUpdate={(data) => handleSectionUpdate("budgetResources", data)}
                    />
                  )}
                  {activeSection === "complianceAudit" && (
                    <ComplianceEditor
                      data={report.complianceAudit}
                      onUpdate={(data) => handleSectionUpdate("complianceAudit", data)}
                    />
                  )}
                  {activeSection === "supplyChainRisk" && (
                    <SupplyChainEditor
                      data={report.supplyChainRisk}
                      onUpdate={(data) => handleSectionUpdate("supplyChainRisk", data)}
                    />
                  )}
                  {activeSection === "initiatives" && (
                    <InitiativesEditor
                      data={report.initiatives}
                      onUpdate={(data) => handleSectionUpdate("initiatives", data)}
                    />
                  )}
                  {activeSection === "outlook" && (
                    <OutlookEditor
                      data={report.outlook}
                      onUpdate={(data) => handleSectionUpdate("outlook", data)}
                    />
                  )}
                  {activeSection === "decisionsRequired" && (
                    <DecisionsEditor
                      data={report.decisionsRequired}
                      onUpdate={(data) => handleSectionUpdate("decisionsRequired", data)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal modal-open">
          <div className="modal-box w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Share Report</h3>
              <button
                className="btn btn-ghost btn-sm btn-circle"
                onClick={() => setShowShareModal(false)}
              >
                <X size={18} />
              </button>
            </div>

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
              <div className="alert alert-error text-sm mb-3 py-2">
                {shareError}
              </div>
            )}

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
            <button onClick={() => setShowShareModal(false)}>close</button>
          </form>
        </div>
      )}
    </>
  );
}
