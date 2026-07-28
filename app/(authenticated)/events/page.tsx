"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertTriangle, SearchX, Calendar, SlidersHorizontal, Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import BackgroundOrbs from "@/components/ui/BackgroundOrbs";

interface EventItem {
  id: string;
  name: string;
  venue: string;
  date: string;
  category: string;
  redirectUrl: string;
}

interface BookmarkRecord {
  _id: string;
  eventId: string;
  name: string;
  venue: string;
  date: string;
  category: string;
  redirectUrl: string;
}

const CATEGORIES = [
  { label: "All Categories", value: "" },
  { label: "Music", value: "Music" },
  { label: "Sports", value: "Sports" },
  { label: "Arts & Theatre", value: "Arts & Theatre" },
  { label: "Film", value: "Film" },
  { label: "Miscellaneous", value: "Miscellaneous" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Music: "bg-purple-900/60 text-purple-300 border-purple-700",
  Sports: "bg-emerald-900/60 text-emerald-300 border-emerald-700",
  "Arts & Theatre": "bg-amber-900/60 text-amber-300 border-amber-700",
  Film: "bg-sky-900/60 text-sky-300 border-sky-700",
  Miscellaneous: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700",
};

export default function EventsPage() {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [results, setResults] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    async function loadBookmarks() {
      try {
        const res = await fetch("/api/events/bookmarks");
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
    return bookmarks.some((b) => b.eventId === id);
  }

  async function toggleBookmark(event: EventItem) {
    if (isBookmarked(event.id)) {
      try {
        await fetch(`/api/events/bookmarks?eventId=${encodeURIComponent(event.id)}`, { method: "DELETE" });
        setBookmarks((prev) => prev.filter((b) => b.eventId !== event.id));
      } catch {
        // silent
      }
    } else {
      try {
        const res = await fetch("/api/events/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: event.id,
            name: event.name,
            venue: event.venue,
            date: event.date,
            category: event.category,
            redirectUrl: event.redirectUrl,
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

  async function deleteBookmark(eventId: string) {
    try {
      await fetch(`/api/events/bookmarks?eventId=${encodeURIComponent(eventId)}`, { method: "DELETE" });
      setBookmarks((prev) => prev.filter((b) => b.eventId !== eventId));
    } catch {
      // silent
    }
  }

  async function clearAllBookmarks() {
    const toDelete = bookmarks.map((b) => b.eventId);
    setBookmarks([]);
    try {
      await Promise.all(
        toDelete.map((id) =>
          fetch(`/api/events/bookmarks?eventId=${encodeURIComponent(id)}`, { method: "DELETE" })
        )
      );
    } catch {
      // silent
    }
  }

  const search = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const params = new URLSearchParams();
      if (keyword) params.set("keyword", keyword);
      if (location) params.set("location", location);
      if (category) params.set("category", category);

      const res = await fetch(`/api/events?${params.toString()}`);
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
  }, [keyword, location, category]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") search();
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  }

  const inputCls =
    "w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-accent-teal transition";

  return (
    <>
      <BackgroundOrbs />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6 relative z-10">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Calendar size={28} className="text-accent-teal" />
            <h1 className="text-3xl font-bold text-on-surface">Events</h1>
          </div>
          <p className="text-on-surface-variant text-base ml-[40px]">
            Discover concerts, sports, theatre, and other events near you.
          </p>
          <p className="text-gray-400 dark:text-gray-600 text-xs ml-[40px] mt-1">
            Note: Ticketmaster has limited event coverage in India. Results shown are global events.
          </p>
        </div>

        {/* Filter Panel */}
        <div className="rounded-xl border border-outline-variant bg-surface-container/50">
          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setFilterOpen((p) => !p)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 lg:hidden"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal size={16} />
              Filters
            </span>
            <span className="text-gray-400 dark:text-gray-500">{filterOpen ? "▲" : "▼"}</span>
          </button>

          <div className={`${filterOpen ? "block" : "hidden"} lg:!block px-4 pb-4 space-y-4`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Keyword */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Keyword
                </label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. concert, hackathon"
                  className={inputCls}
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Hyderabad"
                  className={inputCls}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputCls}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={search}
              disabled={loading}
              className="w-full rounded-lg bg-accent-coral hover:opacity-90 text-white text-sm font-semibold py-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Searching…" : "Search"}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-20 text-gray-400 dark:text-gray-500">
            <Loader2 size={20} className="animate-spin" />
            Searching for events…
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
            {results.map((event) => (
              <div
                key={event.id}
                className="flex flex-col justify-between rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-5 hover:border-gray-300 dark:hover:border-gray-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-snug">{event.name}</h3>
                    <button
                      onClick={() => toggleBookmark(event)}
                      className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                      title={isBookmarked(event.id) ? "Remove bookmark" : "Bookmark"}
                    >
                      {isBookmarked(event.id) ? (
                        <BookmarkCheck size={18} className="text-indigo-400" />
                      ) : (
                        <Bookmark size={18} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
                      )}
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.Miscellaneous}`}
                    >
                      {event.category}
                    </span>
                    {event.venue && (
                      <span className="inline-block rounded-full border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs text-gray-700 dark:text-gray-300">
                        {event.venue}
                      </span>
                    )}
                  </div>

                  {event.date && (
                    <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{formatDate(event.date)}</p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-end text-xs">
                  <a
                    href={event.redirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition"
                  >
                    View details <ExternalLink size={13} />
                  </a>
                </div>
              </div>
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
                Clear all
              </button>
            </div>
            {showBookmarks && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookmarks.map((b) => (
                  <div
                    key={b._id}
                    className="flex flex-col justify-between rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-5 hover:border-gray-300 dark:hover:border-gray-700 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-snug">{b.name}</h3>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => deleteBookmark(b.eventId)}
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-red-400 transition"
                            title="Remove"
                          >
                            ✕
                          </button>
                          <button
                            onClick={() =>
                              toggleBookmark({
                                id: b.eventId,
                                name: b.name,
                                venue: b.venue,
                                date: b.date,
                                category: b.category,
                                redirectUrl: b.redirectUrl,
                              })
                            }
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                            title="Remove bookmark"
                          >
                            <BookmarkCheck size={18} className="text-indigo-400" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[b.category] ?? CATEGORY_COLORS.Miscellaneous}`}
                        >
                          {b.category}
                        </span>
                        {b.venue && (
                          <span className="inline-block rounded-full border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs text-gray-700 dark:text-gray-300">
                            {b.venue}
                          </span>
                        )}
                      </div>

                      {b.date && (
                        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{formatDate(b.date)}</p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-end text-xs">
                      <a
                        href={b.redirectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition"
                      >
                        View details <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}
