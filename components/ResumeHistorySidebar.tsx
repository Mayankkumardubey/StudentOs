"use client";

import { useState, useEffect, useRef } from "react";
import {
  Clock,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  FileText,
} from "lucide-react";

interface SavedAnalysis {
  _id: string;
  fileName: string;
  matchScore: number | null;
  analysis: {
    matchScore: number | null;
    strengths: string[];
    weaknesses: string[];
    missingSkills: string[];
    suggestions: string[];
  };
  createdAt: string;
}

export default function ResumeHistorySidebar({
  open,
  onClose,
  history,
  activeId,
  onSelect,
  onDelete,
  onClearAll,
}: {
  open: boolean;
  onClose: () => void;
  history: SavedAnalysis[];
  activeId?: string;
  onSelect: (analysis: SavedAnalysis) => void;
  onDelete: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
}) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Click outside to close
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

  // Escape key to close
  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (confirmDeleteId) {
          setConfirmDeleteId(null);
        } else if (showClearConfirm) {
          setShowClearConfirm(false);
        } else {
          onClose();
        }
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose, showClearConfirm, confirmDeleteId]);

  async function handleClearAll() {
    setClearing(true);
    try {
      await onClearAll();
      setShowClearConfirm(false);
    } finally {
      setClearing(false);
    }
  }

  async function handleDeleteOne(id: string) {
    setDeletingId(id);
    try {
      await onDelete(id);
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <>
      {/* Backdrop overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel — slides in from RIGHT */}
      <aside
        ref={sidebarRef}
        role="complementary"
        aria-label="Analysis history"
        className={`
          fixed inset-y-0 right-0 z-40 w-72
          bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Analysis History
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                aria-label="Clear all analyses"
                className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                title="Clear all analyses"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close history sidebar"
              className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List */}
        <nav
          className="flex-1 overflow-y-auto"
          aria-label="Saved analyses"
        >
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <FileText size={36} className="text-gray-300 dark:text-gray-700 mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                No analyses yet.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-600">
                Upload your first resume to see the analysis here.
              </p>
            </div>
          ) : (
            <ul role="list" className="p-2 space-y-1">
              {history.map((r) => {
                const isActive = activeId === r._id;
                const isConfirmingDelete = confirmDeleteId === r._id;
                const isDeleting = deletingId === r._id;

                return (
                  <li key={r._id}>
                    <div
                      className={`
                        relative rounded-xl px-3 py-3 transition
                        ${
                          isActive
                            ? "bg-indigo-500/10 border border-indigo-500/30"
                            : "border border-transparent hover:bg-gray-100/60 dark:hover:bg-gray-800/60 hover:border-gray-300 dark:hover:border-gray-700"
                        }
                      `}
                    >
                      {/* Card body — clickable to load */}
                      <div
                        role="button"
                        tabIndex={isDeleting ? -1 : 0}
                        aria-current={isActive ? "true" : undefined}
                        className="w-full text-left"
                        onClick={() => { if (!isDeleting) onSelect(r); }}
                        onKeyDown={(e) => { if (!isDeleting && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onSelect(r); } }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm font-medium leading-snug truncate ${
                              isActive ? "text-indigo-300" : "text-gray-800 dark:text-gray-200"
                            }`}
                          >
                            {r.fileName}
                          </p>
                          {/* Delete icon — stops propagation */}
                          {!isConfirmingDelete && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(r._id);
                              }}
                              disabled={isDeleting}
                              aria-label={`Delete analysis: ${r.fileName}`}
                              className="shrink-0 p-1 rounded-md text-gray-400 dark:text-gray-600 hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock
                            size={11}
                            className={
                              isActive
                                ? "text-indigo-400/60"
                                : "text-gray-400 dark:text-gray-600"
                            }
                          />
                          <span
                            className={`text-[11px] ${
                              isActive
                                ? "text-indigo-400/60"
                                : "text-gray-400 dark:text-gray-600"
                            }`}
                          >
                            {formatDate(r.createdAt)}
                          </span>
                          {r.matchScore !== null && (
                            <>
                              <span
                                className={`text-[11px] ${
                                  isActive ? "text-indigo-400/40" : "text-gray-300 dark:text-gray-700"
                                }`}
                              >
                                ·
                              </span>
                              <span
                                className={`text-[11px] font-medium ${
                                  isActive ? "text-indigo-400/60" : "text-gray-400 dark:text-gray-600"
                                }`}
                              >
                                {r.matchScore}% Match
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Inline delete confirmation */}
                      {isConfirmingDelete && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[11px] text-red-400">
                            Delete this analysis?
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOne(r._id);
                            }}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(null);
                            }}
                            disabled={isDeleting}
                            className="text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition disabled:opacity-50"
                          >
                            No
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>
      </aside>

      {/* Clear All confirmation dialog */}
      {showClearConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-analyses-title"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 w-full max-w-sm shadow-xl mx-4">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle size={20} className="text-amber-400" />
              <h3
                id="clear-analyses-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                Clear All Analyses?
              </h3>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              This will permanently remove all saved resume analyses. This
              action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={clearing}
                className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white transition disabled:opacity-70 flex items-center gap-2 min-w-[90px] justify-center"
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
