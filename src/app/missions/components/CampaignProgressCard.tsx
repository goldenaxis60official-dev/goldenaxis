"use client";

import LuxuryCard from "@/components/ui/LuxuryCard";

type CampaignProgressCardProps = {
  currentProgressLabel: string;
  statusLabel: string;
  stepLabel: string;
  currentStep: string | number;
  totalOrders: string | number;
  craftGradeLabel: string;
  grade: string;
  scoreLabel: string;
  score: string | number;
  progressPercent: number;
  completedCount: number;
  completedLabel: string;
};

export default function CampaignProgressCard({
  currentProgressLabel,
  statusLabel,
  stepLabel,
  currentStep,
  totalOrders,
  craftGradeLabel,
  grade,
  scoreLabel,
  score,
  progressPercent,
  completedCount,
  completedLabel,
}: CampaignProgressCardProps) {
  return (
    <LuxuryCard goldGlow className="mb-4 p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-200/60">
            {currentProgressLabel}
          </p>

          <h2 className="mt-2 text-xl font-black text-white">
            {statusLabel}
          </h2>

          <p className="mt-1 text-xs leading-5 text-white/45">
            {stepLabel} {currentStep} / {totalOrders}
          </p>
        </div>

        <div className="rounded-2xl bg-black/35 px-3 py-2 text-right">
          <p className="text-[10px] uppercase tracking-wide text-white/40">
            {craftGradeLabel}
          </p>

          <p className="font-black text-yellow-300">{grade}</p>

          <p className="mt-0.5 text-[10px] font-bold text-white/40">
            {scoreLabel} {score}
          </p>
        </div>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-black/40">
        <div
          className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-100 shadow-[0_0_18px_rgba(250,204,21,0.35)] transition-all duration-700"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-white/45">
          {completedCount}/{totalOrders} {completedLabel}
        </span>

        <span className="font-black text-yellow-300">
          {Math.round(progressPercent)}%
        </span>
      </div>
    </LuxuryCard>
  );
}