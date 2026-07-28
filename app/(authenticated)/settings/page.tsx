"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { CheckCircle2, Settings, Sun, Moon, Monitor, GraduationCap, Brain, Check } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import BackgroundOrbs from "@/components/ui/BackgroundOrbs";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ProfileForm {
  username: string;
  degree: string;
  branch: string;
  cgpa: string;
  preferredCareerPath: string;
  jobPreference: string;
  higherStudiesInterest: "Yes" | "No" | "Undecided";
  selfRatedSkillLevel: "Beginner" | "Intermediate" | "Advanced";
  targetSalaryRange: string;
  dailyStudyHours: string;
  avatarBase64: string;
}

const EMPTY_FORM: ProfileForm = {
  username: "",
  degree: "",
  branch: "",
  cgpa: "",
  preferredCareerPath: "",
  jobPreference: "",
  higherStudiesInterest: "Undecided",
  selfRatedSkillLevel: "Beginner",
  targetSalaryRange: "",
  dailyStudyHours: "",
  avatarBase64: "",
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        setEmail(data.email ?? "");
        setForm({
          username: data.username ?? "",
          degree: data.degree ?? "",
          branch: data.branch ?? "",
          cgpa: String(data.cgpa ?? ""),
          preferredCareerPath: data.preferredCareerPath ?? "",
          jobPreference: data.jobPreference ?? "",
          higherStudiesInterest: data.higherStudiesInterest ?? "Undecided",
          selfRatedSkillLevel: data.selfRatedSkillLevel ?? "Beginner",
          targetSalaryRange: data.targetSalaryRange ?? "",
          dailyStudyHours: String(data.dailyStudyHours ?? ""),
          avatarBase64: data.avatarBase64 ?? "",
        });
      } catch (e) {
        setError("Could not load your profile. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, WebP, etc.).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2 MB.");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, avatarBase64: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const cgpaNum = parseFloat(form.cgpa);
    const hoursNum = parseFloat(form.dailyStudyHours);

    if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
      setError("CGPA must be a number between 0 and 10.");
      setSaving(false);
      return;
    }
    if (isNaN(hoursNum) || hoursNum < 0) {
      setError("Daily study hours must be a non-negative number.");
      setSaving(false);
      return;
    }

    const payload = {
      username: form.username,
      degree: form.degree,
      branch: form.branch,
      cgpa: cgpaNum,
      preferredCareerPath: form.preferredCareerPath,
      jobPreference: form.jobPreference,
      higherStudiesInterest: form.higherStudiesInterest,
      selfRatedSkillLevel: form.selfRatedSkillLevel,
      targetSalaryRange: form.targetSalaryRange,
      dailyStudyHours: hoursNum,
      avatarBase64: form.avatarBase64,
    };

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to save. Please try again.");
      } else {
        setSuccess(true);
        successTimer.current = setTimeout(() => setSuccess(false), 3500);
      }
    } catch {
      setError("Network error — please check your connection.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm " +
    "text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[var(--accent-teal)] transition";

  const labelCls = "block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5";

  function getInitials(): string {
    const name = form.username.trim();
    if (name) {
      const parts = name.split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email[0].toUpperCase();
    return "?";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface dark:bg-surface-dark text-on-surface dark:text-on-surface-dark flex items-center justify-center">
        <BackgroundOrbs />
        <p className="text-gray-500 animate-pulse">Loading your profile…</p>
      </div>
    );
  }

  return (
    <>
      <BackgroundOrbs />
      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8 relative z-10">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Settings size={28} className="text-[var(--accent-teal)]" />
            <h1 className="text-3xl font-bold text-on-surface dark:text-on-surface-dark">Settings</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-base">
            Manage your profile, preferences, and account details in one place.
          </p>
        </div>

        {/* ── Theme Section ── */}
        <GlassCard>
          <h2 className="text-lg font-semibold mb-1 text-on-surface dark:text-on-surface-dark">Appearance</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Choose your preferred theme for the application.
          </p>
          <div className="flex gap-3">
            {[
              { value: "light", label: "Light", icon: Sun },
              { value: "dark", label: "Dark", icon: Moon },
              { value: "system", label: "System", icon: Monitor },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition ${
                  (mounted ? theme : "dark") === value
                    ? "border-[var(--accent-teal)] bg-[var(--accent-teal)]/10 text-[var(--accent-teal)]"
                    : "border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* ── Avatar section ── */}
        <GlassCard>
          <div className="flex items-center gap-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 hover:border-[var(--accent-teal)] transition cursor-pointer flex-none"
              title="Click to change photo"
            >
              {form.avatarBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.avatarBase64}
                  alt="Profile photo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[var(--accent-teal)] text-white text-2xl font-bold select-none">
                  {getInitials()}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition text-xs text-white font-medium">
                Change
              </div>
            </div>

            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-lg">{form.username || email}</p>
              <p className="text-sm text-gray-500 mt-0.5">{email} (cannot be changed)</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-xs text-[var(--accent-teal)] hover:opacity-80 transition"
              >
                Upload new photo (max 2 MB)
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>
        </GlassCard>

        {/* ── Profile form ── */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <GlassCard>
            <div className="space-y-6">
              <div>
                <label htmlFor="username" className={labelCls}>Display Name</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="e.g. Alex"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="degree" className={labelCls}>Degree</label>
                  <input
                    id="degree"
                    name="degree"
                    type="text"
                    value={form.degree}
                    onChange={handleChange}
                    placeholder="e.g. B.Tech, M.Tech"
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="branch" className={labelCls}>Branch / Specialisation</label>
                  <input
                    id="branch"
                    name="branch"
                    type="text"
                    value={form.branch}
                    onChange={handleChange}
                    placeholder="e.g. Computer Science"
                    className={inputCls}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cgpa" className={labelCls}>CGPA (0 – 10)</label>
                  <input
                    id="cgpa"
                    name="cgpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={form.cgpa}
                    onChange={handleChange}
                    placeholder="e.g. 8.5"
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="dailyStudyHours" className={labelCls}>Daily Study Hours</label>
                  <input
                    id="dailyStudyHours"
                    name="dailyStudyHours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={form.dailyStudyHours}
                    onChange={handleChange}
                    placeholder="e.g. 4"
                    className={inputCls}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="preferredCareerPath" className={labelCls}>Preferred Career Path</label>
                <input
                  id="preferredCareerPath"
                  name="preferredCareerPath"
                  type="text"
                  value={form.preferredCareerPath}
                  onChange={handleChange}
                  placeholder="e.g. Software Engineer, Data Scientist"
                  className={inputCls}
                  required
                />
              </div>

              <div>
                <label htmlFor="jobPreference" className={labelCls}>Job Preference</label>
                <input
                  id="jobPreference"
                  name="jobPreference"
                  type="text"
                  value={form.jobPreference}
                  onChange={handleChange}
                  placeholder="e.g. Product-based, Startup, Government"
                  className={inputCls}
                  required
                />
              </div>

              <div>
                <label htmlFor="targetSalaryRange" className={labelCls}>Target Salary Range</label>
                <input
                  id="targetSalaryRange"
                  name="targetSalaryRange"
                  type="text"
                  value={form.targetSalaryRange}
                  onChange={handleChange}
                  placeholder="e.g. ₹8–12 LPA"
                  className={inputCls}
                  required
                />
              </div>
            </div>
          </GlassCard>

          {/* ── Higher Studies Interest: Bento Selection Cards ── */}
          <div>
            <label className={labelCls}>Higher Studies Interest</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "Yes" as const, label: "Yes", icon: GraduationCap, desc: "Planning higher studies" },
                { value: "No" as const, label: "No", icon: Check, desc: "Focus on career" },
                { value: "Undecided" as const, label: "Undecided", icon: Brain, desc: "Still exploring" },
              ].map(({ value, label, icon: Icon, desc }) => {
                const isSelected = form.higherStudiesInterest === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, higherStudiesInterest: value }))}
                    className={`relative rounded-xl p-4 text-left transition-all duration-200 border ${
                      isSelected
                        ? "bg-[var(--accent-teal)]/10 border-[var(--accent-teal)] shadow-[0_0_16px_rgba(0,106,97,0.15)]"
                        : "bg-glass backdrop-blur-xl border-glass-border hover:-translate-y-1"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--accent-teal)] flex items-center justify-center">
                        <Check size={12} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${
                      isSelected ? "bg-[var(--accent-teal)]/20 text-[var(--accent-teal)]" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    }`}>
                      <Icon size={18} />
                    </div>
                    <p className={`text-sm font-semibold ${isSelected ? "text-[var(--accent-teal)]" : "text-gray-800 dark:text-gray-200"}`}>{label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Self-Rated Skill Level: Bento Selection Cards ── */}
          <div>
            <label className={labelCls}>Self-Rated Skill Level</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "Beginner" as const, label: "Beginner", level: 1 },
                { value: "Intermediate" as const, label: "Intermediate", level: 2 },
                { value: "Advanced" as const, label: "Advanced", level: 3 },
              ].map(({ value, label, level }) => {
                const isSelected = form.selfRatedSkillLevel === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, selfRatedSkillLevel: value }))}
                    className={`relative rounded-xl p-4 text-left transition-all duration-200 border ${
                      isSelected
                        ? "bg-[var(--accent-teal)]/10 border-[var(--accent-teal)] shadow-[0_0_16px_rgba(0,106,97,0.15)]"
                        : "bg-glass backdrop-blur-xl border-glass-border hover:-translate-y-1"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--accent-teal)] flex items-center justify-center">
                        <Check size={12} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3].map((bar) => (
                        <div
                          key={bar}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            bar <= level && isSelected
                              ? "bg-[var(--accent-teal)]"
                              : bar <= level
                                ? "bg-gray-300 dark:bg-gray-600"
                                : "bg-gray-200 dark:bg-gray-700"
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-sm font-semibold ${isSelected ? "text-[var(--accent-teal)]" : "text-gray-800 dark:text-gray-200"}`}>{label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Skill tier {level}/3</p>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/50 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-300 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-300 text-sm px-4 py-3 rounded-lg">
              <CheckCircle2 size={16} />
              Profile saved successfully!
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="
                px-6 py-2.5 rounded-xl bg-[var(--accent-coral)] hover:opacity-90
                text-white font-semibold text-sm
                disabled:opacity-50 disabled:cursor-not-allowed
                transition
              "
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
