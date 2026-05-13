"use client";

import { Loader2, Sparkles } from "lucide-react";

type ProcessingMissionModalProps = {
  open: boolean;
  title: string;
  currentStepText: string;
  progressPercent: number;
};

export default function ProcessingMissionModal({
  open,
  title,
  currentStepText,
  progressPercent,
}: ProcessingMissionModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 px-5 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-[2rem] border border-yellow-400/25 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.18),rgba(12,10,5,0.98)_48%,rgba(0,0,0,1)_100%)] p-5 shadow-[0_0_60px_rgba(250,204,21,0.18)]">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-yellow-400 text-black shadow-[0_0_35px_rgba(250,204,21,0.45)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>

        <div className="text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-yellow-200">
            <Sparkles className="h-3.5 w-3.5" />
            Processing
          </div>

          <h2 className="text-xl font-black text-white">{title}</h2>

          <p className="mt-2 min-h-[2.5rem] text-sm leading-6 text-white/60">
            {currentStepText}
          </p>
        </div>

        <div className="mt-5 rounded-full bg-black/45 p-1">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="mt-3 text-center text-xs font-bold text-yellow-100/55">
          Please wait...
        </p>
      </div>
    </div>
  );
}