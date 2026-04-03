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
} from "lucide-react";

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

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const res = await fetch(`/api/reports/${reportId}`);
      const data = await res.json();
      setReport(data);
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

  const handleSectionUpdate = (section: ReportSection, data: any) => {
    if (!report) return;
    setReport({
      ...report,
      [section]: data,
      updatedAt: new Date().toISOString(),
    });
  };

  if (loading) return <main style={{ padding: "2rem" }}>Loading...</main>;
  if (!report) return <main style={{ padding: "2rem" }}>Report not found</main>;

  return (
    <main style={{ minHeight: "100vh", background: "#f8f9fa", padding: "1.5rem" }}>
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          background: "white",
          padding: "1.5rem",
          borderRadius: "0.5rem",
          marginBottom: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
              {report.quarter} {report.year} Board Report
            </h1>
            <p style={{ color: "#666", fontSize: "0.9rem", margin: 0 }}>
              {report.createdBy} • Updated: {new Date(report.updatedAt).toLocaleString()}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Save size={18} />
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              className="btn-secondary"
              onClick={() => router.push(`/slides/${reportId}`)}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Play size={18} />
              Preview Slides
            </button>
            <button
              className="btn-secondary"
              onClick={() => router.push("/")}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <ArrowLeft size={18} />
              Back
            </button>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "250px 1fr",
          gap: "1.5rem",
        }}>
          <nav style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.375rem",
            background: "white",
            padding: "1rem",
            borderRadius: "0.5rem",
            height: "fit-content",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            position: "sticky",
            top: "1.5rem",
          }}>
            {SECTIONS.map((section) => {
              const Icon = section.Icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem",
                    border: "none",
                    background: isActive ? "#2563eb" : "#f5f5f5",
                    color: isActive ? "white" : "#333",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    fontWeight: isActive ? "500" : "400",
                    textAlign: "left",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.background = "#e8e8e8";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.background = "#f5f5f5";
                    }
                  }}
                >
                  <Icon size={18} />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </nav>

          <div style={{
            background: "white",
            padding: "2rem",
            borderRadius: "0.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}>
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
    </main>
  );
}
