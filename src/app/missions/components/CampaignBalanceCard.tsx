"use client";

import StatCard from "@/components/ui/StatCard";

type CampaignBalanceCardProps = {
  requiredAmountLabel: string;
  requiredAmountValue: string;
  missionLabel: string;
  missionStatus: string;
  missionColor: "gold" | "green" | "blue";
  todayLabel: string;
  todayEarnings: number;
  totalBalanceLabel: string;
  totalBalance: number;
};

export default function CampaignBalanceCard({
  requiredAmountLabel,
  requiredAmountValue,
  missionLabel,
  missionStatus,
  missionColor,
  todayLabel,
  todayEarnings,
  totalBalanceLabel,
  totalBalance,
}: CampaignBalanceCardProps) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-3">
      <StatCard
        label={requiredAmountLabel}
        value={requiredAmountValue}
        color="gold"
      />

      <StatCard
        label={missionLabel}
        value={missionStatus}
        color={missionColor}
      />

      <StatCard
        label={todayLabel}
        value={`$${todayEarnings.toFixed(2)}`}
        color="green"
      />

      <StatCard
        label={totalBalanceLabel}
        value={`$${totalBalance.toFixed(2)}`}
        color="gold"
      />
    </div>
  );
}