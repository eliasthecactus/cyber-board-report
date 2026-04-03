"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Report } from "@/types";
import SlideRenderer from "@/components/slides/SlideRenderer";
import { Play, Edit2, ArrowLeft, ChevronLeft, ChevronRight, X, Download } from "lucide-react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

export default function SlidesViewer() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPresenting, setIsPresenting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [user, setUser] = useState<{ id: string; displayName: string } | null>(null);
  const slideRef = useRef<HTMLDivElement>(null);

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
      // API returns { report, isOwner, collaborators }
      setReport(data.report ?? data);
    } catch (error) {
      console.error("Failed to fetch report:", error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight" && currentSlide < getTotalSlides() - 1) {
      setCurrentSlide(currentSlide + 1);
    } else if (e.key === "ArrowLeft" && currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    } else if (e.key === "Escape") {
      setIsPresenting(false);
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

  useEffect(() => {
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [currentSlide, isPresenting]);

  const getTotalSlides = () => {
    if (!report) return 0;
    return 13; // Title + 12 content slides
  };

  const exportToPDF = async () => {
    if (!report || !slideRef.current) return;
    setExporting(true);
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const totalSlides = getTotalSlides();

      for (let slideIdx = 0; slideIdx < totalSlides; slideIdx++) {
        if (slideIdx > 0) {
          pdf.addPage();
        }

        setCurrentSlide(slideIdx);
        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 1500);
        });

        try {
          const slidePreview = slideRef.current?.querySelector(
            "[data-slide-preview]"
          ) as HTMLElement;
          
          if (!slidePreview) {
            continue;
          }

          const canvas = await html2canvas(slidePreview, {
            backgroundColor: "#ffffff",
            scale: 1.5,
            allowTaint: true,
            useCORS: true,
          });

          const imgWidth = pageWidth - 4;
          const imgHeight = (canvas.height / canvas.width) * imgWidth;
          const yPos = Math.max(1, (pageHeight - imgHeight) / 2);

          const imgData = canvas.toDataURL("image/png");
          pdf.addImage(imgData, "PNG", 2, yPos, imgWidth, imgHeight);
          console.log(`✓ Slide ${slideIdx + 1}`);
        } catch (err) {
          console.log(`Skipping slide ${slideIdx + 1}`);
        }
      }

      setCurrentSlide(0);
      pdf.save(`${report.quarter}-${report.year}-board-report.pdf`);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <main className="p-8">Loading...</main>;
  if (!report) return <main className="p-8">Report not found</main>;

  if (isPresenting) {
    return (
      <>
        <div className="fixed inset-0 bg-black flex flex-col justify-center items-center z-[1000]">
          <div className="flex items-center justify-center w-full h-full overflow-auto">
            <SlideRenderer report={report} slideIndex={currentSlide} compact={false} />
          </div>
        </div>
        <div style={{
          position: "fixed",
          bottom: "15px",
          left: "15px",
          display: "flex",
          gap: "8px",
          alignItems: "center",
          background: "rgba(0, 0, 0, 0.5)",
          padding: "10px 15px",
          borderRadius: "6px",
          color: "#ccc",
          fontSize: "0.8rem",
          zIndex: 2000,
        }}>
          <button
            onClick={() => currentSlide > 0 && setCurrentSlide(currentSlide - 1)}
            disabled={currentSlide === 0}
            className="btn btn-sm btn-ghost"
          >
            <ChevronLeft size={18} />
          </button>
          <span>
            {currentSlide + 1} / {getTotalSlides()}
          </span>
          <button
            onClick={() =>
              currentSlide < getTotalSlides() - 1 &&
              setCurrentSlide(currentSlide + 1)
            }
            disabled={currentSlide === getTotalSlides() - 1}
            className="btn btn-sm btn-ghost"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => setIsPresenting(false)}
            className="btn btn-sm btn-ghost"
          >
            <X size={18} />
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="navbar bg-base-300 shadow-sm">
        <div className="flex-1 flex gap-4">
          <button className="btn btn-ghost btn-sm gap-1" onClick={() => router.push("/")}>
            <ArrowLeft size={16} />
          </button>
          <span className="text-lg font-bold block">{report.quarter} {report.year} — Slide Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-primary btn-sm gap-2" onClick={() => setIsPresenting(true)}>
            <Play size={16} />
            Present
          </button>
          <button className="btn btn-success btn-sm gap-2" onClick={exportToPDF} disabled={exporting}>
            {exporting ? <span className="loading loading-spinner loading-sm"></span> : <Download size={16} />}
            {exporting ? "Exporting..." : "PDF"}
          </button>
          <button className="btn btn-ghost btn-sm gap-2" onClick={() => router.push(`/editor/${reportId}`)}>
            <Edit2 size={16} />
            Edit
          </button>
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

      <main className="min-h-screen bg-base-200 p-6">
        <div className="max-w-7xl mx-auto">

          {/* Slides Container */}
          <div className="flex flex-col gap-6" ref={slideRef}>
            {/* Main Slide Preview */}
            <div 
              className="card bg-base-100 shadow-md overflow-hidden flex flex-col" 
              data-slide-preview
            >
              <SlideRenderer report={report} slideIndex={currentSlide} compact={false} />
            </div>

            {/* Slide Navigation */}
            <nav className="card bg-base-100 shadow-md p-4">
              <div className="text-center font-medium text-sm text-gray-600 pb-3 border-b border-gray-200 mb-3">
                Slide {currentSlide + 1} of {getTotalSlides()}
              </div>

              <div className="flex flex-wrap gap-2">
                {Array.from({ length: getTotalSlides() }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`rounded px-3 py-2 text-xs font-medium transition-all duration-200 border-2 ${
                      idx === currentSlide
                        ? "bg-blue-50 border-blue-500 text-gray-900"
                        : "bg-gray-50 border-transparent text-gray-600 hover:border-blue-500"
                    }`}
                  >
                    S{idx + 1}
                  </button>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </main>
    </>
  );
}
