"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare } from "lucide-react";
import BackgroundOrbs from "@/components/ui/BackgroundOrbs";
import GlassCard from "@/components/ui/GlassCard";
import CounselorChatsSidebar from "@/components/CounselorChatsSidebar";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "model";
  content: string;
}

interface HistoryTurn {
  role: "user" | "model";
  parts: { text: string }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildGeminiHistory(messages: Message[]): HistoryTurn[] {
  return messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));
}

const CONFUSED_MESSAGE =
  "I'm not sure where to start with my career. Can you ask me a few questions about my interests, strengths, and goals to help me figure out what path might suit me best?";

// ── Component ─────────────────────────────────────────────────────────────────
export default function CounselorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatsOpen, setChatsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/counselor/chat");
        if (res.ok) {
          const data = await res.json();
          const loaded: Message[] = (data.messages ?? []).map(
            (m: { role: "user" | "model"; content: string }) => ({
              role: m.role,
              content: m.content,
            })
          );
          setMessages(loaded);
        }
      } catch {
        // Non-fatal
      } finally {
        setInitializing(false);
      }
    }
    loadHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setError(null);

    const userMsg: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/counselor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: buildGeminiHistory(messages),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setMessages([...updatedMessages, { role: "model", content: data.reply }]);
      }
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const handleDeleteMessage = useCallback(async (index: number) => {
    try {
      const res = await fetch(`/api/counselor/chat?index=${index}`, { method: "DELETE" });
      if (res.ok) {
        setMessages((prev) => prev.filter((_, i) => i !== index));
      }
    } catch {
      // non-fatal
    }
  }, []);

  const handleClearAll = useCallback(async () => {
    try {
      const res = await fetch("/api/counselor/chat", { method: "DELETE" });
      if (res.ok) {
        setMessages([]);
      }
    } catch {
      // non-fatal
    }
  }, []);

  return (
    <div className="relative flex flex-col h-screen">
      <BackgroundOrbs />

      {/* Header bar with Chats toggle */}
      <header className="flex-none flex items-center justify-between px-4 py-3 border-b border-outline-variant/20 z-10">
        <h1 className="text-lg font-bold text-on-surface font-display">AI Counselor</h1>
        <button
          onClick={() => setChatsOpen((p) => !p)}
          aria-label={chatsOpen ? "Close chat history" : "Open chat history"}
          aria-expanded={chatsOpen}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition ${
            chatsOpen
              ? "border-accent-teal bg-accent-teal/20 text-accent-teal"
              : "border-outline-variant bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <MessageSquare size={16} />
          Chats
        </button>
      </header>

      {/* Message area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4 z-10">
        {initializing ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-on-surface-variant dark:text-on-surface-variant animate-pulse font-body">
              Loading your conversation…
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <p className="text-on-surface-variant dark:text-on-surface-variant max-w-md font-body">
              Ask anything about your career, exams, skills, or higher studies — or click{" "}
              <span className="text-accent-coral font-semibold">I Am Confused</span> if you
              don&apos;t know where to start.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={`${i}-${msg.role}`}
                initial={{
                  opacity: 0,
                  x: msg.role === "user" ? 40 : -40,
                }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "user" ? (
                  /* ── User bubble: deep navy, squared bottom-right ──── */
                  <div
                    className="max-w-[75%] px-4 py-3 text-sm leading-relaxed font-body
                      bg-[#0b1c30] text-white
                      rounded-2xl rounded-br-sm"
                  >
                    {msg.content}
                  </div>
                ) : (
                  /* ── AI bubble: glass, squared bottom-left ──────────── */
                  <div
                    className="max-w-[75%] px-4 py-3 text-sm leading-relaxed font-body
                      bg-glass backdrop-blur-xl border border-glass-border
                      text-on-surface dark:text-on-surface
                      rounded-2xl rounded-bl-sm shadow-[var(--glass-shadow)]"
                  >
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Typing indicator — teal bouncing dots */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="flex justify-start"
          >
            <div
              className="bg-glass backdrop-blur-xl border border-glass-border
                px-4 py-3 rounded-2xl rounded-bl-sm shadow-[var(--glass-shadow)]
                flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 bg-accent-teal rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-accent-teal rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-accent-teal rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </motion.div>
        )}

        {/* Error banner */}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-950/80 dark:bg-red-900/40 border border-red-800/60 dark:border-red-700/40 text-red-300 text-sm px-4 py-2 rounded-xl backdrop-blur-sm max-w-md text-center font-body">
              {error}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* Input area — glass panel */}
      <footer className="flex-none border-t border-outline-variant/30 dark:border-outline-variant/15 px-4 py-4 space-y-3 z-10">
        {/* "I Am Confused" button with pulsing coral glow */}
        <div className="flex justify-center">
          <button
            onClick={() => sendMessage(CONFUSED_MESSAGE)}
            disabled={loading}
            className="
              relative px-5 py-2.5 rounded-full font-semibold text-sm font-body
              bg-accent-coral text-white
              shadow-lg shadow-accent-coral/25
              hover:bg-accent-coral/90 hover:shadow-accent-coral/35
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              animate-[confusedPulse_3s_ease-in-out_infinite]
            "
          >
            <span className="relative z-10">😕 I Am Confused — Help Me Start</span>
            <span className="absolute inset-0 rounded-full bg-accent-coral/30 animate-[confusedGlow_3s_ease-in-out_infinite] blur-md" />
          </button>
        </div>

        {/* Text input bar — glass panel */}
        <GlassCard className="p-3">
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your career, skills, exams, higher studies…"
              rows={1}
              disabled={loading}
              className="
                flex-1 resize-none bg-white/50 dark:bg-white/5 border border-outline-variant dark:border-outline-variant
                rounded-xl px-4 py-3 text-sm text-on-surface dark:text-on-surface
                placeholder-on-surface-variant/50 dark:placeholder-on-surface-variant/50
                focus:outline-none focus:border-accent-teal focus:shadow-[0_0_0_3px_rgba(0,106,97,0.15)]
                dark:focus:shadow-[0_0_0_3px_rgba(87,241,219,0.15)]
                disabled:opacity-50 transition-all duration-200
                max-h-40 overflow-y-auto font-body
              "
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="
                flex-none px-5 py-3 rounded-xl bg-accent-teal hover:bg-accent-teal/90
                text-white font-semibold text-sm font-body
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                shadow-lg shadow-accent-teal/20
              "
            >
              Send
            </button>
          </form>
        </GlassCard>

        <p className="text-center text-xs text-on-surface-variant/50 dark:text-on-surface-variant/40 font-body">
          Press <kbd className="bg-surface-container dark:bg-surface-container-high px-1.5 py-0.5 rounded text-[10px]">Enter</kbd> to send ·{" "}
          <kbd className="bg-surface-container dark:bg-surface-container-high px-1.5 py-0.5 rounded text-[10px]">Shift+Enter</kbd> for new line
        </p>
      </footer>

      {/* CSS keyframes for confused button pulse */}
      <style>{`
        @keyframes confusedPulse {
          0%, 100% { box-shadow: 0 4px 14px 0 rgba(251,113,133,0.25); }
          50%      { box-shadow: 0 4px 28px 4px rgba(251,113,133,0.45); }
        }
        @keyframes confusedGlow {
          0%, 100% { opacity: 0; transform: scale(0.95); }
          50%      { opacity: 1; transform: scale(1.05); }
        }
      `}</style>

      {/* Chat History Sidebar */}
      <CounselorChatsSidebar
        open={chatsOpen}
        onClose={() => setChatsOpen(false)}
        messages={messages}
        onDeleteMessage={handleDeleteMessage}
        onClearAll={handleClearAll}
      />
    </div>
  );
}
