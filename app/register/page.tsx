"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useTransform } from "framer-motion";
import MouseReactiveBackground from "@/components/ui/MouseReactiveBackground";
import BackgroundOrbs from "@/components/ui/BackgroundOrbs";
import GlassCard from "@/components/ui/GlassCard";
import Footer from "@/components/Footer";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
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
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-8, 8]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^[a-zA-Z0-9]+$/.test(form.username)) {
      setError("Username can only contain letters and numbers.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          cgpa: parseFloat(form.cgpa),
          dailyStudyHours: parseFloat(form.dailyStudyHours),
        }),
      });

      const data = await res.json();

      if (data.status === "success") {
        router.push("/");
        router.refresh();
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl bg-white/50 dark:bg-white/5 border border-outline-variant dark:border-outline-variant text-on-surface dark:text-on-surface placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-accent-teal focus:shadow-[0_0_0_3px_rgba(0,106,97,0.15)] dark:focus:shadow-[0_0_0_3px_rgba(87,241,219,0.15)] transition-all duration-200 font-body";
  const labelClass = "block text-sm text-on-surface-variant dark:text-on-surface-variant mb-1 font-body";

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <MouseReactiveBackground particleCount={350} />
      <BackgroundOrbs />

      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformPerspective: 800,
        }}
        className="w-full max-w-md z-10"
      >
        <GlassCard className="p-8">
          <h1 className="text-2xl font-bold text-on-surface dark:text-on-surface mb-6 font-display">
            Create your StudentOS account
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-950/80 dark:bg-red-900/40 border border-red-800/60 dark:border-red-700/40 rounded-xl text-red-300 dark:text-red-300 text-sm backdrop-blur-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Username</label>
              <input name="username" placeholder="Letters and numbers only" value={form.username} onChange={handleChange} required className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Degree</label>
              <input name="degree" placeholder="e.g. B.Tech" value={form.degree} onChange={handleChange} required className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Branch</label>
              <input name="branch" placeholder="e.g. Computer Science" value={form.branch} onChange={handleChange} required className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>CGPA</label>
              <input name="cgpa" type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={handleChange} required className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Preferred Career Path</label>
              <input name="preferredCareerPath" placeholder="e.g. Software Developer" value={form.preferredCareerPath} onChange={handleChange} required className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Job Preference</label>
              <input name="jobPreference" placeholder="e.g. Remote / On-site / Hybrid" value={form.jobPreference} onChange={handleChange} required className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Higher Studies Interest</label>
              <select name="higherStudiesInterest" value={form.higherStudiesInterest} onChange={handleChange} className={inputClass}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Undecided">Undecided</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Target Salary Range</label>
              <input name="targetSalaryRange" placeholder="e.g. 5-10 LPA" value={form.targetSalaryRange} onChange={handleChange} required className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Self-Rated Skill Level</label>
              <select name="selfRatedSkillLevel" value={form.selfRatedSkillLevel} onChange={handleChange} className={inputClass}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Daily Study Hours</label>
              <input name="dailyStudyHours" type="number" step="0.5" min="0" value={form.dailyStudyHours} onChange={handleChange} required className={inputClass} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-accent-coral hover:bg-accent-coral/90 disabled:opacity-50 text-white rounded-full font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent-coral/20 dark:shadow-accent-coral/10"
            >
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>

          <p className="mt-4 text-sm text-on-surface-variant dark:text-on-surface-variant text-center font-body">
            Already have an account?{" "}
            <a href="/login" className="text-accent-teal hover:underline font-medium">
              Log in
            </a>
          </p>
        </GlassCard>
      </motion.div>

      <div className="z-10 mt-8">
        <Footer />
      </div>
    </div>
  );
}
