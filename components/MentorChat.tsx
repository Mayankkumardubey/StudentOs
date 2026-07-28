"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  BookOpen,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Minus,
  Loader2,
  Sparkles,
  Trash2,
  Clock,
  ArrowLeft,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "model";
  text: string;
}

interface ChatSession {
  id: string;
  timestamp: number;
  messages: Message[];
}

interface GeminiHistoryTurn {
  role: "user" | "model";
  parts: { text: string }[];
}

const STORAGE_KEY = "mentor-chat-pos";
const HISTORY_KEY = "mentor-chat-history";
const QUICK_PROMPTS = [
  "Weekly Report",
  "Motivate Me",
  "Study Plan",
  "Resume Help",
  "Interview Tips",
  "Explain Topic",
];

const SYSTEM_HINTS: Record<string, string> = {
  "Weekly Report":
    "Give me a brief weekly productivity report template I can fill out as a student. Include sections for what I studied, what I completed, what's pending, and goals for next week.",
  "Motivate Me":
    "Give me a short, powerful motivational message for a college student working hard on their goals. Be real, not cheesy.",
  "Study Plan":
    "Help me create a study plan for the next 7 days. Ask me what subject or topic I'm focusing on, and suggest a balanced daily schedule.",
  "Resume Help":
    "Give me top 5 resume tips for a college student applying for internships or entry-level jobs in India. Be specific and actionable.",
  "Interview Tips":
    "Give me 5 essential interview tips for a college student preparing for campus placements or internship interviews. Focus on both technical and soft skills.",
  "Explain Topic":
    "Ask me what topic I'd like explained, and I'll break it down simply. I'm a college student, so keep it practical and easy to understand.",
};

// ── Position helpers ─────────────────────────────────────────────────────────
function loadPosition(): { x: number; y: number } {
  if (typeof window === "undefined")   return { x: -1, y: -1 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const pos = JSON.parse(raw);
      if (typeof pos.x === "number" && typeof pos.y === "number") return pos;
    }
  } catch {
    // ignore
  }
  return { x: window.innerWidth - 80, y: window.innerHeight - 80 };
}

function savePosition(x: number, y: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y }));
  } catch {
    // ignore
  }
}

function clampToScreen(x: number, y: number): { x: number; y: number } {
  const btnSize = 56;
  const maxX = window.innerWidth - btnSize;
  const maxY = window.innerHeight - btnSize;
  return {
    x: Math.max(0, Math.min(x, maxX)),
    y: Math.max(0, Math.min(y, maxY)),
  };
}

// ── Chat history helpers ─────────────────────────────────────────────────────
function loadHistory(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

function saveHistory(sessions: ChatSession[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(sessions));
  } catch {
    // ignore
  }
}

