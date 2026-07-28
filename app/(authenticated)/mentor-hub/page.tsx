"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  Loader2,
  Send,
  Sparkles,
  AlertCircle,
  Search,
  Square,
  MessageSquare,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import BackgroundOrbs from "@/components/ui/BackgroundOrbs";

// ── Types ──────────────────────────────────────────────────────────────────────
type MicState = "idle" | "listening" | "processing";

// ── Speech recognition constructor helper ──────────────────────────────────────
function getSpeechRecognitionCtor(): (new () => any) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition as new () => any) || (w.webkitSpeechRecognition as new () => any) || null;
}

// ── Waveform Bars ──────────────────────────────────────────────────────────────
function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-[3px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="block w-[3px] rounded-full bg-teal-400"
          style={{
            height: "4px",
            animation: active
              ? `micWave 0.7s ease-in-out ${i * 0.12}s infinite alternate`
              : "none",
          }}
        />
      ))}
    </div>
  );
}

// ── Mic Button ─────────────────────────────────────────────────────────────────
function MicButton({
  state,
  onClick,
  disabled,
}: {
  state: MicState;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || state === "listening"}
      aria-label={
        state === "processing"
          ? "Starting microphone..."
          : "Start voice input"
      }
      className={`
        relative flex items-center justify-center
        w-10 h-10 rounded-full
        transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900
        disabled:opacity-40 disabled:cursor-not-allowed
        ${state === "processing" ? "bg-teal-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-teal-400 hover:bg-gray-200 dark:hover:bg-gray-700"}
      `}
    >
      {state === "processing" ? (
        <Loader2 size={18} className="animate-spin relative z-10" />
      ) : (
        <Mic size={18} className="relative z-10" />
      )}
    </button>
  );
}

// ── Stop Button (red square, only visible while listening) ────────────────────
function StopButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Stop listening"
      className="
        relative flex items-center justify-center
        w-10 h-10 rounded-full
        bg-red-600 text-white
        transition-all duration-200
        hover:bg-red-500
        focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900
      "
    >
      <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
      <Square size={14} className="relative z-10" fill="currentColor" />
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function MentorHubPage() {
  const [query, setQuery] = useState("");
  const [micState, setMicState] = useState<MicState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [browserSupported, setBrowserSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check browser support on mount
  useEffect(() => {
    setBrowserSupported(getSpeechRecognitionCtor() !== null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const stopListening = useCallback(() => {
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setMicState("idle");
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError(
        "Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari."
      );
      setBrowserSupported(false);
      return;
    }

    // Briefly show processing state while mic permission is requested
    setMicState("processing");

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      console.error("RECOGNITION ONSTART FIRED");
      setMicState("listening");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setQuery(transcript);
    };

    recognition.onend = () => {
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
        maxDurationTimerRef.current = null;
      }
      setMicState("idle");
      recognitionRef.current = null;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
        maxDurationTimerRef.current = null;
      }
      if (event.error === "not-allowed") {
        setError(
          "Microphone access was denied. Please allow microphone permissions in your browser settings and try again."
        );
      } else if (event.error === "no-speech") {
        setError("No speech was detected. Please try again.");
      } else if (event.error === "network") {
        setError("A network error occurred during speech recognition. Please check your connection.");
      } else {
        setError(`Speech recognition error: ${event.error}. Please try again.`);
      }
      setMicState("idle");
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();

    // Optimistic UI — don't wait for onstart (some browsers don't fire it reliably)
    setMicState("listening");

    // Auto-stop after 60 seconds as a safeguard
    maxDurationTimerRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }, 60_000);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!query.trim()) return;
    // Future: send query to AI mentor backend
    alert(`Search submitted: "${query.trim()}"`);
  }, [query]);

  const handleStop = useCallback(() => {
    stopListening();
    handleSubmit();
  }, [stopListening, handleSubmit]);

  const toggleMic = useCallback(() => {
    if (micState === "idle") {
      startListening();
    }
    // If processing or listening, ignore — stop is handled by StopButton
  }, [micState, startListening]);

  return (
    <div className="max-w-2xl mx-auto space-y-8 relative z-10">
      <BackgroundOrbs />
      {/* Inject waveform keyframes */}
      <style>{`
        @keyframes micWave {
          0% { height: 4px; }
          100% { height: 20px; }
        }
      `}</style>

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="space-y-2 pt-4">
          <div className="flex items-center gap-3">
            <MessageSquare size={28} className="text-accent-teal" />
            <h1 className="text-3xl font-bold text-on-surface">AI Mentor</h1>
          </div>
          <p className="text-on-surface-variant text-base ml-[40px]">
          Ask your AI mentor anything — use your voice or type below.
        </p>
      </div>

      {/* ── Search / Voice Input Area ──────────────────────── */}
      <div className="bg-surface-container/50 border border-outline-variant rounded-2xl p-6 space-y-4">
        {/* Browser not supported banner */}
        {!browserSupported && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Voice input not available</p>
              <p className="text-amber-600 dark:text-amber-400/80 text-xs mt-1">
                Your browser doesn&apos;t support the Web Speech API. Please use
                Google Chrome, Microsoft Edge, or Safari for voice input.
              </p>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 dark:text-red-400/60 hover:text-red-700 dark:hover:text-red-300 text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Text input with mic + send */}
        <div className="flex items-center gap-3 bg-surface-container border border-outline-variant rounded-xl px-4 py-3">
          <Search size={18} className="text-on-surface-variant shrink-0" />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) handleSubmit();
            }}
            placeholder="Type or use the mic to speak..."
            className="flex-1 bg-transparent text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none"
          />

          {/* Mic button + stop button + waveform */}
          <MicButton state={micState} onClick={toggleMic} disabled={!browserSupported} />
          {micState === "listening" && (
            <>
              <StopButton onClick={handleStop} />
              <Waveform active />
            </>
          )}

          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={!query.trim()}
            className="p-2 rounded-lg text-teal-400 hover:text-teal-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </div>

        {/* Listening / status indicator */}
        <div className="flex items-center justify-center gap-2 h-5">
          {micState === "listening" && (
            <span className="text-xs text-teal-400 font-medium animate-pulse">
              Listening...
            </span>
          )}
          {micState === "processing" && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Requesting microphone access...
            </span>
          )}
          {micState === "idle" && query && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Click the mic to add voice input, or press Enter to search
            </span>
          )}
        </div>
      </div>

      {/* ── Quick Prompts ──────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Try asking about</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            "Study tips for exams",
            "Career guidance",
            "Resume building",
            "Interview preparation",
            "Time management",
            "Skill development",
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => setQuery(prompt)}
              className="text-left p-3 rounded-xl bg-surface-container/50 border border-outline-variant text-sm text-on-surface hover:bg-surface-container hover:border-accent-teal/30 hover:text-on-surface transition"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* ── Info Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-8">
        {[
          {
            title: "Voice First",
            desc: "Speak naturally — your words are transcribed in real time.",
          },
          {
            title: "Smart Search",
            desc: "Ask anything and get tailored guidance from your AI mentor.",
          },
          {
            title: "Private & Secure",
            desc: "Audio is processed locally in your browser. Nothing is stored.",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="p-4 rounded-xl bg-surface-container/50 border border-outline-variant space-y-1"
          >
            <h3 className="text-sm font-semibold text-on-surface">{card.title}</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
