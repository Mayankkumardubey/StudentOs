"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";

const topNavLinks = [
  { name: "Home", href: "/" },
  { name: "About Us", href: "/about" },
  { name: "Contact Us", href: "/contact" },
];

export default function Navbar({
  drawerOpen,
  onToggleDrawer,
}: {
  drawerOpen: boolean;
  onToggleDrawer: () => void;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  function toggle() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-200 dark:border-gray-800 px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleDrawer}
          aria-label="Toggle navigation"
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          {drawerOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link href="/" className="font-bold text-lg">
          StudentOS
        </Link>
      </div>

      <nav className="flex items-center gap-1">
        {topNavLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              pathname === link.href
                ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            {link.name}
          </Link>
        ))}

        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="ml-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          {mounted && theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </nav>
    </header>
  );
}
