import type { Metadata } from "next";
import {
  Plus_Jakarta_Sans,
  Source_Serif_4,
  Inter,
  Hanken_Grotesk,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif-4",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "StudentOS",
  description: "AI-powered student success platform",
};

const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('theme');
      var isDark = theme ? theme === 'dark' : true;
      document.documentElement.classList.toggle('dark', isDark);
    } catch(e) {}
  })()
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${plusJakarta.variable} ${sourceSerif.variable} ${inter.variable} ${hanken.variable} ${jetbrains.variable} h-full antialiased flex flex-col min-h-full`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          storageKey="theme"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
