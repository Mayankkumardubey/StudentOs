"use client";

import { useState, useEffect, useRef } from "react";
import { Flame, Check, X } from "lucide-react";

interface StreakTask {
  _id: string;
  title: string;
  totalDays: number;
  startDate: string;
  completedDates: string[];
  status: "active" | "completed" | "abandoned";
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function SemicircleGauge({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const r = 28;
  const stroke = 5;
  const circumference = Math.PI * r;
  const ratio = total > 0 ? Math.min(completed / total, 1) : 0;
  const offset = circumference * (1 - ratio);

  return (
    <svg width={72} height={44} viewBox="0 0 72 44">
      <path
        d="M 6 40 A 28 28 0 0 1 66 40"
        fill="none"
        stroke="#374151"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <path
        d="M 6 40 A 28 28 0 0 1 66 40"
        fill="none"
        stroke="#f97316"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
    </svg>
  );
}

export default function StreakWidget() {
  const [streak, setStreak] = useState<StreakTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDays, setNewDays] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);

  const today = todayStr();
  const isCheckedInToday = streak?.completedDates.includes(today) ?? false;

  // Close popovers on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setCreateOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Load active streak
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/streaks/active");
        const data = await res.json();
        if (!cancelled) setStreak(data.task ?? null);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function handleCreate() {
    const days = parseInt(newDays, 10);
    if (!newTitle.trim() || !days || days < 1) {
      setError("Enter a task name and valid number of days.");
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/streaks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), totalDays: days }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create streak.");
        return;
      }
      setStreak(data.task);
      setCreateOpen(false);
      setNewTitle("");
      setNewDays("");
    } catch {
      setError("Network error.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckIn() {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/streaks/check-in", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Check-in failed.");
        return;
      }
      setStreak(data.task);
      setPopoverOpen(false);
    } catch {
      setError("Network error.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAbandon() {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/streaks/abandon", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to abandon.");
        return;
      }
      setStreak(null);
      setPopoverOpen(false);
    } catch {
      setError("Network error.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="h-10 w-28 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 animate-pulse" />
    );
  }

  // ── No active streak ──────────────────────────────────────────
  if (!streak) {
    return (
      <div className="relative" ref={createRef}>
        <button
          onClick={() => { setCreateOpen((p) => !p); setError(null); }}
          className="flex items-center gap-1.5 h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition"
        >
          <Flame size={16} className="text-orange-400" />
          <span className="hidden sm:inline">Start streak</span>
        </button>

        {createOpen && (
          <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-xl">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Start a new streak</p>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. LeetCode daily"
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition mb-2"
            />
            <input
              type="number"
              value={newDays}
              onChange={(e) => setNewDays(e.target.value)}
              placeholder="Number of days"
              min={1}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition mb-3"
            />
            {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
            <button
              onClick={handleCreate}
              disabled={actionLoading}
              className="w-full py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition disabled:opacity-50"
            >
              {actionLoading ? "Creating…" : "Start"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Completed state ───────────────────────────────────────────
  if (streak.status === "completed") {
    return (
      <div className="relative" ref={createRef}>
        <button
          onClick={() => setCreateOpen((p) => !p)}
          className="flex items-center gap-1.5 h-10 px-3 rounded-lg border border-emerald-800 bg-emerald-900/40 text-sm text-emerald-300 hover:bg-emerald-900/60 transition"
        >
          🎉
          <span className="hidden sm:inline">Completed!</span>
        </button>

        {createOpen && (
          <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-xl">
            <p className="text-sm font-semibold text-emerald-400 mb-1">🎉 Streak completed!</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{streak.title} — {streak.totalDays} days done.</p>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Start a new streak…"
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition mb-2"
            />
            <input
              type="number"
              value={newDays}
              onChange={(e) => setNewDays(e.target.value)}
              placeholder="Number of days"
              min={1}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition mb-3"
            />
            {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
            <button
              onClick={handleCreate}
              disabled={actionLoading}
              className="w-full py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition disabled:opacity-50"
            >
              {actionLoading ? "Creating…" : "Start new streak"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Active streak ─────────────────────────────────────────────
  const completed = streak.completedDates.length;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => { setPopoverOpen((p) => !p); setError(null); }}
        className="flex items-center gap-2 h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition"
      >
        <Flame size={16} className="text-orange-400 flex-none" />
        <SemicircleGauge completed={completed} total={streak.totalDays} />
        <span className="hidden sm:inline text-xs whitespace-nowrap">
          {completed}/{streak.totalDays}d
        </span>
      </button>

      {popoverOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-60 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{streak.title}</p>
            <button onClick={() => setPopoverOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <X size={14} />
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{completed} of {streak.totalDays} days</p>

          {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

          <button
            onClick={handleCheckIn}
            disabled={actionLoading || isCheckedInToday}
            className="w-full py-2 rounded-lg text-sm font-semibold transition disabled:cursor-not-allowed mb-2 flex items-center justify-center gap-1.5 border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            {isCheckedInToday ? (
              <><Check size={14} className="text-emerald-400" /> Done today</>
            ) : actionLoading ? (
              "Checking in…"
            ) : (
              "Mark today done"
            )}
          </button>

          <button
            onClick={handleAbandon}
            disabled={actionLoading}
            className="w-full py-2 rounded-lg text-xs text-gray-400 dark:text-gray-500 hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            Abandon streak
          </button>
        </div>
      )}
    </div>
  );
}
