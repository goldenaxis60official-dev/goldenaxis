type StatCardProps = {
  label: string;
  value: string;
  color?: "gold" | "green" | "blue" | "white" | "red";
};

const colorMap = {
  gold: "text-yellow-300",
  green: "text-emerald-300",
  blue: "text-blue-300",
  white: "text-white",
  red: "text-red-300",
};

export default function StatCard({
  label,
  value,
  color = "white",
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3 shadow-[inset_0_0_20px_rgba(255,255,255,0.025)]">
      <p className="text-[11px] font-medium text-white/45">{label}</p>
      <p className={`mt-1 truncate text-sm font-black ${colorMap[color]}`}>
        {value}
      </p>
    </div>
  );
}