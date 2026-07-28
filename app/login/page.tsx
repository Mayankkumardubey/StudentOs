"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useTransform } from "framer-motion";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import GlassCard from "@/components/ui/GlassCard";
import Footer from "@/components/Footer";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.status === "success") {
        router.push("/");
        router.refresh();
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4">
      <AnimatedBackground particleCount={180} />

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
        className="w-full max-w-sm z-10"
      >
        <GlassCard className="p-8">
          <h1 className="text-2xl font-bold text-on-surface dark:text-on-surface mb-6 font-display">
            Log in to StudentOS
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-950/80 dark:bg-red-900/40 border border-red-800/60 dark:border-red-700/40 rounded-xl text-red-300 dark:text-red-300 text-sm backdrop-blur-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-on-surface-variant dark:text-on-surface-variant mb-1 font-body">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-white/50 dark:bg-white/5 border border-outline-variant dark:border-outline-variant text-on-surface dark:text-on-surface placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-accent-teal focus:shadow-[0_0_0_3px_rgba(0,106,97,0.15)] dark:focus:shadow-[0_0_0_3px_rgba(87,241,219,0.15)] transition-all duration-200 font-body"
              />
            </div>

            <div>
              <label className="block text-sm text-on-surface-variant dark:text-on-surface-variant mb-1 font-body">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-white/50 dark:bg-white/5 border border-outline-variant dark:border-outline-variant text-on-surface dark:text-on-surface placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-accent-teal focus:shadow-[0_0_0_3px_rgba(0,106,97,0.15)] dark:focus:shadow-[0_0_0_3px_rgba(87,241,219,0.15)] transition-all duration-200 font-body"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-accent-coral hover:bg-accent-coral/90 disabled:opacity-50 text-white rounded-full font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent-coral/20 dark:shadow-accent-coral/10"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <p className="mt-4 text-sm text-on-surface-variant dark:text-on-surface-variant text-center font-body">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-accent-teal hover:underline font-medium">
              Register
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
