"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import BackgroundOrbs from "@/components/ui/BackgroundOrbs";

export default function CreateCommunityPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/communities/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Upload failed.");
        return;
      }
      const data = await res.json();
      setImage(data.attachment.data);
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleCreate() {
    if (!name.trim()) {
      setError("Community name is required.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category: category.trim(),
          image,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create.");
        return;
      }
      router.push(`/communities/${data.community._id}`);
    } catch {
      setError("Network error.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 relative z-10">
      <BackgroundOrbs />
      <div className="flex items-center gap-3">
        <Link
          href="/communities"
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
        >
          <ArrowLeft size={16} />
          Back
        </Link>
        <h1 className="text-2xl font-bold">Create Community</h1>
      </div>

      <div className="space-y-4">
        {/* Image */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-outline-variant bg-surface-container flex items-center justify-center text-on-surface-variant hover:border-accent-teal transition overflow-hidden"
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="w-full h-full object-cover" />
            ) : uploading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <span className="text-xs">Upload</span>
            )}
          </button>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. DSA Study Group"
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-accent-teal transition"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this community about?"
            rows={3}
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-accent-teal resize-none transition"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
            Category
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Coding, Career, Study Group"
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-accent-teal transition"
          />
        </div>

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        <button
          onClick={handleCreate}
          disabled={creating || uploading || !name.trim()}
          className="w-full py-2.5 rounded-lg bg-accent-coral hover:opacity-90 text-white text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? "Creating…" : "Create Community"}
        </button>
      </div>
    </div>
  );
}
