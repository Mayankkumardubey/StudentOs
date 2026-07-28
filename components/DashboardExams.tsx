"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

interface SavedExam {
  _id: string;
  name: string;
  reason: string;
  timeline: string;
  category: "government" | "private";
}

export default function DashboardExams() {
  const [exams, setExams] = useState<SavedExam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/exams/saved");
        if (res.ok) {
          const data = await res.json();
          setExams((data.exams ?? []).slice(0, 5));
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <GraduationCap size={18} className="text-emerald-400" />
          Upcoming Exams
        </h3>
        {exams.length > 0 && (
          <Link href="/exams" className="text-xs text-indigo-400 hover:text-indigo-300 transition">
            View all
          </Link>
        )}
      </div>
      {loading ? (
        <div className="space-y-2 flex-1">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm flex-1 flex items-center">
          No saved exams yet. Save exams from the Exams page.
        </p>
      ) : (
        <ul className="space-y-2 flex-1">
          {exams.map((exam) => (
            <li
              key={exam._id}
              className="flex items-center gap-2 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg px-3 py-2"
            >
              <span className={`text-xs font-medium ${exam.category === "government" ? "text-emerald-400" : "text-indigo-400"}`}>
                {exam.category === "government" ? "🏛" : "🏢"}
              </span>
              <span className="text-sm text-gray-800 dark:text-gray-200 truncate flex-1">{exam.name}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{exam.timeline}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
