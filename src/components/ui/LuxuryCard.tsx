type LuxuryCardProps = {
  children: React.ReactNode;
  className?: string;
  goldGlow?: boolean;
};

export default function LuxuryCard({
  children,
  className = "",
  goldGlow = false,
}: LuxuryCardProps) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-[2rem] border backdrop-blur-2xl",
        "shadow-[0_22px_70px_rgba(0,0,0,0.45)]",
        goldGlow
          ? [
              "border-yellow-400/35",
              "bg-[linear-gradient(145deg,rgba(255,215,80,0.16),rgba(255,255,255,0.055)_42%,rgba(0,0,0,0.45))]",
              "shadow-[0_0_45px_rgba(234,179,8,0.16),0_24px_70px_rgba(0,0,0,0.5)]",
              "before:absolute before:inset-0 before:pointer-events-none",
              "before:bg-[radial-gradient(circle_at_top_left,rgba(255,230,120,0.20),transparent_38%)]",
            ].join(" ")
          : [
              "border-white/10",
              "bg-[linear-gradient(145deg,rgba(255,255,255,0.075),rgba(255,255,255,0.035)_45%,rgba(0,0,0,0.42))]",
              "shadow-[0_18px_55px_rgba(0,0,0,0.35)]",
            ].join(" "),
        className,
      ].join(" ")}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}