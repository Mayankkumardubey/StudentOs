"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface Reply {
  authorId: string;
  text: string;
  createdAt: string;
}

interface Comment {
  _id: string;
  author: string;
  text: string;
  replies: Reply[];
  createdAt: string;
}

export default function CommentSection({
  communityId,
  postId,
  comments: initialComments,
}: {
  communityId: string;
  postId: string;
  comments: Comment[];
}) {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);

  async function addComment() {
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/communities/${communityId}/posts/${postId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: newComment.trim() }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [
          ...prev,
          { ...data.comment, replies: data.comment.replies ?? [] },
        ]);
        setNewComment("");
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function addReply(commentId: string) {
    if (!replyText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/communities/${communityId}/posts/${postId}/comments/${commentId}/replies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: replyText.trim() }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId
              ? { ...c, replies: [...c.replies, data.reply] }
              : c
          )
        );
        setReplyText("");
        setReplyTo(null);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800 space-y-3">
      {/* Existing comments */}
      {comments.map((comment) => (
        <div key={comment._id} className="space-y-2">
          <div className="text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {comment.author || "User"}
            </span>
            <span className="text-gray-400 dark:text-gray-500 text-xs ml-2">
              {getTimeAgo(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{comment.text}</p>

          {/* Replies */}
          {comment.replies.map((reply, i) => (
            <div key={i} className="ml-4 pl-3 border-l border-gray-200 dark:border-gray-800 text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {reply.authorId || "User"}
              </span>
              <span className="text-gray-400 dark:text-gray-500 text-xs ml-2">
                {getTimeAgo(reply.createdAt)}
              </span>
              <p className="text-gray-500 dark:text-gray-400 mt-0.5">{reply.text}</p>
            </div>
          ))}

          {/* Reply button / form */}
          {replyTo === comment._id ? (
            <div className="ml-4 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addReply(comment._id)}
                placeholder="Write a reply…"
                className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => addReply(comment._id)}
                disabled={loading || !replyText.trim()}
                className="text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setReplyTo(comment._id);
                setReplyText("");
              }}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 ml-4"
            >
              Reply
            </button>
          )}
        </div>
      ))}

      {/* New comment input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addComment()}
          placeholder="Write a comment…"
          className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={addComment}
          disabled={loading || !newComment.trim()}
          className="text-indigo-400 hover:text-indigo-300 disabled:opacity-50 p-2"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
