type StatCardProps = {
  label: string;
  value: string;
  color?: "gold" | "green" | "blue" | "white";
};

const colorMap = {
  gold: "text-yellow-300",
  green: "text-emerald-300",
  blue: "text-blue-300",
  white: "text-white",
};

export default function StatCard({
  label,
  value,
  color = "white",
}: StatCardProps) {
  return (
    <div className="rounded-2xl bg-black/30 p-3">
      <p className="text-xs text-white/50">{label}</p>
      <p className={`mt-1 font-bold ${colorMap[color]}`}>{value}</p>
    </div>
  );
}