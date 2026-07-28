"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertTriangle, SearchX, Trash2, Briefcase } from "lucide-react";
import OpportunityFilters, {
  type FiltersState,
} from "@/components/OpportunityFilters";
import OpportunityCard, {
  type Opportunity,
} from "@/components/OpportunityCard";
import GlassCard from "@/components/ui/GlassCard";
import BackgroundOrbs from "@/components/ui/BackgroundOrbs";

interface BookmarkRecord {
  _id: string;
  opportunityId: string;
  title: string;
  company: string;
  location: string;
  mode: string;
  salary: string;
  postedDate: string;
  redirectUrl: string;
}

const EMPTY_FILTERS: FiltersState = {
  role: "",
  location: "",
  modes: [],
  salary: "",
  type: "",
};

export default function OpportunitiesPage() {
  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS);
  const [results, setResults] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);

  useEffect(() => {
    async function loadBookmarks() {
      try {
        const res = await fetch("/api/opportunities/bookmarks");
        if (res.ok) {
          const data = await res.json();
          setBookmarks(data.bookmarks ?? []);
        }
      } catch {
        // silent
      }
    }
    loadBookmarks();
  }, []);

  function isBookmarked(id: string) {
    return bookmarks.some((b) => b.opportunityId === id);
  }

  async function toggleBookmark(job: Opportunity) {
    if (isBookmarked(job.id)) {
      try {
        await fetch(`/api/opportunities/bookmarks?opportunityId=${encodeURIComponent(job.id)}`, { method: "DELETE" });
        setBookmarks((prev) => prev.filter((b) => b.opportunityId !== job.id));
      } catch {
        // silent
      }
    } else {
      try {
        const res = await fetch("/api/opportunities/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            opportunityId: job.id,
            title: job.title,
            company: job.company,
            location: job.location,
            mode: job.mode,
            salary: job.salary,
            postedDate: job.postedDate,
            redirectUrl: job.redirectUrl,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setBookmarks((prev) => [data.bookmark, ...prev]);
        }
      } catch {
        // silent
      }
    }
  }

  async function deleteBookmark(opportunityId: string) {
    try {
      await fetch(`/api/opportunities/bookmarks?opportunityId=${encodeURIComponent(opportunityId)}`, { method: "DELETE" });
      setBookmarks((prev) => prev.filter((b) => b.opportunityId !== opportunityId));
    } catch {
      // silent
    }
  }

  async function clearAllBookmarks() {
    const toDelete = bookmarks.map((b) => b.opportunityId);
    setBookmarks([]);
    try {
      await Promise.all(
        toDelete.map((id) =>
          fetch(`/api/opportunities/bookmarks?opportunityId=${encodeURIComponent(id)}`, { method: "DELETE" })
        )
      );
    } catch {
      // silent
    }
  }

  const search = useCallback(async (f: FiltersState) => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const params = new URLSearchParams();
      if (f.role) params.set("role", f.role);
      if (f.location) params.set("location", f.location);
      f.modes.forEach((m) => params.append("mode", m));
      if (f.salary) params.set("salary", f.salary);
      if (f.type) params.set("type", f.type);

      const res = await fetch(`/api/opportunities?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setResults(data.results ?? []);
      }
    } catch {
      setError("Network error — please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch profile, seed filters, and auto-fire first search ────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      let seeded: FiltersState = EMPTY_FILTERS;

      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          seeded = {
            ...EMPTY_FILTERS,
            role: data.preferredCareerPath ?? "",
            location: data.branch ?? "",
          };
          setFilters(seeded);
        }
      } catch {
        // silent — filters stay empty, user can type manually
      }

      if (!cancelled) {
        search(seeded);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [search]);

  function handleApply() {
    search(filters);
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      <BackgroundOrbs />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6 relative z-10">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Briefcase size={28} className="text-accent-teal" />
            <h1 className="text-3xl font-bold text-on-surface">Opportunities</h1>
          </div>
          <p className="text-on-surface-variant text-base ml-[40px]">
            Discover jobs, internships, and referrals matched to your skills and career goals.
          </p>
        </div>

        <OpportunityFilters
          filters={filters}
          onChange={setFilters}
          onApply={handleApply}
          loading={loading}
        />

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-20 text-gray-400 dark:text-gray-500">
            <Loader2 size={20} className="animate-spin" />
            Searching for opportunities…
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-center gap-3 bg-red-900/40 border border-red-700 text-red-300 text-sm px-5 py-4 rounded-xl">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && results.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-gray-400 dark:text-gray-500">
            <SearchX size={32} />
            <p className="text-sm">No results yet. Try adjusting your filters and hit Search.</p>
          </div>
        )}

        {/* Results grid */}
        {!loading && !error && results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((job) => (
              <OpportunityCard
                key={job.id}
                job={job}
                bookmarked={isBookmarked(job.id)}
                onToggleBookmark={toggleBookmark}
              />
            ))}
          </div>
        )}

        {/* Bookmarked section */}
        {bookmarks.length > 0 && (
          <section className="bg-surface-container/50 border border-outline-variant rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowBookmarks((s) => !s)}
                className="flex items-center gap-2 text-lg font-bold text-accent-teal"
              >
                {showBookmarks ? "▾" : "▸"} Bookmarked ({bookmarks.length})
              </button>
              <button
                onClick={clearAllBookmarks}
                className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-red-400 transition px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Trash2 size={13} />
                Clear all
              </button>
            </div>
            {showBookmarks && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookmarks.map((b) => (
                  <OpportunityCard
                    key={b._id}
                    job={{
                      id: b.opportunityId,
                      title: b.title,
                      company: b.company,
                      location: b.location,
                      mode: (b.mode as Opportunity["mode"]) || "Onsite",
                      salary: b.salary,
                      postedDate: b.postedDate,
                      redirectUrl: b.redirectUrl,
                    }}
                    bookmarked={true}
                    onToggleBookmark={toggleBookmark}
                    onDelete={() => deleteBookmark(b.opportunityId)}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}
