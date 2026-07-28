"use client";

import { motion } from "framer-motion";
import BackgroundOrbs from "@/components/ui/BackgroundOrbs";
import ProfileCard from "@/components/ProfileCard";
import StreakDashboard from "@/components/StreakDashboard";
import DashboardExams from "@/components/DashboardExams";
import DashboardOpportunities from "@/components/DashboardOpportunities";
import GlassCard from "@/components/ui/GlassCard";

type Profile = {
  username: string;
  degree: string;
  branch: string;
  cgpa: number;
  careerPath: string;
  email: string;
  avatarBase64: string;
};

const placeholderPages = [
  { href: "/roadmaps", label: "Roadmaps" },
  { href: "/exams", label: "Exams" },
  { href: "/resources", label: "Resources" },
  { href: "/communities", label: "Communities" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/resume-analyzer", label: "Resume Analyzer" },
  { href: "/settings", label: "Settings" },
  { href: "/events", label: "Events" },
];

export default function DashboardShell({ profile }: { profile: Profile }) {
  const displayName =
    profile.username && profile.username.trim() !== ""
      ? profile.username
      : profile.email.split("@")[0];

  return (
    <>
      <BackgroundOrbs />

      <h1 className="text-2xl font-bold mb-6 text-on-surface dark:text-on-surface font-display">
        Welcome back, {displayName}
      </h1>

      {/* Staggered entrance: ProfileCard + StreakDashboard */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 items-stretch">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <ProfileCard
            email={profile.email}
            avatarBase64={profile.avatarBase64}
            degree={profile.degree}
            branch={profile.branch}
            cgpa={profile.cgpa}
            careerPath={profile.careerPath}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.08 }}
        >
          <StreakDashboard />
        </motion.div>
      </section>

      {/* Staggered entrance: Exams + Opportunities */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 items-stretch">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.16 }}
          className="h-full"
        >
          <GlassCard className="p-5 h-full">
            <DashboardExams />
          </GlassCard>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.24 }}
          className="h-full"
        >
          <GlassCard className="p-5 h-full">
            <DashboardOpportunities />
          </GlassCard>
        </motion.div>
      </section>

      {/* Navigation tiles — staggered */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {placeholderPages.map((page, i) => (
          <motion.a
            key={page.href}
            href={page.href}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              ease: "easeOut",
              delay: 0.32 + i * 0.04,
            }}
            className="block text-center p-4 bg-glass backdrop-blur-xl border border-glass-border rounded-xl shadow-[var(--glass-shadow)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-all duration-300 font-medium text-on-surface dark:text-on-surface font-body"
          >
            {page.label}
          </motion.a>
        ))}
      </section>
    </>
  );
}
