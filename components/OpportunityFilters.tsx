"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

export interface FiltersState {
  role: string;
  location: string;
  modes: string[];
  salary: string;
  type: string;
}

interface Props {
  filters: FiltersState;
  onChange: (f: FiltersState) => void;
  onApply: () => void;
  loading: boolean;
}

const MODES = ["Remote", "Hybrid", "Onsite"];

const SALARY_BUCKETS = [
  { label: "Any salary", value: "" },
  { label: "₹1L – ₹1.5L", value: "1L-1.5L" },
  { label: "₹1.5L – ₹2L", value: "1.5L-2L" },
  { label: "₹2L – ₹3L", value: "2L-3L" },
  { label: "₹3L – ₹5L", value: "3L-5L" },
  { label: "₹5L – ₹8L", value: "5L-8L" },
  { label: "₹8L – ₹12L", value: "8L-12L" },
  { label: "₹12L+", value: "12L+" },
];

const TYPE_OPTIONS = [
  { label: "Any type", value: "" },
  { label: "Internship", value: "Internship" },
  { label: "Full-time", value: "Full-time" },
];

export default function OpportunityFilters({
  filters,
  onChange,
  onApply,
  loading,
}: Props) {
  const [open, setOpen] = useState(false);

  function update<K extends keyof FiltersState>(key: K, value: FiltersState[K]) {
    onChange({ ...filters, [key]: value });
  }

  function toggleMode(mode: string) {
    const next = filters.modes.includes(mode)
      ? filters.modes.filter((m) => m !== mode)
      : [...filters.modes, mode];
    update("modes", next);
  }

  const inputCls =
    "w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition";

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 lg:hidden"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal size={16} />
          Filters
        </span>
        <span className="text-gray-400 dark:text-gray-500">{open ? "▲" : "▼"}</span>
      </button>

      {/* Filter body — always open on lg+, toggled on mobile */}
      <div className={`${open ? "block" : "hidden"} lg:!block px-4 pb-4 space-y-4`}>
        {/* Role */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Role / Keywords
          </label>
          <input
            type="text"
            value={filters.role}
            onChange={(e) => update("role", e.target.value)}
            placeholder="e.g. Software Engineer"
            className={inputCls}
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Location
          </label>
          <input
            type="text"
            value={filters.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="e.g. Bangalore"
            className={inputCls}
          />
        </div>

        {/* Work Mode toggles */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Work Mode
          </label>
          <div className="flex gap-2">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => toggleMode(m)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  filters.modes.includes(m)
                    ? "border-indigo-500 bg-indigo-900/50 text-indigo-300"
                    : "border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Salary */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Salary Range (₹ / year)
          </label>
          <select
            value={filters.salary}
            onChange={(e) => update("salary", e.target.value)}
            className={inputCls}
          >
            {SALARY_BUCKETS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>

        {/* Job Type */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Job Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => update("type", e.target.value)}
            className={inputCls}
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search button */}
        <button
          type="button"
          onClick={onApply}
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>
    </div>
  );
}
