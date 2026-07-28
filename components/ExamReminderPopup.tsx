"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";

interface SavedExam {
  _id: string;
  name: string;
  timeline: string;
  examDate: string;
  reminderEnabled: boolean;
}

function getTodayKey(): string {
  const d = new Date();
  return `examReminderDismissed_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

function getLabel(exam: SavedExam): string {
  if (exam.examDate) {
    const days = daysUntil(exam.examDate);
    if (days < 0) return "";
    if (days === 0) return "Exam is today!";
    if (days === 1) return "Exam is tomorrow!";
    return `Exam in ${days} days`;
  }
  return `Exam: ${exam.timeline}`;
}

export default function ExamReminderPopup() {
  const [exams, setExams] = useState<SavedExam[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(getTodayKey());
    if (dismissed) return;

    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/exams/saved");
        if (!res.ok) return;
        const data = await res.json();
        const all: SavedExam[] = data.exams ?? [];

        const upcoming = all.filter((e) => {
          if (!e.reminderEnabled) return false;
          if (e.examDate) {
            return daysUntil(e.examDate) >= 0;
          }
          return true;
        });

        if (!cancelled && upcoming.length > 0) {
          setExams(upcoming);
          setShow(true);
        }
      } catch {
        // silent
      }
    }

    check();
    return () => { cancelled = true; };
  }, []);

  function dismiss() {
    localStorage.setItem(getTodayKey(), "true");
    setShow(false);
  }

  if (!show || exams.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exam-reminder-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-indigo-400" />
            <h3 id="exam-reminder-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              Upcoming Exams
            </h3>
          </div>
          <button
            onClick={dismiss}
            className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {exams.map((exam) => {
            const label = getLabel(exam);
            return (
              <div
                key={exam._id}
                className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{exam.name}</p>
                  {label && (
                    <p className={`text-xs mt-0.5 ${
                      label.includes("today") || label.includes("tomorrow")
                        ? "text-amber-400 font-medium"
                        : "text-gray-500 dark:text-gray-400"
                    }`}>
                      {label}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={dismiss}
          className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
