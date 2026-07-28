"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Loader2,
  AlertTriangle,
  Compass,
  Sparkles,
} from "lucide-react";
import CommunityCard from "@/components/CommunityCard";
import JoinCommunityForm from "@/components/JoinCommunityForm";
import GlassCard from "@/components/ui/GlassCard";
import BackgroundOrbs from "@/components/ui/BackgroundOrbs";

interface Community {
  _id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  role: string;
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJoin, setShowJoin] = useState(false);

  async function fetchCommunities() {
    try {
      const res = await fetch("/api/communities");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setCommunities(data.communities ?? []);
    } catch {
      setError("Could not load communities.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/communities");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        if (!cancelled) setCommunities(data.communities ?? []);
      } catch {
        if (!cancelled) setError("Could not load communities.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative z-10">
      <BackgroundOrbs />
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Users size={28} className="text-accent-teal" />
          <h1 className="text-3xl font-bold text-on-surface">Communities</h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-base ml-[40px]">
          Connect with peers, share knowledge, and grow together in subject-focused groups.
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowJoin((p) => !p)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container text-sm text-on-surface-variant hover:bg-surface-container-high transition"
        >
          <Search size={16} /> Join
        </button>
        <Link
          href="/communities/create"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-accent-coral text-white text-sm font-semibold transition hover:opacity-90"
        >
          <Plus size={16} /> Create Community
        </Link>
      </div>

      {/* Join section */}
      {showJoin && <JoinCommunityForm onJoined={fetchCommunities} />}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-20 text-gray-400 dark:text-gray-500">
          <Loader2 size={20} className="animate-spin" />
          Loading communities…
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-center gap-3 bg-red-900/40 border border-red-700 text-red-300 text-sm px-5 py-4 rounded-xl">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && communities.length === 0 && (
        <div className="text-center py-20 bg-surface-container/50 border border-outline-variant rounded-2xl">
          <Users size={48} className="mx-auto text-on-surface-variant/40 mb-4" />
          <p className="text-on-surface font-medium text-lg mb-1">
            No communities yet
          </p>
          <p className="text-on-surface-variant text-sm mb-6">
            Create your own community or join an existing one to get started.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowJoin(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-outline-variant bg-surface-container text-sm text-on-surface-variant hover:bg-surface-container-high transition"
            >
              <Search size={16} /> Search to Join
            </button>
            <Link
              href="/communities/create"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-coral text-white text-sm font-semibold transition hover:opacity-90"
            >
              <Plus size={16} /> Create One
            </Link>
          </div>
        </div>
      )}

      {/* Community Grid */}
      {!loading && !error && communities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {communities.map((c) => (
            <CommunityCard key={c._id} {...c} />
          ))}
        </div>
      )}

      {/* Discover More */}
      {!loading && !error && (
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <Compass size={20} className="text-accent-teal" />
            <h2 className="text-lg font-semibold text-on-surface">Discover more communities</h2>
          </div>
          <p className="text-on-surface-variant text-sm mb-5">
            Join communities to collaborate with classmates, discuss subjects, and stay motivated together.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { title: "Study Groups", desc: "Find peers preparing for the same exams or courses." },
              { title: "Project Teams", desc: "Collaborate on hackathons, research, and builds." },
              { title: "Career Prep", desc: "Share interview experiences and referral opportunities." },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-surface-container/50 border border-outline-variant rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-accent-teal" />
                  <h3 className="text-sm font-semibold text-on-surface">{item.title}</h3>
                </div>
                <p className="text-xs text-on-surface-variant">{item.desc}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
