import GlassCard from "@/components/ui/GlassCard";

type WidgetProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function Widget({ title, subtitle, children }: WidgetProps) {
  return (
    <GlassCard className="p-6">
      <header className="mb-4">
        <h2 className="text-xl font-semibold text-on-surface dark:text-on-surface font-display">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-on-surface-variant dark:text-on-surface-variant font-body">
            {subtitle}
          </p>
        )}
      </header>
      <section>{children}</section>
    </GlassCard>
  );
}
