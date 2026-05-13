"use client";

import { Gem } from "lucide-react";

type MissionHeaderProps = {
  campaignCenter: string;
  title: string;
};

export default function MissionHeader({
  campaignCenter,
  title,
}: MissionHeaderProps) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]" />

          <p className="text-xs font-bold text-emerald-200">
            {campaignCenter}
          </p>
        </div>

        <h1 className="text-2xl font-black">{title}</h1>
      </div>

      <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3 shadow-[0_0_25px_rgba(234,179,8,0.18)]">
        <Gem className="h-6 w-6 text-yellow-300" />
      </div>
    </div>
  );
}