"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { LogOut, Loader2 } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/" },
  { name: "AI Counselor", href: "/counselor" },
  { name: "Roadmaps", href: "/roadmaps" },
  { name: "Exams", href: "/exams" },
  { name: "Resources", href: "/resources" },
  { name: "Communities", href: "/communities" },
  { name: "Opportunities", href: "/opportunities" },
  { name: "Events", href: "/events" },
  { name: "Resume Analyzer", href: "/resume-analyzer" },
  { name: "Settings", href: "/settings" },
];

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const confirmLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
      setShowConfirm(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (sidebarRef.current?.contains(target)) return;
      if (typeof document !== "undefined") {
        const portals = document.querySelectorAll("[data-sidebar-modal]");
        for (const portal of portals) {
          if (portal.contains(target)) return;
        }
      }
      onClose();
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <nav
        ref={sidebarRef}
        className={`
          fixed inset-y-0 left-0 z-50 w-64
          bg-surface/80 dark:bg-[#0e1513]/80 backdrop-blur-xl
          border-r border-outline-variant/40 dark:border-outline-variant/20
          flex flex-col p-4 transition-transform duration-200 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <h2 className="text-2xl font-bold mb-6 text-on-surface dark:text-on-surface font-display">
          StudentOS
        </h2>

        <ul className="flex-1 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`
                    block px-3 py-2 rounded-lg text-sm font-body transition-all duration-150
                    ${active
                      ? "bg-accent-teal/10 dark:bg-accent-teal/15 text-accent-teal border-l-2 border-accent-teal font-medium"
                      : "text-on-surface-variant dark:text-on-surface-variant hover:bg-surface-container/60 dark:hover:bg-white/5 hover:text-on-surface dark:hover:text-on-surface"}
                  `}
                >
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>

        <button
          onClick={() => setShowConfirm(true)}
          className="mt-4 w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-on-surface-variant dark:text-on-surface-variant hover:bg-surface-container/60 dark:hover:bg-white/5 hover:text-on-surface dark:hover:text-on-surface transition text-sm font-body"
        >
          <LogOut size={18} />
          Logout
        </button>
      </nav>

      {showConfirm &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            data-sidebar-modal
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <div className="bg-surface/90 dark:bg-[#1a211f]/90 backdrop-blur-xl border border-outline-variant/40 dark:border-outline-variant/20 rounded-2xl p-6 w-full max-w-sm shadow-xl">
              <h3 className="text-lg font-semibold text-on-surface dark:text-on-surface mb-2 font-display">
                Log out of StudentOS?
              </h3>
              <p className="text-on-surface-variant dark:text-on-surface-variant text-sm mb-6 font-body">
                You will need to log in again to access your dashboard.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={loggingOut}
                  className="px-4 py-2 rounded-lg text-on-surface-variant dark:text-on-surface-variant hover:bg-surface-container/60 dark:hover:bg-white/5 transition disabled:opacity-50 font-body"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  disabled={loggingOut}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white transition disabled:opacity-70 flex items-center gap-2 min-w-[90px] justify-center font-body"
                >
                  {loggingOut ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Log Out"
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
