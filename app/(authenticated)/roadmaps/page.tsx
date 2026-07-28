"use client";

import React, { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Map,
  RefreshCw,
  Clock,
  Download,
  Target,
  Cpu,
  Route,
  History,
} from "lucide-react";
import RoadmapHistorySidebar from "@/components/RoadmapHistorySidebar";
import BackgroundOrbs from "@/components/ui/BackgroundOrbs";
import GlassCard from "@/components/ui/GlassCard";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SavedRoadmap {
  _id: string;
  goal: string;
  timeframe: string;
  content: string;
  completedPhases?: number[];
  createdAt: string;
}

interface ActiveRoadmap {
  goal: string;
  timeframe: string;
  content: string;
}

interface ParsedPhase {
  title: string;
  content: string;
}

interface ParsedRoadmap {
  overview: string;
  phases: ParsedPhase[];
  tips: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const TIMEFRAMES = ["1 month", "3 months", "6 months", "1 year", "2 years"];

const GOAL_PRESETS = [
  "Land a software engineering job at a product-based company",
  "Crack GATE and get into an IIT for M.Tech",
  "Get into a top MS program in the US or UK",
  "Transition into data science / ML",
  "Crack CAT and get into an IIM for MBA",
  "Build and launch my own tech startup",
  "Crack UPSC Civil Services Exam",
];

const ACCENT_COLORS = [
  { bg: 'bg-indigo-500', text: 'text-indigo-400', border: 'border-indigo-500', glow: 'rgba(99,102,241,0.6)' },
  { bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500', glow: 'rgba(168,85,247,0.6)' },
  { bg: 'bg-pink-500', text: 'text-pink-400', border: 'border-pink-500', glow: 'rgba(236,72,153,0.6)' },
  { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500', glow: 'rgba(245,158,11,0.6)' },
  { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500', glow: 'rgba(16,185,129,0.6)' },
];

// ── Helper: Parser ────────────────────────────────────────────────────────────
function parseRoadmap(content: string): ParsedRoadmap {
  const lines = content.split("\n");
  let currentSection = "overview";

  let overview = "";
  let tips = "";
  const phases: ParsedPhase[] = [];

  let currentPhaseTitle = "";
  let currentPhaseContent = "";

  for (const line of lines) {
    if (line.match(/^##\s+Phase/i)) {
      if (currentSection === "phase") {
        phases.push({ title: currentPhaseTitle, content: currentPhaseContent.trim() });
      }
      currentSection = "phase";
      currentPhaseTitle = line.replace(/^##\s*/, "").trim();
      currentPhaseContent = "";
    } else if (line.match(/^##\s+Tips for Success/i)) {
      if (currentSection === "phase") {
        phases.push({ title: currentPhaseTitle, content: currentPhaseContent.trim() });
      }
      currentSection = "tips";
    } else {
      if (currentSection === "overview") {
        overview += line + "\n";
      } else if (currentSection === "phase") {
        currentPhaseContent += line + "\n";
      } else if (currentSection === "tips") {
        tips += line + "\n";
      }
    }
  }

  if (currentSection === "phase") {
    phases.push({ title: currentPhaseTitle, content: currentPhaseContent.trim() });
  }

  return { overview: overview.trim(), phases, tips: tips.trim() };
}

// ── Main Page Component ───────────────────────────────────────────────────────
export default function RoadmapsPage() {
  const [goal, setGoal] = useState("");
  const [timeframe, setTimeframe] = useState("6 months");
  const [generating, setGenerating] = useState(false);
  const [active, setActive] = useState<ActiveRoadmap | null>(null);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [history, setHistory] = useState<SavedRoadmap[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [selectedMapNode, setSelectedMapNode] = useState<number | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/roadmap/generate");
        if (res.ok) {
          const data = await res.json();
          setHistory(data.roadmaps ?? []);
          if (data.roadmaps?.length) {
            const latest = data.roadmaps[0];
            setActive({
              goal: latest.goal,
              timeframe: latest.timeframe,
              content: latest.content,
            });
            setActivePhaseIndex(0);
          }
        }
      } catch {
        // non-fatal
      } finally {
        setLoadingHistory(false);
      }
    }
    loadHistory();
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!goal.trim() || generating) return;

    setError(null);
    setGenerating(true);
    setActive(null);
    setActivePhaseIndex(0);
    setSelectedMapNode(null);

    try {
      const res = await fetch("/api/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, timeframe }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to generate roadmap. Please try again.");
      } else {
        setActive({ goal, timeframe, content: data.content });
        if (data.saved) {
          setHistory((prev) => [data.saved, ...prev]);
        }
      }
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  }

  const handleSelectRoadmap = useCallback((r: SavedRoadmap) => {
    setActive({ goal: r.goal, timeframe: r.timeframe, content: r.content });
    setActivePhaseIndex(0);
    setSelectedMapNode(null);
    setHistoryOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleDeleteRoadmap = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/roadmap/generate?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setHistory((prev) => {
          const next = prev.filter((r) => r._id !== id);
          if (active && !next.some((r) => r.goal === active.goal && r.timeframe === active.timeframe)) {
            setActive(null);
            setActivePhaseIndex(0);
          }
          return next;
        });
      }
    } catch {
      // non-fatal
    }
  }, [active]);

  async function handleClearAllHistory() {
    try {
      const res = await fetch("/api/roadmap/generate", { method: "DELETE" });
      if (res.ok) {
        setHistory([]);
        setActive(null);
        setActivePhaseIndex(0);
      }
    } catch {
      // non-fatal
    }
  }

  async function downloadPDF() {
    if (!active) return;
    const element = document.getElementById("roadmap-render-container");
    if (!element) return;

    setDownloading(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#030712",
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      const slug = active.goal
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      pdf.save(`roadmap-${slug || "download"}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  let parsed: ParsedRoadmap | null = null;
  if (active) {
    parsed = parseRoadmap(active.content);
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.15); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}} />

      <BackgroundOrbs />

      <RoadmapHistorySidebar
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        activeId={active ? history.find((r) => r.goal === active.goal && r.timeframe === active.timeframe)?._id : undefined}
        onSelect={handleSelectRoadmap}
        onDelete={handleDeleteRoadmap}
        onClearAll={handleClearAllHistory}
      />

      <main className="relative max-w-4xl mx-auto px-6 py-10 space-y-8 z-10">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Map size={28} className="text-accent-teal" />
            <h1 className="text-3xl font-bold text-on-surface dark:text-on-surface font-display">Roadmaps</h1>
          </div>
          <div className="flex items-center justify-between ml-[40px]">
            <p className="text-on-surface-variant dark:text-on-surface-variant text-base font-body">
              Generate AI-powered, step-by-step learning plans tailored to your goals and timeline.
            </p>
            <button
              onClick={() => setHistoryOpen((p) => !p)}
              aria-label={historyOpen ? "Close roadmap history" : "Open roadmap history"}
              aria-expanded={historyOpen}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition flex-none font-body ${
                historyOpen
                  ? "border-accent-teal bg-accent-teal/10 text-accent-teal"
                  : "border-outline-variant dark:border-outline-variant bg-surface-container/60 dark:bg-white/5 text-on-surface-variant dark:text-on-surface-variant hover:bg-surface-container dark:hover:bg-white/10"
              }`}
            >
              <History size={16} />
              History
            </button>
          </div>
        </div>

        {/* ── Form ── */}
        <GlassCard className="p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-on-surface dark:text-on-surface mb-1 font-display">Generate Your Personalised Roadmap</h2>
            <p className="text-sm text-on-surface-variant dark:text-on-surface-variant font-body">
              Enter your goal and timeframe — Gemini will build a step-by-step plan using your real profile data.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-on-surface-variant/60 dark:text-on-surface-variant/50 uppercase tracking-wider mb-2 font-body">
              Popular Goals
            </p>
            <div className="flex flex-wrap gap-2">
              {GOAL_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setGoal(preset)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition font-body ${
                    goal === preset
                      ? "border-accent-teal bg-accent-teal/10 text-accent-teal"
                      : "border-outline-variant dark:border-outline-variant text-on-surface-variant dark:text-on-surface-variant hover:border-accent-teal/50 dark:hover:border-accent-teal/50 hover:text-on-surface dark:hover:text-on-surface"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant/60 dark:text-on-surface-variant/50 uppercase tracking-wider mb-1.5 font-body">
                Your Goal
              </label>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Describe your goal in your own words…"
                className="w-full bg-white/50 dark:bg-white/5 border border-outline-variant dark:border-outline-variant rounded-lg px-4 py-2.5 text-sm text-on-surface dark:text-on-surface placeholder-on-surface-variant/50 dark:placeholder-on-surface-variant/50 focus:outline-none focus:border-accent-teal focus:shadow-[0_0_0_3px_rgba(0,106,97,0.15)] dark:focus:shadow-[0_0_0_3px_rgba(87,241,219,0.15)] transition-all duration-200 font-body"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant/60 dark:text-on-surface-variant/50 uppercase tracking-wider mb-1.5 font-body">
                Timeframe
              </label>
              <div className="flex flex-wrap gap-2">
                {TIMEFRAMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTimeframe(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition font-body ${
                      timeframe === t
                        ? "bg-accent-teal text-white"
                        : "bg-surface-container/60 dark:bg-white/5 text-on-surface-variant dark:text-on-surface-variant hover:bg-surface-container dark:hover:bg-white/10"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-950/80 dark:bg-red-900/40 border border-red-800/60 dark:border-red-700/40 text-red-300 text-sm px-4 py-3 rounded-xl backdrop-blur-sm font-body">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={generating || !goal.trim()}
              className="w-full py-3 rounded-xl bg-accent-teal hover:bg-accent-teal/90 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 font-body shadow-lg shadow-accent-teal/20"
            >
              {generating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Generating your roadmap…
                </>
              ) : (
                "✦  Generate Roadmap"
              )}
            </button>
          </form>
        </GlassCard>

        {/* How it works */}
        {!active && !generating && (
          <section>
            <h2 className="text-lg font-semibold text-on-surface dark:text-on-surface mb-4 font-display">How it works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Target, title: "Define your goal", desc: "Pick a preset goal or describe your own — from landing a job to cracking a competitive exam." },
                { icon: Cpu, title: "AI generates a plan", desc: "Gemini analyzes your profile and creates a phased roadmap with actionable milestones." },
                { icon: Route, title: "Follow & track progress", desc: "Walk through each phase, download the PDF, and revisit past roadmaps anytime." },
              ].map((step) => (
                <GlassCard key={step.title} className="p-5">
                  <step.icon size={20} className="text-accent-teal mb-3" />
                  <h3 className="text-sm font-semibold text-on-surface dark:text-on-surface mb-1 font-display">{step.title}</h3>
                  <p className="text-xs text-on-surface-variant dark:text-on-surface-variant leading-relaxed font-body">{step.desc}</p>
                </GlassCard>
              ))}
            </div>
          </section>
        )}

        {generating && (
          <GlassCard className="p-8 flex flex-col items-center justify-center gap-3 text-center">
            <RefreshCw size={28} className="animate-spin text-accent-teal" />
            <p className="text-on-surface dark:text-on-surface font-medium font-body">Building your roadmap…</p>
            <p className="text-sm text-on-surface-variant dark:text-on-surface-variant font-body">This usually takes 5–15 seconds.</p>
          </GlassCard>
        )}

        {/* ── Rendered Horizontal Timeline ── */}
        {active && !generating && parsed && (
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex justify-end">
              <button
                onClick={downloadPDF}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 bg-surface-container/60 dark:bg-white/5 hover:bg-surface-container dark:hover:bg-white/10 border border-outline-variant dark:border-outline-variant rounded-lg text-sm font-medium text-on-surface dark:text-on-surface transition disabled:opacity-50 disabled:cursor-not-allowed font-body"
              >
                {downloading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                {downloading ? "Generating PDF…" : "Download PDF"}
              </button>
            </div>

            {/* ── Game Map (untouched logic, glass wrapper) ── */}
            <GlassCard className="p-6 overflow-hidden">
              <h2 className="text-lg font-bold text-on-surface dark:text-on-surface mb-4 font-display">Your Journey</h2>
              {(() => {
                const phases = parsed.phases;

                const nodePositions = phases.map((_, i) => {
                  const isLeft = i % 2 === 0;
                  return {
                    x: isLeft ? 120 : 480,
                    y: 60 + i * 110,
                  };
                });

                const pathD = nodePositions
                  .map((pos, i) => {
                    if (i === 0) return `M ${pos.x} ${pos.y}`;
                    const prev = nodePositions[i - 1];
                    const midY = (prev.y + pos.y) / 2;
                    return `C ${prev.x} ${midY}, ${pos.x} ${midY}, ${pos.x} ${pos.y}`;
                  })
                  .join(" ");

                const svgHeight = phases.length > 0 ? 60 + (phases.length - 1) * 110 + 60 : 200;

                return (
                  <>
                    {/* Desktop map (lg+) */}
                    <div className="hidden lg:block">
                      <svg
                        viewBox={`0 0 600 ${svgHeight}`}
                        className="w-full"
                        style={{ maxHeight: `${Math.min(svgHeight * 1.2, 600)}px` }}
                      >
                        <defs>
                          <filter id="glow-active">
                            <feGaussianBlur stdDeviation="6" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>

                        <path d={pathD} fill="none" stroke="#d1d5db" strokeWidth="6" strokeLinecap="round" className="dark:hidden" />
                        <path d={pathD} fill="none" stroke="#1f2937" strokeWidth="6" strokeLinecap="round" className="hidden dark:block" />

                        {phases.map((phase, i) => {
                          const pos = nodePositions[i];
                          const color = ACCENT_COLORS[i % ACCENT_COLORS.length];
                          const isSelected = selectedMapNode === i;

                          const r = 22;
                          const fillColor = isSelected
                            ? color.glow.replace("0.6", "1")
                            : "#e5e7eb";
                          const strokeColor = isSelected
                            ? color.glow
                            : "#d1d5db";

                          return (
                            <g key={i}>
                              {isSelected && (
                                <circle cx={pos.x} cy={pos.y} r={r + 6} fill="none" stroke={color.glow} strokeWidth="3" opacity="0.5" filter="url(#glow-active)">
                                  <animate attributeName="r" values={`${r + 4};${r + 10};${r + 4}`} dur="2.5s" repeatCount="indefinite" />
                                  <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2.5s" repeatCount="indefinite" />
                                </circle>
                              )}
                              <circle cx={pos.x} cy={pos.y} r={r} fill={fillColor} stroke={strokeColor} strokeWidth="3" className="cursor-pointer"
                                onClick={() => { setSelectedMapNode(isSelected ? null : i); setActivePhaseIndex(i); }}
                              />
                              <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="central" className="text-xs font-bold pointer-events-none" fill="white">
                                {i + 1}
                              </text>
                              <text x={pos.x} y={pos.y + r + 18} textAnchor="middle" className="text-[10px] font-semibold uppercase tracking-wider pointer-events-none" fill={isSelected ? "#e5e7eb" : "#9ca3af"}>
                                Phase {i + 1}
                              </text>
                              <text x={pos.x} y={pos.y + r + 32} textAnchor="middle" className="text-xs font-medium pointer-events-none" fill={isSelected ? "#f3f4f6" : "#d1d5db"}>
                                {phase.title.replace(/^Phase\s*\d*:\s*/i, "").slice(0, 20)}
                                {phase.title.replace(/^Phase\s*\d*:\s*/i, "").length > 20 ? "…" : ""}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    {/* Mobile map (< lg) */}
                    <div className="lg:hidden">
                      <div className="relative pl-12 space-y-0">
                        <div className="absolute left-[19px] top-0 bottom-0 w-1.5 bg-gray-200 dark:bg-gray-800 rounded-full" />
                        {phases.map((phase, i) => {
                          const color = ACCENT_COLORS[i % ACCENT_COLORS.length];
                          const isSelected = selectedMapNode === i;
                          const nodeSize = 40;

                          return (
                            <div key={i} className="relative flex items-start py-4">
                              <div
                                className={`absolute left-0 flex items-center justify-center rounded-full border-3 transition-all ${
                                  isSelected
                                    ? "border-4"
                                    : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                                } ${isSelected ? "border-4" : "border-3"}`}
                                style={{
                                  width: nodeSize, height: nodeSize,
                                  borderColor: isSelected ? color.glow : undefined,
                                  boxShadow: isSelected
                                    ? `0 0 16px ${color.glow}, 0 0 32px ${color.glow}40`
                                    : "none",
                                }}
                                onClick={() => { setSelectedMapNode(isSelected ? null : i); setActivePhaseIndex(i); }}
                              >
                                <span className="text-sm font-bold text-white">{i + 1}</span>
                              </div>
                              <div className="ml-4 cursor-pointer" onClick={() => { setSelectedMapNode(isSelected ? null : i); setActivePhaseIndex(i); }}>
                                <p className={`text-xs font-semibold uppercase tracking-wider ${isSelected ? "text-gray-800 dark:text-gray-200" : "text-gray-400 dark:text-gray-600"}`}>
                                  Phase {i + 1}
                                </p>
                                <p className={`text-sm font-medium mt-0.5 ${isSelected ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}`}>
                                  {phase.title.replace(/^Phase\s*\d*:\s*/i, "")}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Node detail popover */}
                    {selectedMapNode !== null && parsed.phases[selectedMapNode] && (
                      <GlassCard className="mt-4 p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className={`text-base font-bold ${ACCENT_COLORS[selectedMapNode % ACCENT_COLORS.length].text} font-display`}>
                            Phase {selectedMapNode + 1}: {parsed.phases[selectedMapNode].title.replace(/^Phase\s*\d*:\s*/i, "")}
                          </h3>
                          <button onClick={() => setSelectedMapNode(null)} className="text-on-surface-variant dark:text-on-surface-variant hover:text-on-surface dark:hover:text-on-surface transition text-sm">
                            ✕
                          </button>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none text-on-surface-variant dark:text-on-surface-variant max-h-64 overflow-y-auto">
                          <ReactMarkdown>{parsed.phases[selectedMapNode].content}</ReactMarkdown>
                        </div>
                      </GlassCard>
                    )}
                  </>
                );
              })()}
            </GlassCard>

            {/* ── Text Detail View ── */}
            <section
              id="roadmap-render-container"
              className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-6 sm:p-8 shadow-[var(--glass-shadow)]"
            >
              {/* Roadmap Header & Overview */}
              <div className="mb-8 pb-6 border-b border-outline-variant/30 dark:border-outline-variant/15">
                <h2 className="text-2xl sm:text-3xl font-bold text-on-surface dark:text-on-surface leading-snug mb-3 font-display">
                  {active.goal}
                </h2>
                <div className="flex items-center gap-1.5 text-sm font-medium text-accent-teal mb-6 bg-accent-teal/10 w-fit px-3 py-1.5 rounded-full border border-accent-teal/20 font-body">
                  <Clock size={14} />
                  {active.timeframe} plan
                </div>

                <div className="prose prose-invert prose-sm sm:prose-base max-w-none text-on-surface-variant dark:text-on-surface-variant">
                  <ReactMarkdown>{parsed.overview.replace(/^# .*\n?/, "")}</ReactMarkdown>
                </div>
              </div>

              {/* ── Vertical Timeline ── */}
              <div className="relative mb-6">
                <div className="space-y-0">
                  {parsed.phases.map((phase, i) => {
                    const isSelected = activePhaseIndex === i;

                    return (
                      <div key={i} className="relative flex gap-4">
                        {/* Node + line column */}
                        <div className="flex flex-col items-center shrink-0">
                          {/* Node */}
                          <button
                            onClick={() => setActivePhaseIndex(i)}
                            className="relative z-10 shrink-0"
                          >
                            {isSelected && (
                              <div
                                className="absolute inset-0 rounded-full animate-pulse-glow"
                                style={{ boxShadow: "0 0 20px rgba(0,106,97,0.5)" }}
                              />
                            )}
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2 ${
                                isSelected
                                  ? "bg-accent-teal/20 border-accent-teal text-accent-teal shadow-[0_0_16px_rgba(0,106,97,0.35)]"
                                  : "bg-transparent border-outline-variant dark:border-outline-variant text-on-surface-variant/50 dark:text-on-surface-variant/40"
                              }`}
                            >
                              {i + 1}
                            </div>
                          </button>

                          {/* Connecting line */}
                          {i < parsed.phases.length - 1 && (
                            <div className="w-0.5 flex-1 min-h-[40px] border-l-2 border-dashed border-outline-variant dark:border-outline-variant/60" style={{ borderLeftWidth: "2px", background: "transparent" }} />
                          )}
                        </div>

                        {/* Phase label + content */}
                        <div className="pt-1.5 pb-6 flex-1 min-w-0">
                          <button
                            onClick={() => setActivePhaseIndex(i)}
                            className="text-left w-full"
                          >
                            <p className={`text-xs font-semibold uppercase tracking-wider mb-0.5 font-body ${
                              isSelected
                                ? "text-accent-teal"
                                : "text-on-surface-variant/50 dark:text-on-surface-variant/40"
                            }`}>
                              Phase {i + 1}
                            </p>
                            <p className={`text-sm font-medium font-body ${
                              isSelected
                                ? "text-on-surface dark:text-on-surface"
                                : "text-on-surface-variant/60 dark:text-on-surface-variant/50"
                            }`}>
                              {phase.title.replace(/^Phase\s*\d*:\s*/i, "")}
                            </p>
                          </button>

                          {/* Expanded content */}
                          {isSelected && (
                            <div className="mt-3 p-4 sm:p-5 rounded-xl bg-surface-container/40 dark:bg-white/5 border border-outline-variant/30 dark:border-outline-variant/15">
                              <div className="prose prose-invert prose-sm max-w-none
                                prose-headings:text-on-surface dark:prose-headings:text-on-surface prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-3
                                prose-p:text-on-surface-variant dark:prose-p:text-on-surface-variant prose-li:text-on-surface-variant dark:prose-li:text-on-surface-variant
                                prose-strong:text-on-surface dark:prose-strong:text-on-surface prose-a:text-accent-teal
                                prose-ul:my-2
                              ">
                                <ReactMarkdown>{phase.content}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tips Section */}
              {parsed.tips && (
                <GlassCard className="mt-10 p-6">
                  <h3 className="text-lg font-bold text-on-surface dark:text-on-surface mb-4 font-display">💡 Tips for Success</h3>
                  <div className="prose prose-invert prose-sm max-w-none text-on-surface-variant dark:text-on-surface-variant">
                    <ReactMarkdown>{parsed.tips}</ReactMarkdown>
                  </div>
                </GlassCard>
              )}
            </section>
          </div>
        )}
      </main>
    </>
  );
}
