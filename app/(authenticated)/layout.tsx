"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import MentorChat from "@/components/MentorChat";
import Footer from "@/components/Footer";
import ExamReminderPopup from "@/components/ExamReminderPopup";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <Navbar
        drawerOpen={drawerOpen}
        onToggleDrawer={() => setDrawerOpen((p) => !p)}
      />

      <main className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />

      <MentorChat />
      <ExamReminderPopup />
    </div>
  );
}