// ── Speech recognition check ─────────────────────────────────────────────────
function getSpeechRecognition(): unknown {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function MentorChat() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  // Position — use fixed CSS for SSR, override with localStorage after mount
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [posReady, setPosReady] = useState(false);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const didDrag = useRef(false);

  // Hydrate position after mount to avoid SSR mismatch
  useEffect(() => {
    const p = loadPosition();
    setPos(clampToScreen(p.x, p.y));
    setPosReady(true);
  }, []);

  // Voice
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Chat
  const chatEndRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<GeminiHistoryTurn[]>([]);

  // History panel
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [viewingSession, setViewingSession] = useState<ChatSession | null>(null);

  // Load history on mount
  useEffect(() => {
    setSessions(loadHistory());
  }, []);

  // Init speech synth
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Listen for external open-mentor events
  useEffect(() => {
    function handleOpen() {
      setOpen(true);
      setMinimized(false);
    }
    window.addEventListener("open-mentor", handleOpen);
    return () => window.removeEventListener("open-mentor", handleOpen);
  }, []);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Drag handlers ────────────────────────────────────────────────────────
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      dragging.current = true;
      didDrag.current = false;
      dragStart.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [pos]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
      const next = clampToScreen(dragStart.current.px + dx, dragStart.current.py + dy);
      setPos(next);
    },
    []
  );

  const onPointerUp = useCallback(() => {
    if (dragging.current) {
      dragging.current = false;
      savePosition(pos.x, pos.y);
    }
  }, [pos]);

  // ── Send message ─────────────────────────────────────────────────────────
  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/mentor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: historyRef.current,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "model", text: data.error ?? "Something went wrong." },
        ]);
      } else {
        const reply = data.reply ?? "";
        setMessages((prev) => [...prev, { role: "model", text: reply }]);
        historyRef.current.push(
          { role: "user", parts: [{ text: trimmed }] },
          { role: "model", parts: [{ text: reply }] }
        );
        // Keep history manageable (last 10 turns)
        if (historyRef.current.length > 20) {
          historyRef.current = historyRef.current.slice(-20);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "Network error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // ── Clear chat (save to history first) ───────────────────────────────────
  function clearChat() {
    if (messages.length === 0) return;
    const session: ChatSession = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      messages: [...messages],
    };
    const updated = [session, ...sessions];
    setSessions(updated);
    saveHistory(updated);
    setMessages([]);
    historyRef.current = [];
  }

  // ── Delete a history session ─────────────────────────────────────────────
  function deleteSession(id: string) {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    saveHistory(updated);
    if (viewingSession?.id === id) setViewingSession(null);
  }

  // ── Voice input ──────────────────────────────────────────────────────────
  function toggleVoice() {
    const SpeechRecognitionCtor = getSpeechRecognition();
    if (!SpeechRecognitionCtor) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (recording && recognitionRef.current) {
      recognitionRef.current.stop();
      setRecording(false);
      return;
    }

    const recognition = new (SpeechRecognitionCtor as new () => any)();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onend = () => setRecording(false);
    recognition.onerror = () => setRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }

  // ── Text-to-speech ───────────────────────────────────────────────────────
  function speak(text: string, idx: number) {
    const synth = synthRef.current;
    if (!synth) return;

    // If already speaking this one, stop
    if (speakingIdx === idx) {
      synth.cancel();
      setSpeakingIdx(null);
      return;
    }

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);
    synth.speak(utterance);
    setSpeakingIdx(idx);
  }

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      synthRef.current?.cancel();
    };
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Floating Action Button ───────────────────────────── */}
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={() => {
          if (didDrag.current) return;
          setOpen((p) => !p);
          setMinimized(false);
        }}
        aria-label="Open Mentor Hub"
        className="fixed z-[100] flex items-center justify-center w-14 h-14 rounded-full
          bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40
          transition-all duration-200 hover:scale-105 active:scale-95
          animate-[glow_3s_ease-in-out_infinite]"
        style={
          posReady
            ? { left: pos.x, top: pos.y, touchAction: "none" }
            : { right: "1rem", bottom: "1rem", touchAction: "none" }
        }
      >
        <BookOpen size={22} />
      </button>

      {/* ── Glow keyframes (injected once) ───────────────────── */}
      <style>{`
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 12px 2px rgba(99,102,241,0.4); }
          50% { box-shadow: 0 0 24px 6px rgba(99,102,241,0.6); }
        }
      `}</style>

      {/* ── Chat Window ─────────────────────────────────────── */}
      {open && (
        <div
          className={`fixed z-[100] flex flex-col
            bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl
            w-[min(400px,calc(100vw-2rem))] transition-all duration-200
            ${minimized ? "h-12" : "h-[min(560px,calc(100vh-6rem))]"}`}
          style={{
            right: "1rem",
            bottom: "5rem",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-t-2xl">
            <div className="flex items-center gap-2">
              {showHistory || viewingSession ? (
                <button
                  onClick={() => {
                    setShowHistory(false);
                    setViewingSession(null);
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                  aria-label="Back to chat"
                >
                  <ArrowLeft size={14} />
                </button>
              ) : (
                <Sparkles size={16} className="text-indigo-400" />
              )}
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {viewingSession
                  ? `Chat — ${new Date(viewingSession.timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                  : showHistory
                    ? "Chat History"
                    : "AI Mentor"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {!showHistory && !viewingSession && (
                <>
                  <button
                    onClick={clearChat}
                    disabled={messages.length === 0}
                    className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition disabled:opacity-30"
                    aria-label="Clear chat"
                    title="Save & clear chat"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setShowHistory(true);
                      setViewingSession(null);
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                    aria-label="Chat history"
                  >
                    <Clock size={14} />
                  </button>
                </>
              )}
              <button
                onClick={() => setMinimized((p) => !p)}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                aria-label="Minimize"
              >
                <Minus size={14} />
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  setMinimized(false);
                  setShowHistory(false);
                  setViewingSession(null);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Body (hidden when minimized) */}
          {!minimized && (
            <>
              {/* ── History Panel ──────────────────────────────── */}
              {showHistory && !viewingSession && (
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {sessions.length === 0 ? (
                    <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">
                      <Clock size={28} className="mx-auto mb-2 text-gray-400 dark:text-gray-600" />
                      <p>No chat history yet.</p>
                      <p className="text-xs mt-1 text-gray-400 dark:text-gray-600">
                        Past conversations will appear here.
                      </p>
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <div
                        key={session.id}
                        className="group flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 cursor-pointer transition"
                      >
                        <button
                          onClick={() => setViewingSession(session)}
                          className="flex-1 text-left"
                        >
                          <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                            {session.messages[0]?.text.slice(0, 60) ?? "Empty chat"}
                            {(session.messages[0]?.text.length ?? 0) > 60 ? "…" : ""}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {session.messages.length} messages ·{" "}
                            {new Date(session.timestamp).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </button>
                        <button
                          onClick={() => deleteSession(session.id)}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-red-400 transition"
                          aria-label="Delete chat"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ── Viewing a past session ─────────────────────── */}
              {viewingSession && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {viewingSession.messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Active chat ────────────────────────────────── */}
              {!showHistory && !viewingSession && (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 && (
                      <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">
                        <Sparkles
                          size={28}
                          className="mx-auto mb-2 text-indigo-500"
                        />
                        <p>Hi! I&apos;m your AI Mentor.</p>
                        <p className="text-xs mt-1 text-gray-400 dark:text-gray-600">
                          Ask me anything about study, career, or life.
                        </p>
                      </div>
                    )}

                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                          {msg.role === "model" && (
                            <button
                              onClick={() => speak(msg.text, i)}
                              className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-400 transition"
                            >
                              {speakingIdx === i ? (
                                <VolumeX size={12} />
                              ) : (
                                <Volume2 size={12} />
                              )}
                              {speakingIdx === i ? "Stop" : "Speak"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 flex items-center gap-2">
                          <Loader2
                            size={14}
                            className="animate-spin text-indigo-400"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">Thinking…</span>
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Quick prompts */}
                  {messages.length === 0 && (
                    <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                      {QUICK_PROMPTS.map((p) => (
                        <button
                          key={p}
                          onClick={() => {
                            const hint = SYSTEM_HINTS[p] ?? p;
                            sendMessage(hint);
                          }}
                          className="px-2.5 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-700 transition"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input bar */}
                  <div className="px-3 pb-3 pt-2 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2">
                      <button
                        onClick={toggleVoice}
                        className={`p-1.5 rounded-lg transition ${
                          recording
                            ? "bg-red-600 text-white"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800"
                        }`}
                        aria-label="Voice input"
                      >
                        {recording ? <MicOff size={16} /> : <Mic size={16} />}
                      </button>

                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && !e.shiftKey && sendMessage(input)
                        }
                        placeholder="Ask your mentor…"
                        className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
                      />

                      <button
                        onClick={() => sendMessage(input)}
                        disabled={loading || !input.trim()}
                        className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 disabled:opacity-40 transition"
                        aria-label="Send"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
