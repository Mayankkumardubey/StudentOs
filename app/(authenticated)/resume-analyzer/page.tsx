"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  UploadCloud,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  XCircle,
  FileBadge,
  ScanSearch,
  BarChart3,
  History,
} from "lucide-react";
import ResumeHistorySidebar from "@/components/ResumeHistorySidebar";
import GlassCard from "@/components/ui/GlassCard";
import BackgroundOrbs from "@/components/ui/BackgroundOrbs";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AnalysisResult {
  matchScore: number | null;
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  suggestions: string[];
}

interface SavedAnalysis {
  _id: string;
  fileName: string;
  matchScore: number | null;
  analysis: AnalysisResult;
  createdAt: string;
}

// ── Components ────────────────────────────────────────────────────────────────
const ScoreGauge = ({ score }: { score: number }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let color = "text-rose-500";
  if (score >= 80) color = "text-emerald-500";
  else if (score >= 50) color = "text-amber-500";

  return (
    <div className="relative flex items-center justify-center w-24 h-24 shrink-0">
      <svg className="transform -rotate-90 w-24 h-24">
        <circle
          cx="48"
          cy="48"
          r={radius}
          className="text-gray-100 dark:text-gray-800"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          className={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{score}%</span>
        <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Match</span>
      </div>
    </div>
  );
};

const SectionList = ({
  title,
  items,
  icon,
  colors,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
  colors: { bg: string; dot: string };
}) => {
  if (!items || items.length === 0) return null;
  return (
    <GlassCard className="!p-5 sm:!p-6">
      <div className="flex items-center gap-3 mb-4 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className={`p-2 rounded-lg ${colors.bg}`}>{icon}</div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
            <span className={`flex-none mt-1 text-lg leading-none ${colors.dot}`}>•</span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ResumeAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<AnalysisResult | null>(null);
  const [activeFileName, setActiveFileName] = useState("");

  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/resume/analyze");
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history ?? []);
        }
      } catch {
        // non-fatal
      } finally {
        setLoadingHistory(false);
      }
    }
    loadHistory();
  }, []);

  function handleFileSelection(selectedFile: File) {
    setError(null);
    if (selectedFile.type !== "application/pdf") {
      setError("Please upload a valid PDF file.");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be under 5MB.");
      return;
    }
    setFile(selectedFile);
  }

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please upload a resume first.");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setActiveResult(null);

    const formData = new FormData();
    formData.append("file", file);
    if (jobDescription.trim()) {
      formData.append("jobDescription", jobDescription.trim());
    }

    try {
      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to analyze resume.");
      } else {
        setActiveResult(data.analysis);
        setActiveFileName(file.name);
        if (data.saved) {
          setHistory((prev) => [data.saved, ...prev]);
        }
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setAnalyzing(false);
    }
  }

  function viewHistoricAnalysis(r: SavedAnalysis) {
    setActiveResult(r.analysis);
    setActiveFileName(r.fileName);
    setHistoryOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDeleteAnalysis(id: string) {
    try {
      const res = await fetch(`/api/resume/analyze?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setHistory((prev) => prev.filter((r) => r._id !== id));
      }
    } catch {
      // non-fatal
    }
  }

  async function handleClearAllHistory() {
    try {
      const res = await fetch("/api/resume/analyze", { method: "DELETE" });
      if (res.ok) {
        setHistory([]);
      }
    } catch {
      // non-fatal
    }
  }

  function resetForm() {
    setFile(null);
    setJobDescription("");
    setActiveResult(null);
    setError(null);
  }

  return (
    <>
      <BackgroundOrbs />

      {/* Analysis History Sidebar */}
      <ResumeHistorySidebar
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        activeId={activeResult ? history.find((r) => r.fileName === activeFileName)?._id : undefined}
        onSelect={viewHistoricAnalysis}
        onDelete={handleDeleteAnalysis}
        onClearAll={handleClearAllHistory}
      />

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8 relative z-10">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <FileText size={28} className="text-[var(--accent-teal)]" />
            <h1 className="text-3xl font-bold text-on-surface dark:text-on-surface-dark">Resume Analyzer</h1>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-500 dark:text-gray-400 text-base">
              Upload your resume for instant AI feedback on ATS compatibility, formatting, and impact.
            </p>
            <button
              onClick={() => setHistoryOpen((p) => !p)}
              aria-label={historyOpen ? "Close analysis history" : "Open analysis history"}
              aria-expanded={historyOpen}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition flex-none ${
                historyOpen
                  ? "border-[var(--accent-teal)] bg-[var(--accent-teal)]/20 text-[var(--accent-teal)]"
                  : "border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <History size={16} />
              History
            </button>
          </div>
        </div>

        {/* ── Form Section ── */}
        {!activeResult && !analyzing && (
          <GlassCard>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-1 text-on-surface dark:text-on-surface-dark">AI Resume Review</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Upload your resume to get instant, actionable feedback on ATS compatibility, 
                  formatting, and impact. Paste a Job Description to get a tailored Match Score.
                </p>
              </div>

              <form onSubmit={handleAnalyze} className="space-y-6">
                {/* File Upload Zone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Upload Resume (PDF only, max 5MB)
                  </label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileSelection(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-[var(--accent-teal)] bg-[var(--accent-teal)]/10 scale-[1.01]"
                        : file
                        ? "border-emerald-500/50 bg-emerald-500/5"
                        : "border-gray-300 dark:border-gray-700 bg-gray-100/50 dark:bg-gray-800/50 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileSelection(e.target.files[0]);
                        }
                      }}
                      accept="application/pdf"
                      className="hidden"
                    />
                    
                    {file ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                          <CheckCircle size={24} />
                        </div>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{file.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB · Click to change
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center mb-3">
                          <UploadCloud size={24} />
                        </div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">
                          Drag & drop your PDF here, or <span className="text-[var(--accent-teal)]">browse</span>
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          Must be a readable PDF, not a scanned image.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* JD Textarea */}
                <div>
                  <label className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    <span>Job Description (Optional)</span>
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here to get a Match Score and tailored missing skills analysis..."
                    rows={4}
                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[var(--accent-teal)] transition resize-y"
                  />
                </div>

                {error && (
                  <div className="bg-red-900/50 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertTriangle size={16} className="shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!file}
                  className="w-full py-3 rounded-xl bg-[var(--accent-coral)] hover:opacity-90 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  ✦ Analyze Resume
                </button>
              </form>
            </div>
          </GlassCard>
        )}

        {/* How it works */}
        {!activeResult && !analyzing && (
          <section>
            <h2 className="text-lg font-semibold mb-4 text-on-surface dark:text-on-surface-dark">How it works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: UploadCloud, title: "Upload your resume", desc: "Drag & drop or browse to upload your PDF. Add a job description for a tailored match score." },
                { icon: ScanSearch, title: "AI analyzes everything", desc: "ATS compatibility, formatting, keywords, strengths, and weaknesses are evaluated instantly." },
                { icon: BarChart3, title: "Get actionable feedback", desc: "Receive a match score, improvement suggestions, and a clear breakdown of what to fix." },
              ].map((step) => (
                <GlassCard key={step.title} className="!p-5">
                  <step.icon size={20} className="text-[var(--accent-teal)] mb-3" />
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">{step.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                </GlassCard>
              ))}
            </div>
          </section>
        )}

        {/* ── Loading State ── */}
        {analyzing && (
          <GlassCard className="!p-12 flex flex-col items-center justify-center gap-4 text-center">
            <RefreshCw size={32} className="animate-spin text-[var(--accent-teal)]" />
            <div>
              <p className="text-gray-800 dark:text-gray-200 font-medium text-lg mb-1">Analyzing your resume</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Extracting text, checking ATS compatibility, and generating feedback...
              </p>
            </div>
          </GlassCard>
        )}

        {/* ── Results View ── */}
        {activeResult && !analyzing && (
          <section className="space-y-6">
            <GlassCard>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <FileText size={20} className="text-[var(--accent-teal)]" />
                    Analysis Complete
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    File: <span className="font-medium text-gray-800 dark:text-gray-200">{activeFileName}</span>
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {activeResult.matchScore !== null && (
                    <div className="flex items-center gap-3 bg-white dark:bg-gray-950 rounded-xl px-4 py-2 border border-gray-200 dark:border-gray-800">
                      <ScoreGauge score={activeResult.matchScore} />
                      <div className="text-sm">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">Match Score</p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs">Based on Job Description</p>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium rounded-lg transition"
                  >
                    Analyze Another
                  </button>
                </div>
              </div>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SectionList
                title="Strengths"
                items={activeResult.strengths}
                icon={<CheckCircle size={20} />}
                colors={{ bg: "bg-emerald-500/20 text-emerald-400", dot: "text-emerald-500" }}
              />
              <SectionList
                title="Weaknesses / Formatting Issues"
                items={activeResult.weaknesses}
                icon={<XCircle size={20} />}
                colors={{ bg: "bg-rose-500/20 text-rose-400", dot: "text-rose-500" }}
              />
              <SectionList
                title="Missing Skills & Keywords"
                items={activeResult.missingSkills}
                icon={<AlertTriangle size={20} />}
                colors={{ bg: "bg-amber-500/20 text-amber-400", dot: "text-amber-500" }}
              />
              <SectionList
                title="Actionable Suggestions"
                items={activeResult.suggestions}
                icon={<Lightbulb size={20} />}
                colors={{ bg: "bg-indigo-500/20 text-indigo-400", dot: "text-indigo-500" }}
              />
            </div>
          </section>
        )}
      </main>
    </>
  );
}
