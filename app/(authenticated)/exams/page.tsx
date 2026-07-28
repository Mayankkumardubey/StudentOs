"use client";

import React, { useState, useEffect, useCallback } from "react";
import { GraduationCap, RefreshCw, Bookmark, BookmarkCheck, Trash2, X, FileSearch, Sparkles, ClipboardList, Pencil, Check, History } from "lucide-react";
import ExamsSidebar from "@/components/ExamsSidebar";
import GlassCard from "@/components/ui/GlassCard";
import BackgroundOrbs from "@/components/ui/BackgroundOrbs";

interface ExamEntry {
  name: string;
  reason: string;
  timeline: string;
}

interface SavedExam {
  _id: string;
  name: string;
  reason: string;
  timeline: string;
  category: "government" | "private";
  examDate: string;
  reminderEnabled: boolean;
}

export default function ExamsPage() {
  const [interests, setInterests] = useState("");
  const [generating, setGenerating] = useState(false);
  const [governmentExams, setGovernmentExams] = useState<ExamEntry[]>([]);
  const [privateExams, setPrivateExams] = useState<ExamEntry[]>([]);
  const [hasResults, setHasResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedExams, setSavedExams] = useState<SavedExam[]>([]);
  const [savingName, setSavingName] = useState<string | null>(null);
  const [editingDateName, setEditingDateName] = useState<string | null>(null);
  const [dateInputValue, setDateInputValue] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [examsOpen, setExamsOpen] = useState(false);

  useEffect(() => {
    async function loadLatest() {
      try {
        const res = await fetch("/api/exams/recommend");
        if (res.ok) {
          const data = await res.json();
          if (data.recommendations?.length) {
            const latest = data.recommendations[0];
            setGovernmentExams(latest.governmentExams);
            setPrivateExams(latest.privateExams);
            setHasResults(true);
          }
        }
      } catch {
        // non-fatal
      }
    }
    loadLatest();
  }, []);

  const loadSavedExams = useCallback(async () => {
    try {
      const res = await fetch("/api/exams/saved");
      if (res.ok) {
        const data = await res.json();
        setSavedExams(data.exams ?? []);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadSavedExams();
  }, [loadSavedExams]);

  function isSaved(name: string) {
    return savedExams.some((s) => s.name === name);
  }

  async function toggleSave(exam: ExamEntry, category: "government" | "private") {
    if (isSaved(exam.name)) {
      setSavingName(exam.name);
      try {
        await fetch(`/api/exams/saved?name=${encodeURIComponent(exam.name)}`, { method: "DELETE" });
        setSavedExams((prev) => prev.filter((s) => s.name !== exam.name));
      } catch {
        // silent
      } finally {
        setSavingName(null);
      }
    } else {
      setSavingName(exam.name);
      try {
        const res = await fetch("/api/exams/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: exam.name, reason: exam.reason, timeline: exam.timeline, category }),
        });
        if (res.ok) {
          const data = await res.json();
          setSavedExams((prev) => [data.exam, ...prev]);
        }
      } catch {
        // silent
      } finally {
        setSavingName(null);
      }
    }
  }

  async function deleteSaved(name: string) {
    try {
      await fetch(`/api/exams/saved?name=${encodeURIComponent(name)}`, { method: "DELETE" });
      setSavedExams((prev) => prev.filter((s) => s.name !== name));
    } catch {
      // silent
    }
  }

  async function clearAllSaved() {
    try {
      await Promise.all(
        savedExams.map((s) =>
          fetch(`/api/exams/saved?name=${encodeURIComponent(s.name)}`, { method: "DELETE" })
        )
      );
      setSavedExams([]);
    } catch {
      // silent
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function toggleReminder(exam: SavedExam) {
    if (!exam.reminderEnabled && !exam.examDate) {
      setEditingDateName(exam.name);
      setDateInputValue("");
      return;
    }

    const newVal = !exam.reminderEnabled;
    setSavedExams((prev) =>
      prev.map((e) => (e._id === exam._id ? { ...e, reminderEnabled: newVal } : e))
    );
    showToast(newVal ? "Reminder enabled." : "Reminder removed.");

    try {
      await fetch("/api/exams/saved", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: exam.name, reminderEnabled: newVal }),
      });
    } catch {
      setSavedExams((prev) =>
        prev.map((e) => (e._id === exam._id ? { ...e, reminderEnabled: !newVal } : e))
      );
    }
  }

  async function saveExamDate(examName: string, dateOverride?: string) {
    const dateToSave = dateOverride ?? dateInputValue;
    if (!dateToSave) return;

    setSavedExams((prev) =>
      prev.map((e) => (e.name === examName ? { ...e, examDate: dateToSave } : e))
    );
    setEditingDateName(null);

    try {
      await fetch("/api/exams/saved", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: examName, reminderEnabled: true, examDate: dateToSave }),
      });
      setSavedExams((prev) =>
        prev.map((e) => (e.name === examName ? { ...e, reminderEnabled: true, examDate: dateToSave } : e))
      );
      showToast("Reminder enabled.");
    } catch {
      // silent
    }
  }

  function formatDateShort(dateStr: string): string {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (generating) return;
    setError(null);
    setGenerating(true);

    try {
      const res = await fetch("/api/exams/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to get recommendations. Please try again.");
      } else {
        setGovernmentExams(data.governmentExams);
        setPrivateExams(data.privateExams);
        setHasResults(true);
      }
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  }

  function clearResults() {
    setGovernmentExams([]);
    setPrivateExams([]);
    setHasResults(false);
    setInterests("");
  }

  function ExamCard({ exam, accent, category }: { exam: ExamEntry; accent: string; category: "government" | "private" }) {
    const saved = isSaved(exam.name);
    return (
      <GlassCard className="!p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`font-semibold text-base mb-2 ${accent}`}>{exam.name}</h3>
          <button
            onClick={() => toggleSave(exam, category)}
            disabled={savingName === exam.name}
            className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
            title={saved ? "Unsave exam" : "Save exam"}
          >
            {saved ? (
              <BookmarkCheck size={18} className="text-[var(--accent-teal)]" />
            ) : (
              <Bookmark size={18} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
            )}
          </button>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{exam.reason}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">📅 {exam.timeline}</p>
      </GlassCard>
    );
  }

  return (
    <>
      <BackgroundOrbs />
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8 relative z-10">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap size={28} className="text-[var(--accent-teal)]" />
            <h1 className="text-3xl font-bold text-on-surface dark:text-on-surface-dark">Exams</h1>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-500 dark:text-gray-400 text-base">
              Discover government and private exams matched to your interests, degree, and career goals.
            </p>
            <button
              onClick={() => setExamsOpen((p) => !p)}
              aria-label={examsOpen ? "Close saved exams" : "Open saved exams"}
              aria-expanded={examsOpen}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition flex-none ${
                examsOpen
                  ? "border-[var(--accent-teal)] bg-[var(--accent-teal)]/20 text-[var(--accent-teal)]"
                  : "border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <History size={16} />
              Exams
            </button>
          </div>
        </div>

        {/* ── Generator Form ── */}
        <GlassCard>
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1 text-on-surface dark:text-on-surface-dark">
                Find Government & Private Exams For You
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gemini will recommend exams based on your profile — optionally, tell us more about
                your interests for better results.
              </p>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <textarea
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="e.g. I'm interested in government jobs, or open to higher studies abroad… (optional)"
                rows={3}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[var(--accent-teal)] transition resize-none"
              />

              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={generating}
                className="w-full py-3 rounded-xl bg-[var(--accent-coral)] hover:opacity-90 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Finding exams for you…
                  </>
                ) : (
                  "✦  Get Recommendations"
                )}
              </button>
            </form>
          </div>
        </GlassCard>

        {/* How it works */}
        {!hasResults && !generating && (
          <section>
            <h2 className="text-lg font-semibold mb-4 text-on-surface dark:text-on-surface-dark">How it works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: FileSearch, title: "Share your interests", desc: "Optionally describe what fields or career paths excite you for more targeted results." },
                { icon: Sparkles, title: "AI matches exams", desc: "Gemini cross-references your profile against hundreds of government and private exams." },
                { icon: ClipboardList, title: "Save & compare", desc: "Bookmark exams you're interested in, track timelines, and revisit past recommendations." },
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

        {generating && (
          <GlassCard className="!p-8 flex flex-col items-center justify-center gap-3 text-center">
            <RefreshCw size={28} className="animate-spin text-[var(--accent-teal)]" />
            <p className="text-gray-700 dark:text-gray-300 font-medium">Analyzing your profile…</p>
          </GlassCard>
        )}

        {hasResults && !generating && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-on-surface dark:text-on-surface-dark">Results</h2>
              <button
                onClick={clearResults}
                className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-red-400 transition px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={13} />
                Clear results
              </button>
            </div>

            <section>
              <h2 className="text-lg font-bold mb-4 text-emerald-400">🏛 Government Exams</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {governmentExams.map((exam, i) => (
                  <ExamCard key={i} exam={exam} accent="text-emerald-400" category="government" />
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-4 text-indigo-400">🏢 Private / Other Exams</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {privateExams.map((exam, i) => (
                  <ExamCard key={i} exam={exam} accent="text-indigo-400" category="private" />
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg transition-all">
          {toast}
        </div>
      )}

      {/* Saved Exams Sidebar */}
      <ExamsSidebar
        open={examsOpen}
        onClose={() => setExamsOpen(false)}
        exams={savedExams}
        onRemove={deleteSaved}
        onClearAll={clearAllSaved}
        onToggleReminder={toggleReminder}
        onSaveExamDate={saveExamDate}
      />
    </>
  );
}
