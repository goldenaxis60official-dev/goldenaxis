"use client";

import LuxuryCard from "@/components/ui/LuxuryCard";
import { AlertCircle, Clock } from "lucide-react";

type MissionEmptyStateProps = {
  state: "loading" | "preparing" | "missing";
  title?: string;
  note?: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
};

export default function MissionEmptyState({
  state,
  title,
  note,
  buttonLabel,
  onButtonClick,
}: MissionEmptyStateProps) {
  if (state === "loading") {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 text-center text-white/60">
        {title}
      </div>
    );
  }

  if (state === "preparing") {
    return (
      <LuxuryCard goldGlow className="p-6 text-center">
        <Clock className="mx-auto mb-4 h-12 w-12 text-yellow-300" />

        <h2 className="text-xl font-black">{title}</h2>

        <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-yellow-100/70">
          {note}
        </p>

        {buttonLabel && onButtonClick && (
          <button
            type="button"
            onClick={onButtonClick}
            className="mt-5 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-3 text-sm font-black text-black shadow-[0_12px_30px_rgba(234,179,8,0.25)] active:scale-[0.98]"
          >
            {buttonLabel}
          </button>
        )}
      </LuxuryCard>
    );
  }

  return (
    <div className="rounded-[2rem] border border-yellow-400/20 bg-yellow-400/10 p-6 text-center">
      <AlertCircle className="mx-auto mb-4 h-12 w-12 text-yellow-300" />

      <h2 className="text-xl font-black">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-yellow-100/70">
        {note}
      </p>
    </div>
  );
}