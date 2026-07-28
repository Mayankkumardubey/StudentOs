"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Loader2,
  AlertTriangle,
  LogOut,
  Copy,
  Check,
} from "lucide-react";
import CommunityPostCard from "@/components/CommunityPostCard";
import CreatePostForm from "@/components/CreatePostForm";
import GlassCard from "@/components/ui/GlassCard";
import BackgroundOrbs from "@/components/ui/BackgroundOrbs";

interface Member {
  _id: string;
  role: string;
  username: string;
  avatarBase64: string;
}

interface Post {
  _id: string;
  author: { username: string; avatarBase64: string };
  text: string;
  attachments: { type: "image" | "pdf"; data: string; filename: string }[];
  comments: { _id: string; author: string; text: string; replies: { authorId: string; text: string; createdAt: string }[]; createdAt: string }[];
  commentCount: number;
  createdAt: string;
}

interface CommunityDetail {
  _id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  joinCode: string;
  role: string;
  createdAt: string;
}

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadCommunity = useCallback(async () => {
    try {
      const res = await fetch(`/api/communities/${id}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to load community.");
        return;
      }
      const data = await res.json();
      setCommunity(data.community);
      setMembers(data.members);
      setPostCount(data.postCount);
    } catch {
      setError("Could not load community.");
    }
  }, [id]);

  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch(`/api/communities/${id}/posts`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts ?? []);
      }
    } catch {
      // silent
    }
  }, [id]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadCommunity(), loadPosts()]);
      setLoading(false);
    }
    init();
  }, [loadCommunity, loadPosts]);

  async function handleLeave() {
    if (!confirm("Are you sure you want to leave this community?")) return;
    try {
      const res = await fetch(`/api/communities/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/communities");
    } catch {
      // silent
    }
  }

  function copyJoinCode() {
    if (!community) return;
    navigator.clipboard.writeText(community.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 dark:text-gray-500">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 bg-red-900/40 border border-red-700 text-red-300 text-sm px-5 py-4 rounded-xl">
          <AlertTriangle size={18} />
          {error ?? "Community not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 relative z-10">
      <BackgroundOrbs />
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/communities"
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
        >
          <ArrowLeft size={16} />
          Communities
        </Link>
      </div>

      {/* Community info card */}
      <GlassCard>
        <div className="flex items-start gap-4">
          {community.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={community.image}
              alt={community.name}
              className="w-16 h-16 rounded-xl object-cover flex-none"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-accent-teal/20 border border-accent-teal/30 flex items-center justify-center text-accent-teal font-bold text-2xl flex-none">
              {community.name[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-on-surface">{community.name}</h1>
            {community.description && (
              <p className="text-sm text-on-surface-variant mt-1">{community.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-on-surface-variant">
              {community.category && (
                <span className="bg-surface-container rounded-full px-2 py-0.5">{community.category}</span>
              )}
              <span className="flex items-center gap-1">
                <Users size={12} /> {members.length} members
              </span>
              <span>{postCount} posts</span>
            </div>
          </div>
        </div>

        {/* Join code + Leave */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-outline-variant">
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant">Join code:</span>
            <code className="text-sm font-mono text-on-surface bg-surface-container px-2 py-0.5 rounded">
              {community.joinCode}
            </code>
            <button
              onClick={copyJoinCode}
              className="text-on-surface-variant hover:text-on-surface transition"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
          <button
            onClick={handleLeave}
            className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-red-400 transition"
          >
            <LogOut size={14} />
            {community.role === "owner" ? "Delete" : "Leave"}
          </button>
        </div>
      </GlassCard>

      {/* Members list */}
      <GlassCard>
        <h2 className="text-sm font-semibold text-on-surface mb-3">Members</h2>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <div
              key={m._id}
              className="flex items-center gap-2 bg-surface-container rounded-lg px-2.5 py-1.5"
            >
              {m.avatarBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.avatarBase64} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-outline-variant flex items-center justify-center text-[10px] text-on-surface-variant">
                  {m.username[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-xs text-on-surface">{m.username}</span>
              {m.role === "owner" && (
                <span className="text-[10px] text-amber-400">★</span>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Create post */}
      <CreatePostForm communityId={id} onPostCreated={loadPosts} />

      {/* Posts feed */}
      <div className="space-y-4">
        {posts.length === 0 && (
          <p className="text-center text-on-surface-variant text-sm py-8">
            No posts yet. Be the first to post!
          </p>
        )}
        {posts.map((post) => (
          <CommunityPostCard
            key={post._id}
            post={post}
            communityId={id}
          />
        ))}
      </div>
    </div>
  );
}
