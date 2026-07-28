"use client";

import { useState, useEffect, useRef } from "react";
import {
  GraduationCap,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  Bell,
  BellOff,
  Pencil,
  Check,
} from "lucide-react";

interface SavedExam {
  _id: string;
  name: string;
  reason: string;
  timeline: string;
  category: "government" | "private";
  examDate: string;
  reminderEnabled: boolean;
}

export default function ExamsSidebar({
  open,
  onClose,
  exams,
  onRemove,
  onClearAll,
  onToggleReminder,
  onSaveExamDate,
}: {
  open: boolean;
  onClose: () => void;
  exams: SavedExam[];
  onRemove: (name: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  onToggleReminder: (exam: SavedExam) => void;
  onSaveExamDate: (examName: string, dateOverride?: string) => void;
}) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState<string | null>(null);
  const [editingDateName, setEditingDateName] = useState<string | null>(null);
  const [dateInputValue, setDateInputValue] = useState("");
  const sidebarRef = useRef<HTMLDivElement>(null);

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
        if (confirmDeleteName) {
          setConfirmDeleteName(null);
        } else if (editingDateName) {
          setEditingDateName(null);
        } else if (showClearConfirm) {
          setShowClearConfirm(false);
        } else {
          onClose();
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose, showClearConfirm, confirmDeleteName, editingDateName]);

  async function handleClearAll() {
    setClearing(true);
    try {
      await onClearAll();
      setShowClearConfirm(false);
    } finally {
      setClearing(false);
    }
  }

  async function handleDeleteOne(name: string) {
    setDeletingName(name);
    try {
      await onRemove(name);
      setConfirmDeleteName(null);
    } finally {
      setDeletingName(null);
    }
  }

  function handleSaveDate(examName: string) {
    if (!dateInputValue) return;
    onSaveExamDate(examName, dateInputValue);
    setEditingDateName(null);
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
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
        aria-label="Saved exams"
        className={`
          fixed inset-y-0 right-0 z-40 w-80
          bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <GraduationCap size={18} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Saved Exams
            </h2>
            {exams.length > 0 && (
              <span className="text-[11px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                {exams.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {exams.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                aria-label="Clear all exams"
                className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                title="Clear all saved exams"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close exams sidebar"
              className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List */}
        <nav className="flex-1 overflow-y-auto" aria-label="Saved exams">
          {exams.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <GraduationCap size={36} className="text-gray-300 dark:text-gray-700 mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                No Saved Exams
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-600">
                Bookmark an exam from the recommendations to see it here.
              </p>
            </div>
          ) : (
            <ul role="list" className="p-2 space-y-1">
              {exams.map((exam) => {
                const isConfirmingDelete = confirmDeleteName === exam.name;
                const isDeleting = deletingName === exam.name;
                const isEditingDate = editingDateName === exam.name;

                return (
                  <li key={exam._id}>
                    <div className="relative rounded-xl px-3 py-3 border border-transparent hover:bg-gray-100/60 dark:hover:bg-gray-800/60 hover:border-gray-300 dark:hover:border-gray-700 transition">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                            {exam.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                exam.category === "government"
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : "bg-indigo-500/15 text-indigo-400"
                              }`}
                            >
                              {exam.category === "government" ? "Govt" : "Private"}
                            </span>
                            <span className="text-[11px] text-gray-400 dark:text-gray-500">
                              {exam.timeline}
                            </span>
                          </div>
                          {exam.examDate && !isEditingDate && (
                            <p className="text-[11px] text-indigo-400/70 mt-1 flex items-center gap-1">
                              📅 {formatDate(exam.examDate)}
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        {!isConfirmingDelete && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            {/* Bell toggle */}
                            <button
                              onClick={() => onToggleReminder(exam)}
                              className={`p-1.5 rounded-lg transition ${
                                exam.reminderEnabled
                                  ? "text-indigo-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                  : "text-gray-400 dark:text-gray-500 hover:text-indigo-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                              }`}
                              title={exam.reminderEnabled ? "Reminder Enabled" : "Enable Reminder"}
                            >
                              {exam.reminderEnabled ? <Bell size={14} /> : <BellOff size={14} />}
                            </button>

                            {/* Date edit */}
                            {!isEditingDate && (
                              <button
                                onClick={() => {
                                  setEditingDateName(exam.name);
                                  setDateInputValue(exam.examDate);
                                }}
                                className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                                title="Edit exam date"
                              >
                                <Pencil size={12} />
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => setConfirmDeleteName(exam.name)}
                              disabled={isDeleting}
                              aria-label={`Delete ${exam.name}`}
                              className="p-1.5 rounded-md text-gray-400 dark:text-gray-600 hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Inline date picker */}
                      {isEditingDate && (
                        <div className="mt-2 flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2">
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 shrink-0">Exam date:</span>
                          <input
                            type="date"
                            value={dateInputValue}
                            onChange={(e) => setDateInputValue(e.target.value)}
                            className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-400 dark:border-gray-600 rounded px-2 py-1 text-[11px] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            onClick={() => handleSaveDate(exam.name)}
                            disabled={!dateInputValue}
                            className="shrink-0 p-1 rounded text-emerald-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-30"
                            title="Save date & enable reminder"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditingDateName(null)}
                            className="shrink-0 p-1 rounded text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}

                      {/* Inline delete confirmation */}
                      {isConfirmingDelete && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[11px] text-red-400">
                            Delete this exam?
                          </span>
                          <button
                            onClick={() => handleDeleteOne(exam.name)}
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
                            onClick={() => setConfirmDeleteName(null)}
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
          aria-labelledby="clear-exams-title"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 w-full max-w-sm shadow-xl mx-4">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle size={20} className="text-amber-400" />
              <h3
                id="clear-exams-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                Clear All Saved Exams?
              </h3>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              This will permanently remove all your saved exams and their
              reminders. This action cannot be undone.
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
