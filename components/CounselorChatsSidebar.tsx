"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  User,
  Bot,
} from "lucide-react";

interface ChatMessage {
  role: "user" | "model";
  content: string;
  timestamp?: string;
}

export default function CounselorChatsSidebar({
  open,
  onClose,
  messages,
  onDeleteMessage,
  onClearAll,
}: {
  open: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onDeleteMessage: (index: number) => Promise<void>;
  onClearAll: () => Promise<void>;
}) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (sidebarRef.current?.contains(target)) return;
      onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (confirmDeleteIndex !== null) {
          setConfirmDeleteIndex(null);
        } else if (showClearConfirm) {
          setShowClearConfirm(false);
        } else {
          onClose();
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose, showClearConfirm, confirmDeleteIndex]);

  async function handleClearAll() {
    setClearing(true);
    try {
      await onClearAll();
      setShowClearConfirm(false);
    } finally {
      setClearing(false);
    }
  }

  async function handleDeleteOne(index: number) {
    setDeletingIndex(index);
    try {
      await onDeleteMessage(index);
      setConfirmDeleteIndex(null);
    } finally {
      setDeletingIndex(null);
    }
  }

  function formatTime(timestamp?: string): string {
    if (!timestamp) return "";
    try {
      return new Date(timestamp).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        ref={sidebarRef}
        role="complementary"
        aria-label="Chat history"
        className={`
          fixed inset-y-0 right-0 z-40 w-80
          bg-surface dark:bg-[#0e1513] border-l border-outline-variant/40
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-outline-variant/40">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-accent-teal" />
            <h2 className="text-sm font-semibold text-on-surface font-display">
              Chat History
            </h2>
            {messages.length > 0 && (
              <span className="text-[11px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded-full">
                {messages.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                aria-label="Clear all messages"
                className="p-1.5 rounded-md text-on-surface-variant hover:text-red-400 hover:bg-surface-container transition"
                title="Clear all messages"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close chat history"
              className="p-1.5 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Message list */}
        <div ref={listRef} className="flex-1 overflow-y-auto" aria-label="Chat messages">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <MessageSquare size={36} className="text-on-surface-variant/30 mb-3" />
              <p className="text-sm font-medium text-on-surface-variant mb-1">
                No messages yet
              </p>
              <p className="text-xs text-on-surface-variant/60">
                Start a conversation with your AI counselor.
              </p>
            </div>
          ) : (
            <ul role="list" className="p-2 space-y-1">
              {messages.map((msg, i) => {
                const isConfirmingDelete = confirmDeleteIndex === i;
                const isDeleting = deletingIndex === i;
                const isUser = msg.role === "user";

                return (
                  <li key={i}>
                    <div className="relative rounded-xl px-3 py-3 border border-transparent hover:bg-surface-container/50 hover:border-outline-variant/30 transition">
                      <div className="flex items-start gap-2.5">
                        {/* Avatar */}
                        <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                          isUser
                            ? "bg-[#0b1c30] text-white"
                            : "bg-accent-teal/20 text-accent-teal"
                        }`}>
                          {isUser ? <User size={12} /> : <Bot size={12} />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                              {isUser ? "You" : "AI Counselor"}
                            </span>
                            {msg.timestamp && (
                              <span className="text-[10px] text-on-surface-variant/50">
                                {formatTime(msg.timestamp)}
                              </span>
                            )}
                          </div>

                          {isConfirmingDelete ? (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] text-red-400">
                                Delete this message?
                              </span>
                              <button
                                onClick={() => handleDeleteOne(i)}
                                disabled={isDeleting}
                                className="text-[11px] px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white transition disabled:opacity-50"
                              >
                                {isDeleting ? (
                                  <Loader2 size={10} className="animate-spin" />
                                ) : (
                                  "Yes"
                                )}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteIndex(null)}
                                disabled={isDeleting}
                                className="text-[11px] px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition disabled:opacity-50"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs text-on-surface leading-relaxed line-clamp-3">
                              {msg.content}
                            </p>
                          )}
                        </div>

                        {/* Delete button */}
                        {!isConfirmingDelete && (
                          <button
                            onClick={() => setConfirmDeleteIndex(i)}
                            disabled={isDeleting}
                            aria-label="Delete message"
                            className="shrink-0 p-1 rounded-md text-on-surface-variant/40 hover:text-red-400 hover:bg-surface-container transition disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Clear All confirmation dialog */}
      {showClearConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-chat-title"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <div className="bg-surface/90 dark:bg-[#1a211f]/90 backdrop-blur-xl border border-outline-variant/40 rounded-xl p-6 w-full max-w-sm shadow-xl mx-4">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle size={20} className="text-amber-400" />
              <h3
                id="clear-chat-title"
                className="text-lg font-semibold text-on-surface font-display"
              >
                Clear All Messages?
              </h3>
            </div>
            <p className="text-on-surface-variant text-sm mb-6">
              This will permanently delete your entire conversation with the AI
              counselor. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={clearing}
                className="px-4 py-2 rounded-md text-on-surface-variant hover:bg-surface-container transition disabled:opacity-50 font-body"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white transition disabled:opacity-70 flex items-center gap-2 min-w-[90px] justify-center font-body"
              >
                {clearing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Clear All"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
