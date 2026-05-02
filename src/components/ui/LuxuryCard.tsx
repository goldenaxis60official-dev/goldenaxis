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
      className={`rounded-[2rem] border backdrop-blur-xl ${
        goldGlow
          ? "border-yellow-400/30 bg-gradient-to-br from-yellow-400/10 via-white/[0.055] to-black/20 shadow-[0_0_40px_rgba(212,175,55,0.18)]"
          : "border-white/10 bg-white/[0.055] shadow-[0_18px_45px_rgba(0,0,0,0.25)]"
      } ${className}`}
    >
      {children}
    </div>
  );
}