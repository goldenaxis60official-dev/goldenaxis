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
      className={`rounded-[2rem] border bg-white/[0.06] backdrop-blur-xl ${
        goldGlow
          ? "border-yellow-400/30 shadow-[0_0_35px_rgba(212,175,55,0.18)]"
          : "border-white/10"
      } ${className}`}
    >
      {children}
    </div>
  );
}