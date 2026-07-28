export default function BackgroundOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full blur-[120px]"
        style={{ backgroundColor: "var(--orb-teal)" }}
      />
      <div
        className="absolute -bottom-40 -left-40 h-[450px] w-[450px] rounded-full blur-[120px]"
        style={{ backgroundColor: "var(--orb-coral)" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full blur-[150px] opacity-60"
        style={{ backgroundColor: "var(--orb-teal)" }}
      />
    </div>
  );
}
