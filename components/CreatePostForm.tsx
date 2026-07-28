"use client";

import { useState, useRef } from "react";
import { ImagePlus, FileText, X, Send } from "lucide-react";

interface Attachment {
  type: "image" | "pdf";
  data: string;
  filename: string;
}

export default function CreatePostForm({
  communityId,
  onPostCreated,
}: {
  communityId: string;
  onPostCreated: () => void;
}) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    if (!isImage && !isPdf) {
      setError("Only JPG, PNG, WEBP images and PDFs are allowed.");
      return;
    }

    if (isImage && file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }

    if (isPdf && file.size > 10 * 1024 * 1024) {
      setError("PDF must be under 10 MB.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/communities/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Upload failed.");
        return;
      }
      const data = await res.json();
      setAttachments((prev) => [...prev, data.attachment]);
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handlePost() {
    const hasText = text.trim().length > 0;
    const hasAttachments = attachments.length > 0;

    if (!hasText && !hasAttachments) {
      setError("Write something or attach a file.");
      return;
    }

    setPosting(true);
    setError(null);

    try {
      const res = await fetch(`/api/communities/${communityId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), attachments }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to post.");
        return;
      }

      setText("");
      setAttachments([]);
      onPostCreated();
    } catch {
      setError("Network error.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's on your mind?"
        rows={3}
        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
      />

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {attachments.map((att, i) => (
            <div key={i} className="relative group">
              {att.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={att.data}
                  alt={att.filename}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                  <FileText size={20} />
                </div>
              )}
              <button
                onClick={() =>
                  setAttachments((prev) => prev.filter((_, j) => j !== i))
                }
                className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition disabled:opacity-50"
          >
            <ImagePlus size={16} />
            {uploading ? "Uploading…" : "Attach"}
          </button>
        </div>

        <button
          onClick={handlePost}
          disabled={posting || uploading}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-gray-900 dark:text-white text-sm font-semibold transition disabled:opacity-50"
        >
          <Send size={14} />
          {posting ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
}
