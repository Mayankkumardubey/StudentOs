"use client";

import { useState } from "react";
import { Search, Hash, Loader2 } from "lucide-react";

export default function JoinCommunityForm({
  onJoined,
}: {
  onJoined: () => void;
}) {
  const [tab, setTab] = useState<"search" | "code">("search");
  const [query, setQuery] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [results, setResults] = useState<{ _id: string; name: string; description: string; category: string; image: string; memberCount: number; isMember: boolean }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(
        `/api/communities/search?q=${encodeURIComponent(query.trim())}`
      );
      const data = await res.json();
      setResults(data.communities ?? []);
    } catch {
      setError("Search failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(communityId?: string) {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const body = communityId
        ? { communityId }
        : { joinCode: joinCode.trim().toUpperCase() };
      const res = await fetch("/api/communities/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Join failed.");
        return;
      }
      setSuccess(`Joined "${data.community.name}"!`);
      setQuery("");
      setJoinCode("");
      setResults([]);
      onJoined();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("search")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${
            tab === "search"
              ? "bg-indigo-900/50 text-indigo-300 border border-indigo-700"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-transparent"
          }`}
        >
          <Search size={14} /> Search
        </button>
        <button
          onClick={() => setTab("code")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${
            tab === "code"
              ? "bg-indigo-900/50 text-indigo-300 border border-indigo-700"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-transparent"
          }`}
        >
          <Hash size={14} /> Join Code
        </button>
      </div>

      {/* Search tab */}
      {tab === "search" && (
        <div>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search communities…"
              className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-gray-900 dark:text-white text-sm font-semibold transition disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Search"}
            </button>
          </div>

          {results.length > 0 && (
            <div className="mt-3 space-y-2">
              {results.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {c.name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {c.memberCount} members
                      {c.category ? ` · ${c.category}` : ""}
                    </p>
                  </div>
                  {c.isMember ? (
                    <span className="text-xs text-emerald-400">Joined</span>
                  ) : (
                    <button
                      onClick={() => handleJoin(c._id)}
                      disabled={loading}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition disabled:opacity-50"
                    >
                      Join
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Join code tab */}
      {tab === "code" && (
        <div className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="Enter 8-digit join code"
            maxLength={8}
            className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono tracking-wider"
          />
          <button
            onClick={() => handleJoin()}
            disabled={loading || joinCode.trim().length < 4}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-gray-900 dark:text-white text-sm font-semibold transition disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Join"}
          </button>
        </div>
      )}

      {/* Messages */}
      {error && (
        <p className="text-xs text-red-400 mt-2">{error}</p>
      )}
      {success && (
        <p className="text-xs text-emerald-400 mt-2">{success}</p>
      )}
    </div>
  );
}
