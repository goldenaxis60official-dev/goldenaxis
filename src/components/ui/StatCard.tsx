type StatCardProps = {
  label: string;
  value: string;
  color?: "gold" | "green" | "blue" | "white" | "red";
};

const colorMap = {
  gold: "text-yellow-300",
  green: "text-emerald-300",
  blue: "text-sky-300",
  white: "text-white",
  red: "text-red-300",
};

export default function StatCard({
  label,
  value,
  color = "white",
}: StatCardProps) {
  return (
    <div className="min-w-0 rounded-[1.25rem] border border-white/10 bg-black/35 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_25px_rgba(0,0,0,0.25)]">
      <p className="truncate text-[11px] font-medium tracking-wide text-white/45">
        {label}
      </p>

      <p
        className={`mt-1 truncate text-[15px] font-black tracking-tight tabular-nums ${colorMap[color]}`}
      >
        {value}
      </p>
    </div>
  );
}