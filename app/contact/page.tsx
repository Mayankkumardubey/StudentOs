"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import Footer from "@/components/Footer";
import BackgroundOrbs from "@/components/ui/BackgroundOrbs";
import GlassCard from "@/components/ui/GlassCard";

// ── Data ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "General Inquiry",
  "Technical Support",
  "Feature Request",
  "Bug Report",
  "Partnership",
] as const;

const QUICK_CARDS = [
  {
    title: "General Support",
    body: "Have a question about StudentOS or need help getting started? Reach out and we'll guide you through.",
  },
  {
    title: "Technical Support",
    body: "Facing bugs, performance issues, or technical problems? Our team is ready to help resolve them.",
  },
  {
    title: "Feature Requests",
    body: "Have an idea to improve StudentOS? We love community-driven suggestions that shape the platform.",
  },
  {
    title: "Bug Reports",
    body: "Found something broken? Report it with details and screenshots so we can fix it quickly.",
  },
];

const FAQ_ITEMS = [
  {
    q: "How long does it take to receive a response?",
    a: "We typically respond within 24-48 hours on business days. For urgent technical issues, prioritize faster response times.",
  },
  {
    q: "How can I report a bug?",
    a: "Use the Bug Report form on this page. Include the bug title, description, steps to reproduce, expected vs actual behaviour, and a screenshot if possible.",
  },
  {
    q: "Can I request a feature?",
    a: "Absolutely. Use the Feature Request form to describe your idea. We review every suggestion and prioritize community-driven improvements.",
  },
  {
    q: "How do I contact the StudentOS team?",
    a: "You can use the contact form above, email us directly at mayankkumardubey19@gmail.com, or reach out via LinkedIn or GitHub.",
  },
  {
    q: "Is StudentOS actively maintained?",
    a: "Yes. StudentOS is continuously evolving with new features, improvements, and bug fixes based on user feedback.",
  },
];

// ── FAQ Accordion ───────────────────────────────────────────────────────────

function FAQAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = openIdx === i;
        return (
          <div
            key={i}
            className="rounded-2xl border border-outline-variant bg-surface-container/50 overflow-hidden transition-all duration-300"
          >
            <button
              onClick={() => setOpenIdx(isOpen ? null : i)}
              className="w-full flex items-center justify-between px-6 py-5 text-left"
            >
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 pr-4">
                {item.q}
              </span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-gray-400 dark:text-gray-500 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`px-6 overflow-hidden transition-all duration-300 ${
                isOpen ? "max-h-40 pb-5" : "max-h-0"
              }`}
            >
              <p className="text-sm text-on-surface-variant leading-relaxed">{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Form State ──────────────────────────────────────────────────────────────

type FormStatus = "idle" | "loading" | "success" | "error";

// ── Page ────────────────────────────────────────────────────────────────────

export default function ContactPage() {
  // Contact form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [contactStatus, setContactStatus] = useState<FormStatus>("idle");

  // Feature request
  const [featTitle, setFeatTitle] = useState("");
  const [featDesc, setFeatDesc] = useState("");
  const [featStatus, setFeatStatus] = useState<FormStatus>("idle");

  // Bug report
  const [bugTitle, setBugTitle] = useState("");
  const [bugDesc, setBugDesc] = useState("");
  const [bugSteps, setBugSteps] = useState("");
  const [bugExpected, setBugExpected] = useState("");
  const [bugActual, setBugActual] = useState("");
  const [bugStatus, setBugStatus] = useState<FormStatus>("idle");

  // ── Contact Submit (frontend only) ────────────────────────────────────
  function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setContactStatus("loading");
    setTimeout(() => setContactStatus("success"), 1200);
  }

  // ── Feature Submit (frontend only) ────────────────────────────────────
  function handleFeatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!featTitle.trim() || !featDesc.trim()) return;
    setFeatStatus("loading");
    setTimeout(() => setFeatStatus("success"), 1200);
  }

  // ── Bug Submit (frontend only) ────────────────────────────────────────
  function handleBugSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bugTitle.trim() || !bugDesc.trim()) return;
    setBugStatus("loading");
    setTimeout(() => setBugStatus("success"), 1200);
  }

  const inputCls =
    "w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-accent-teal transition";
  const textareaCls = `${inputCls} resize-none`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <BackgroundOrbs />
      {/* ── Header ─────────────────────────────────────────────── */}
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
          <h1 className="text-lg font-semibold">Contact Us</h1>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-12 relative z-10">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Contact <span className="text-accent-teal">Us</span>
          </h1>
          <p className="text-lg text-on-surface max-w-2xl mx-auto leading-relaxed">
            Have a question, suggestion, feature request, collaboration idea, or
            found a bug? We&apos;d love to hear from you.
          </p>
        </section>

        {/* ── Contact Form ─────────────────────────────────────── */}
        <section className="mb-16">
          <div className="bg-surface-container/50 border border-outline-variant rounded-2xl p-8 md:p-10 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-2">Send a Message</h2>
            <p className="text-sm text-on-surface-variant mb-8">
              Fill out the form below and we&apos;ll get back to you as soon as
              possible.
            </p>

            {contactStatus === "success" ? (
              <div className="text-center py-10">
                <p className="text-lg font-semibold text-emerald-400 mb-2">
                  Message sent!
                </p>
                <p className="text-sm text-on-surface-variant">
                  Thank you for reaching out. We&apos;ll get back to you shortly.
                </p>
                <button
                  onClick={() => {
                    setContactStatus("idle");
                    setName("");
                    setEmail("");
                    setSubject("");
                    setCategory("");
                    setMessage("");
                  }}
                  className="mt-4 text-sm text-indigo-400 hover:text-indigo-300 transition"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="What is this about?"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Select a category</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                    Message *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your message here..."
                    rows={5}
                    required
                    className={textareaCls}
                  />
                </div>

                <button
                  type="submit"
                  disabled={contactStatus === "loading"}
                  className="w-full py-3 rounded-xl bg-accent-coral hover:opacity-90 text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {contactStatus === "loading" ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* ── Quick Contact Cards ──────────────────────────────── */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            How Can We Help?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {QUICK_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-outline-variant bg-surface-container/50 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-teal/30 hover:shadow-lg hover:shadow-black/20"
              >
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
                  {card.title}
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Feature Request ──────────────────────────────────── */}
        <section className="mb-16">
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 md:p-10 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-2">Feature Request</h2>
            <p className="text-sm text-on-surface-variant mb-8">
              We love community-driven ideas and continuously improve StudentOS
              based on user feedback.
            </p>

            {featStatus === "success" ? (
              <div className="text-center py-10">
                <p className="text-lg font-semibold text-emerald-400 mb-2">
                  Feature request submitted!
                </p>
                <p className="text-sm text-on-surface-variant">
                  Thank you for your suggestion. We&apos;ll review it soon.
                </p>
                <button
                  onClick={() => {
                    setFeatStatus("idle");
                    setFeatTitle("");
                    setFeatDesc("");
                  }}
                  className="mt-4 text-sm text-indigo-400 hover:text-indigo-300 transition"
                >
                  Submit another
                </button>
              </div>
            ) : (
              <form onSubmit={handleFeatSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                    Feature Title *
                  </label>
                  <input
                    type="text"
                    value={featTitle}
                    onChange={(e) => setFeatTitle(e.target.value)}
                    placeholder="Brief title for your feature idea"
                    required
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                    Description *
                  </label>
                  <textarea
                    value={featDesc}
                    onChange={(e) => setFeatDesc(e.target.value)}
                    placeholder="Describe the feature, why it matters, and how it should work..."
                    rows={5}
                    required
                    className={textareaCls}
                  />
                </div>
                <button
                  type="submit"
                  disabled={featStatus === "loading"}
                  className="w-full py-3 rounded-xl bg-accent-coral hover:opacity-90 text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {featStatus === "loading"
                    ? "Submitting..."
                    : "Submit Feature"}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* ── Bug Report ───────────────────────────────────────── */}
        <section className="mb-16">
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 md:p-10 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-2">Report a Bug</h2>
            <p className="text-sm text-on-surface-variant mb-8">
              Help us improve StudentOS by reporting issues you encounter.
            </p>

            {bugStatus === "success" ? (
              <div className="text-center py-10">
                <p className="text-lg font-semibold text-emerald-400 mb-2">
                  Bug report submitted!
                </p>
                <p className="text-sm text-on-surface-variant">
                  Thank you for helping us improve. We&apos;ll investigate this
                  issue.
                </p>
                <button
                  onClick={() => {
                    setBugStatus("idle");
                    setBugTitle("");
                    setBugDesc("");
                    setBugSteps("");
                    setBugExpected("");
                    setBugActual("");
                  }}
                  className="mt-4 text-sm text-indigo-400 hover:text-indigo-300 transition"
                >
                  Report another bug
                </button>
              </div>
            ) : (
              <form onSubmit={handleBugSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                    Bug Title *
                  </label>
                  <input
                    type="text"
                    value={bugTitle}
                    onChange={(e) => setBugTitle(e.target.value)}
                    placeholder="Brief title for the bug"
                    required
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                    Description *
                  </label>
                  <textarea
                    value={bugDesc}
                    onChange={(e) => setBugDesc(e.target.value)}
                    placeholder="Describe the bug in detail..."
                    rows={4}
                    required
                    className={textareaCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                    Steps to Reproduce
                  </label>
                  <textarea
                    value={bugSteps}
                    onChange={(e) => setBugSteps(e.target.value)}
                    placeholder="1. Go to... 2. Click on... 3. See error..."
                    rows={3}
                    className={textareaCls}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                      Expected Behaviour
                    </label>
                    <textarea
                      value={bugExpected}
                      onChange={(e) => setBugExpected(e.target.value)}
                      placeholder="What should happen?"
                      rows={3}
                      className={textareaCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                      Actual Behaviour
                    </label>
                    <textarea
                      value={bugActual}
                      onChange={(e) => setBugActual(e.target.value)}
                      placeholder="What actually happens?"
                      rows={3}
                      className={textareaCls}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={bugStatus === "loading"}
                  className="w-full py-3 rounded-xl bg-accent-coral hover:opacity-90 text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bugStatus === "loading" ? "Submitting..." : "Submit Bug"}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="max-w-2xl mx-auto">
            <FAQAccordion />
          </div>
        </section>

        {/* ── Community ────────────────────────────────────────── */}
        <section className="mb-16">
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 md:p-10 text-center max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-3">
              Join the StudentOS Community
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6 max-w-lg mx-auto">
              Connect with fellow students, share resources, discuss ideas,
              collaborate on projects, and learn together.
            </p>
            <Link
              href="/communities"
              className="inline-block px-6 py-3 rounded-xl bg-accent-coral hover:opacity-90 text-white text-sm font-semibold transition"
            >
              Explore Communities
            </Link>
          </div>
        </section>

        {/* ── AI Mentor CTA ────────────────────────────────────── */}
        <section className="mb-16">
          <div className="bg-accent-teal/10 border border-accent-teal/30 rounded-2xl p-8 md:p-10 text-center max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-3">Need Immediate Help?</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6 max-w-lg mx-auto">
              Our AI Mentor is available anytime to help with study planning,
              career guidance, resume improvement, interview preparation,
              productivity, and learning support.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 rounded-xl bg-accent-coral hover:opacity-90 text-white text-sm font-semibold transition"
            >
              Open AI Mentor
            </Link>
          </div>
        </section>

        {/* ── Developer ────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="bg-surface-container/50 border border-outline-variant rounded-2xl p-8 md:p-10 text-center max-w-2xl mx-auto">
            <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-3">
              Built By
            </p>
            <h2 className="text-2xl font-bold mb-3">Mayank Kumar</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6 max-w-lg mx-auto">
              StudentOS is a personal initiative focused on helping students
              organize their academic journey, build career-ready skills, and
              receive intelligent guidance through one unified platform.
            </p>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6 max-w-lg mx-auto">
              Whether you have feedback, feature suggestions, bug reports, or
              collaboration ideas, I&apos;d love to hear from you.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="mailto:mayankkumardubey19@gmail.com"
                className="px-4 py-2 rounded-xl border border-outline-variant bg-surface-container text-sm text-on-surface hover:bg-surface-container-high transition"
              >
                mayankkumardubey19@gmail.com
              </a>
              <a
                href="https://www.linkedin.com/in/mayank-kumar-dubey-811627358/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl border border-outline-variant bg-surface-container text-sm text-on-surface hover:bg-surface-container-high transition"
              >
                LinkedIn
              </a>
              <a
                href="https://github.com/Mayankkumardubey"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl border border-outline-variant bg-surface-container text-sm text-on-surface hover:bg-surface-container-high transition"
              >
                GitHub
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
