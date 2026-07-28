"use client";

import { useState } from "react";
import { MessageSquare, ChevronDown, ChevronRight } from "lucide-react";
import CommentSection from "./CommentSection";

interface Attachment {
  type: "image" | "pdf";
  data: string;
  filename: string;
}

interface PostAuthor {
  username: string;
  avatarBase64: string;
}

interface Comment {
  _id: string;
  author: string;
  text: string;
  replies: { authorId: string; text: string; createdAt: string }[];
  createdAt: string;
}

interface Post {
  _id: string;
  author: PostAuthor;
  text: string;
  attachments: Attachment[];
  comments: Comment[];
  commentCount: number;
  createdAt: string;
}

export default function CommunityPostCard({
  post,
  communityId,
}: {
  post: Post;
  communityId: string;
}) {
  const [showComments, setShowComments] = useState(false);

  const timeAgo = getTimeAgo(post.createdAt);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-5">
      {/* Author header */}
      <div className="flex items-center gap-3 mb-3">
        {post.author.avatarBase64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.author.avatarBase64}
            alt=""
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
            {post.author.username[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {post.author.username}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{timeAgo}</p>
        </div>
      </div>

      {/* Text */}
      {post.text && (
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-3">
          {post.text}
        </p>
      )}

      {/* Attachments */}
      {post.attachments.length > 0 && (
        <div className="space-y-2 mb-3">
          {post.attachments.map((att, i) =>
            att.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={att.data}
                alt={att.filename}
                className="rounded-lg max-h-80 object-contain bg-gray-100 dark:bg-gray-800"
              />
            ) : (
              <a
                key={i}
                href={att.data}
                download={att.filename}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 transition"
              >
                📄 {att.filename}
              </a>
            )
          )}
        </div>
      )}

      {/* Comment toggle */}
      <button
        onClick={() => setShowComments((p) => !p)}
        className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition mt-2"
      >
        {showComments ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <MessageSquare size={14} />
        {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
      </button>

      {/* Comments */}
      {showComments && (
        <CommentSection
          communityId={communityId}
          postId={post._id}
          comments={post.comments}
        />
      )}
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
