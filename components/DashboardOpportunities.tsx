"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Briefcase } from "lucide-react";

interface BookmarkedOpp {
  _id: string;
  title: string;
  company: string;
  location: string;
  mode: string;
  salary: string;
}

const modeColors: Record<string, string> = {
  Remote: "text-emerald-400",
  Hybrid: "text-amber-400",
  Onsite: "text-sky-400",
};

export default function DashboardOpportunities() {
  const [bookmarks, setBookmarks] = useState<BookmarkedOpp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/opportunities/bookmarks");
        if (res.ok) {
          const data = await res.json();
          setBookmarks((data.bookmarks ?? []).slice(0, 5));
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
          <Briefcase size={18} className="text-indigo-400" />
          Career Opportunities
        </h3>
        {bookmarks.length > 0 && (
          <Link href="/opportunities" className="text-xs text-indigo-400 hover:text-indigo-300 transition">
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
      ) : bookmarks.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm flex-1 flex items-center">
          No bookmarked opportunities yet. Bookmark jobs from the Opportunities page.
        </p>
      ) : (
        <div className="space-y-2 flex-1">
          {bookmarks.map((b) => (
            <div
              key={b._id}
              className="flex items-center gap-2 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg px-3 py-2"
            >
              <span className={`text-xs font-medium ${modeColors[b.mode] ?? "text-gray-500 dark:text-gray-400"}`}>
                {b.mode === "Remote" ? "🌐" : b.mode === "Hybrid" ? "🔄" : "📍"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{b.title}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{b.company}</p>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{b.salary}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
