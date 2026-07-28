import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-6",
        "bg-glass backdrop-blur-xl",
        "border border-glass-border",
        "shadow-[var(--glass-shadow)]",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)]",
        "dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.40)]",
        "motion-reduce:transform-none motion-reduce:hover:translate-y-0",
        className
      )}
    >
      {children}
    </div>
  );
}
