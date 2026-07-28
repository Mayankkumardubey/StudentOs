"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  RefreshCw,
  PlayCircle,
  Bookmark,
  BookmarkCheck,
  Trash2,
  ExternalLink,
  Lightbulb,
  Sparkles,
  ListChecks,
  History,
} from "lucide-react";
import ResourcesSidebar from "@/components/ResourcesSidebar";
import GlassCard from "@/components/ui/GlassCard";
import BackgroundOrbs from "@/components/ui/BackgroundOrbs";

interface VideoSuggestion {
  title: string;
  channel: string;
  searchQuery: string;
  reason: string;
}

interface BookSuggestion {
  title: string;
  author: string;
  reason: string;
}

interface SavedResource {
  _id: string;
  playlistName: string;
  title: string;
  url: string;
  type: string;
  createdAt: string;
}

export default function ResourcesPage() {
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [videos, setVideos] = useState<VideoSuggestion[]>([]);
  const [books, setBooks] = useState<BookSuggestion[]>([]);
  const [hasResults, setHasResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [savedResources, setSavedResources] = useState<SavedResource[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  useEffect(() => {
    loadSavedResources();
  }, []);

  async function loadSavedResources() {
    try {
      const res = await fetch("/api/resources/save");
      if (res.ok) {
        const data = await res.json();
        setSavedResources(data.resources ?? []);
      }
    } catch {
      // non-fatal
    } finally {
      setLoadingSaved(false);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (generating) return;
    setError(null);
    setGenerating(true);

    try {
      const res = await fetch("/api/resources/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to get suggestions. Please try again.");
      } else {
        setVideos(data.videos ?? []);
        setBooks(data.books ?? []);
        setHasResults(true);
      }
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function saveVideo(video: VideoSuggestion) {
    const key = "video-" + video.title;
    setSavingKey(key);
    try {
      const url =
        "https://www.youtube.com/results?search_query=" +
        encodeURIComponent(video.searchQuery);
      await fetch("/api/resources/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistName: "General",
          title: video.title,
          url,
          type: "video",
        }),
      });
      await loadSavedResources();
    } finally {
      setSavingKey(null);
    }
  }

  async function saveBook(book: BookSuggestion) {
    const key = "book-" + book.title;
    setSavingKey(key);
    try {
      const query = encodeURIComponent(book.title + " " + book.author);
      const amazonUrl = "https://www.amazon.in/s?k=" + query;
      await fetch("/api/resources/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistName: "Books",
          title: book.title + " by " + book.author,
          url: amazonUrl,
          type: "book",
        }),
      });
      await loadSavedResources();
    } finally {
      setSavingKey(null);
    }
  }

  async function removeSaved(id: string) {
    await fetch("/api/resources/save?id=" + id, { method: "DELETE" });
    setSavedResources((prev) => prev.filter((r) => r._id !== id));
  }

  async function handleClearAll() {
    await Promise.all(
      savedResources.map((r) =>
        fetch("/api/resources/save?id=" + r._id, { method: "DELETE" })
      )
    );
    setSavedResources([]);
  }

  function isSaved(title: string) {
    return savedResources.some(
      (r) => r.title === title || r.title.startsWith(title)
    );
  }

  return (
    <>
      <BackgroundOrbs />
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8 relative z-10">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen size={28} className="text-[var(--accent-teal)]" />
            <h1 className="text-3xl font-bold text-on-surface dark:text-on-surface-dark">Resources</h1>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-500 dark:text-gray-400 text-base">
              Get personalized video and book recommendations curated for your learning goals.
            </p>
            <button
              onClick={() => setResourcesOpen((p) => !p)}
              aria-label={resourcesOpen ? "Close saved resources" : "Open saved resources"}
              aria-expanded={resourcesOpen}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition flex-none ${
                resourcesOpen
                  ? "border-[var(--accent-teal)] bg-[var(--accent-teal)]/20 text-[var(--accent-teal)]"
                  : "border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <History size={16} />
              Resources
            </button>
          </div>
        </div>

        {/* ── Generator Section ── */}
        <GlassCard>
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1 text-on-surface dark:text-on-surface-dark">Find Learning Resources</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Get video and book suggestions tailored to your profile — or ask about a specific topic.
              </p>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Data Structures & Algorithms, System Design… (optional)"
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[var(--accent-teal)] transition"
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
                    Finding resources…
                  </>
                ) : (
                  "Get Suggestions"
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
                { icon: Lightbulb, title: "Tell us what you need", desc: "Enter a topic or leave it blank — AI will use your profile to find the best resources." },
                { icon: Sparkles, title: "AI curates suggestions", desc: "Get matched YouTube videos and books with explanations of why each was chosen." },
                { icon: ListChecks, title: "Save & organize", desc: "Bookmark resources into playlists and revisit them whenever you're ready to learn." },
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
            <p className="text-gray-700 dark:text-gray-300 font-medium">Curating resources for you…</p>
          </GlassCard>
        )}

        {hasResults && !generating && (
          <section>
            <h2 className="text-lg font-bold mb-4 text-red-400 flex items-center gap-2">
              <PlayCircle size={20} />
              Video Suggestions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {videos.map((v, i) => {
                const saved = isSaved(v.title);
                const key = "video-" + v.title;
                const ytUrl =
                  "https://www.youtube.com/results?search_query=" +
                  encodeURIComponent(v.searchQuery);
                return (
                  <GlassCard key={i} className="!p-5">
                    <h3 className="font-semibold text-base mb-1 text-gray-900 dark:text-gray-100">
                      {v.title}
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">{v.channel}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{v.reason}</p>
                    <div className="flex items-center gap-3">
                      <a
                        href={ytUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--accent-teal)] hover:opacity-80 transition flex items-center gap-1"
                      >
                        <ExternalLink size={12} />
                        Search on YouTube
                      </a>
                      <button
                        onClick={() => saveVideo(v)}
                        disabled={saved || savingKey === key}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition flex items-center gap-1 disabled:opacity-60"
                      >
                        {saved ? (
                          <>
                            <BookmarkCheck size={12} className="text-emerald-400" />
                            Saved
                          </>
                        ) : (
                          <>
                            <Bookmark size={12} />
                            {savingKey === key ? "Saving…" : "Save"}
                          </>
                        )}
                      </button>
                    </div>
                  </GlassCard>
                );
              })}
            </div>

            <h2 className="text-lg font-bold mb-4 text-amber-400 flex items-center gap-2">
              <BookOpen size={20} />
              Book Suggestions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {books.map((b, i) => {
                const fullTitle = b.title + " by " + b.author;
                const saved = isSaved(fullTitle);
                const key = "book-" + b.title;
                const query = encodeURIComponent(b.title + " " + b.author);
                const amazonUrl = "https://www.amazon.in/s?k=" + query;
                const flipkartUrl = "https://www.flipkart.com/search?q=" + query;
                return (
                  <GlassCard key={i} className="!p-5">
                    <h3 className="font-semibold text-base mb-1 text-gray-900 dark:text-gray-100">
                      {b.title}
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">by {b.author}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{b.reason}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <a
                        href={amazonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-amber-400 hover:text-amber-300 transition flex items-center gap-1"
                      >
                        <ExternalLink size={12} />
                        Amazon
                      </a>
                      <a
                        href={flipkartUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
                      >
                        <ExternalLink size={12} />
                        Flipkart
                      </a>
                      <button
                        onClick={() => saveBook(b)}
                        disabled={saved || savingKey === key}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition flex items-center gap-1 disabled:opacity-60"
                      >
                        {saved ? (
                          <>
                            <BookmarkCheck size={12} className="text-emerald-400" />
                            Saved
                          </>
                        ) : (
                          <>
                            <Bookmark size={12} />
                            {savingKey === key ? "Saving…" : "Save"}
                          </>
                        )}
                      </button>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </section>
        )}

      </main>

      {/* Saved Resources Sidebar */}
      <ResourcesSidebar
        open={resourcesOpen}
        onClose={() => setResourcesOpen(false)}
        resources={savedResources}
        onRemove={removeSaved}
        onClearAll={handleClearAll}
        onOpenResource={(url) => window.open(url, "_blank", "noopener,noreferrer")}
      />
    </>
  );
}
