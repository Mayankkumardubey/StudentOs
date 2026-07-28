"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";
import BackgroundOrbs from "@/components/ui/BackgroundOrbs";
import GlassCard from "@/components/ui/GlassCard";

const sections = [
  {
    title: "About StudentOS",
    tagline: "Your Complete Academic & Career Operating System",
    body: `StudentOS is more than just a student management platform—it's an intelligent productivity ecosystem designed to help students organize, learn, grow, and succeed throughout their academic and professional journey.\n\nTraditional educational platforms focus on one problem at a time: learning, placements, attendance, or notes. StudentOS brings everything together into one unified experience, creating a single workspace where students can manage their academic life, develop career-ready skills, collaborate with peers, and receive personalized guidance.\n\nWhether you're preparing for semester exams, building your resume, practicing coding, planning your career, or collaborating with classmates, StudentOS is designed to keep everything connected and accessible.`,
  },
  {
    title: "Our Vision",
    body: `We believe every student deserves access to the tools, guidance, and opportunities needed to unlock their full potential.\n\nStudentOS aims to become a digital companion that grows alongside every learner—from the first day of college to securing internships, placements, higher education, entrepreneurship, or government careers.\n\nInstead of juggling multiple apps and websites, students can rely on one intelligent platform that keeps their goals, progress, and resources in one place.`,
  },
  {
    title: "What StudentOS Offers",
    body: `StudentOS brings together a comprehensive set of tools designed to cover every aspect of a student's academic and professional journey.\n\nFrom smart academic workspace and personalized goal tracking to AI-powered mentorship, resume intelligence, skill development, student communities, and career readiness—everything works together in one unified ecosystem.\n\nEach feature is designed to complement the others, creating a seamless experience where progress in one area naturally supports growth in another.`,
  },
  {
    title: "AI Mentor Hub",
    body: `StudentOS includes an intelligent AI Mentor that acts as your personal guide.\n\nRather than providing generic answers, the mentor understands your learning journey, helps you stay motivated, answers academic questions, recommends next steps, and offers personalized suggestions based on your activity within the platform.\n\nWith support for voice conversations, contextual guidance, and progress-based recommendations, the AI Mentor becomes a trusted learning companion available whenever you need it.`,
  },
  {
    title: "Resume Intelligence",
    body: `Build stronger resumes using AI-powered analysis and actionable suggestions.\n\nReceive feedback on structure, clarity, content, and overall presentation to improve your chances during internships and placements.\n\nThe system analyzes your resume against industry standards and provides specific recommendations to help you present your skills and experience in the most compelling way.`,
  },
  {
    title: "Student Communities",
    body: `Join communities based on interests, academic branches, technologies, clubs, competitive exams, or career goals.\n\nShare ideas, ask questions, upload resources, collaborate with peers, and learn together in focused communities.\n\nCommunities create a space where students can connect with like-minded peers, find study partners, share opportunities, and build lasting professional networks.`,
  },
  {
    title: "Career Readiness",
    body: `StudentOS helps students prepare beyond academics by supporting placement preparation, interview readiness, resume development, project organization, and continuous self-improvement.\n\nThe platform encourages students to develop practical skills alongside academic excellence.\n\nFrom mock interviews and aptitude tests to portfolio building and networking guidance, Career Readiness ensures you're prepared for the professional world.`,
  },
  {
    title: "Why StudentOS?",
    body: `Students often switch between multiple platforms for notes, coding practice, resumes, discussions, productivity, and career preparation.\n\nStudentOS eliminates this fragmentation by creating one unified ecosystem where everything works together.\n\nInstead of simply storing information, StudentOS actively helps students stay organized, motivated, and focused on achieving their goals.`,
  },
  {
    title: "Our Philosophy",
    body: `Education should not only help students pass examinations—it should prepare them for life.\n\nTechnology should simplify learning, reduce stress, encourage consistency, and provide personalized guidance rather than adding unnecessary complexity.\n\nStudentOS is built around this philosophy by combining intelligent assistance with practical tools that students can use every day.`,
  },
  {
    title: "Who Is StudentOS For?",
    body: `StudentOS is designed for college students, university students, placement aspirants, competitive exam aspirants, self-learners, developers, researchers, student communities, and clubs and organizations.\n\nWhether you're beginning your academic journey or preparing for your dream career, StudentOS adapts to your goals and evolves alongside your progress.\n\nEvery feature is built to serve students at different stages of their journey, from freshers exploring their interests to final-year students preparing for placements.`,
  },
  {
    title: "Looking Ahead",
    body: `StudentOS is continuously evolving.\n\nFuture enhancements include deeper AI personalization, smarter academic analytics, enhanced collaboration, richer learning experiences, and innovative features that empower students to make informed decisions throughout their educational journey.\n\nOur commitment is simple: build technology that genuinely helps students succeed.`,
  },
  {
    title: "Built Around Students",
    body: `Every feature in StudentOS is designed with one purpose in mind—to solve real student problems.\n\nFrom organizing study resources and tracking learning progress to connecting with communities and receiving AI-powered mentorship, every component contributes toward helping students learn more effectively and achieve their ambitions with confidence.\n\nStudentOS is built by understanding what students actually need, not what platforms think students should have.`,
  },
  {
    title: "Our Mission",
    highlight: true,
    body: `To create the world's most intelligent and student-centric academic operating system—one platform that empowers every learner to study smarter, grow consistently, and confidently build their future.`,
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground text-left">
      <BackgroundOrbs />
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-outline-variant">
        <div className="px-6 py-4 flex items-center gap-3 text-left">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition"
          >
            <ArrowLeft size={16} />
            StudentOS
          </Link>
          <span className="text-on-surface-variant/30">|</span>
          <h1 className="text-lg font-semibold">About Us</h1>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-12 relative z-10">
        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Student            <span className="text-accent-teal">OS</span>
          </h1>
          <p className="text-xl md:text-2xl text-on-surface font-medium mb-6">
            Your Complete Academic &amp; Career Operating System
          </p>
          <p className="text-on-surface-variant max-w-2xl mx-auto leading-relaxed mb-6">
            StudentOS is more than just a student management platform—it&apos;s an
            intelligent productivity ecosystem designed to help students organize,
            learn, grow, and succeed throughout their academic and professional
            journey.
          </p>
          <div className="inline-block bg-surface-container/50 border border-outline-variant rounded-xl px-6 py-4 max-w-2xl">
            <p className="text-sm text-on-surface leading-relaxed">
              <span className="text-accent-teal font-semibold">Our Mission:</span>{" "}
              To create the world&apos;s most intelligent and student-centric academic
              operating system—one platform that empowers every learner to study
              smarter, grow consistently, and confidently build their future.
            </p>
          </div>
        </section>

        {/* ── Card Grid ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => (
            <div
              key={section.title}
              className={`
                group rounded-2xl border p-8 transition-all duration-300
                hover:-translate-y-0.5
                ${
                  section.highlight
                    ? "bg-accent-teal/10 border-accent-teal/30 hover:border-accent-teal/50 hover:shadow-lg hover:shadow-accent-teal/10 md:col-span-2"
                    : "bg-surface-container/50 border-outline-variant hover:border-accent-teal/30 hover:shadow-lg hover:shadow-black/20"
                }
              `}
            >
              <h2
                className={`text-xl font-bold mb-4 ${
                  section.highlight ? "text-accent-teal text-center text-2xl" : "text-on-surface"
                }`}
              >
                {section.title}
              </h2>
              {section.tagline && (
                <p className="text-sm text-accent-teal font-medium mb-4">
                  {section.tagline}
                </p>
              )}
              <div className="space-y-4">
                {section.body.split("\n\n").map((paragraph, i) => (
                  <p
                    key={i}
                    className={`text-sm leading-relaxed ${
                      section.highlight
                        ? "text-on-surface text-center text-base font-medium"
                        : "text-on-surface-variant"
                    }`}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
