"use client";

import { useState, useEffect, useRef } from "react";
import { Flame, Check, X, Trash2 } from "lucide-react";

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

function BigSemicircleGauge({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const r = 100;
  const stroke = 12;
  const circumference = Math.PI * r;
  const ratio = total > 0 ? Math.min(completed / total, 1) : 0;
  const offset = circumference * (1 - ratio);
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center">
      <svg width={260} height={150} viewBox="0 0 260 150">
        <path
          d="M 20 140 A 100 100 0 0 1 240 140"
          fill="none"
          stroke="#374151"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <path
          d="M 20 140 A 100 100 0 0 1 240 140"
          fill="none"
          stroke="#f97316"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text
          x="130"
          y="115"
          textAnchor="middle"
          className="fill-gray-900 dark:fill-white text-5xl font-bold"
        >
          {pct}%
        </text>
        <text
          x="130"
          y="140"
          textAnchor="middle"
          className="fill-gray-500 dark:fill-gray-400 text-lg"
        >
          {completed} of {total} days
        </text>
      </svg>
    </div>
  );
}

export default function StreakDashboard() {
  const [streak, setStreak] = useState<StreakTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDays, setNewDays] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const createRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const today = todayStr();
  const isCheckedInToday = streak?.completedDates.includes(today) ?? false;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setCreateOpen(false);
      }
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
      <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 min-h-[180px] animate-pulse" />
    );
  }

  // ── No active streak ──────────────────────────────────────────
  if (!streak) {
    return (
      <div className="relative bg-gray-50 dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 min-h-[180px] flex flex-col items-center justify-center" ref={createRef}>
        <Flame size={32} className="text-gray-400 dark:text-gray-600 mb-2" />
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">No active streak</p>
        <button
          onClick={() => { setCreateOpen((p) => !p); setError(null); }}
          className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition"
        >
          Start a Streak
        </button>

        {createOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-64 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-xl">
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
      <div className="relative bg-gray-50 dark:bg-gray-900 p-5 rounded-xl border border-emerald-800 min-h-[180px] flex flex-col items-center justify-center" ref={createRef}>
        <p className="text-3xl mb-1">🎉</p>
        <p className="text-emerald-400 font-semibold text-sm">Streak Completed!</p>
        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{streak.title} — {streak.totalDays} days</p>
        <button
          onClick={() => setCreateOpen((p) => !p)}
          className="mt-3 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition"
        >
          Start New Streak
        </button>

        {createOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-64 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-xl">
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
    <div className="relative bg-gray-50 dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 min-h-[180px] flex flex-col" ref={popoverRef}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Flame size={18} className="text-orange-400 shrink-0" />
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{streak.title}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap mr-1">{completed}/{streak.totalDays}d</span>
          <button
            onClick={handleAbandon}
            disabled={actionLoading}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-red-400 transition disabled:opacity-50"
            title="Delete streak"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <BigSemicircleGauge completed={completed} total={streak.totalDays} />
      </div>

      <button
        onClick={() => { setPopoverOpen((p) => !p); setError(null); }}
        disabled={isCheckedInToday}
        className="mt-2 w-full py-2 rounded-lg text-sm font-semibold transition disabled:cursor-not-allowed flex items-center justify-center gap-1.5 border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
      >
        {isCheckedInToday ? (
          <><Check size={14} className="text-emerald-400" /> Done today</>
        ) : (
          "Mark today done"
        )}
      </button>

      {popoverOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-60 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{streak.title}</p>
            <button onClick={() => setPopoverOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <X size={14} />
            </button>
          </div>

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
            className="w-full py-2 rounded-lg text-xs text-gray-400 dark:text-gray-500 hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center justify-center gap-1.5"
          >
            <Trash2 size={12} />
            Delete streak &amp; start new
          </button>
        </div>
      )}
    </div>
  );
}
