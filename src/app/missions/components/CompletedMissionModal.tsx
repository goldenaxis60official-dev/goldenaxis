"use client";

import { CheckCircle, ClipboardList, Sparkles, X } from "lucide-react";

type CompletedMissionModalProps = {
  open: boolean;
  title: string;
  subtitle: string;
  creditAdded: number;
  totalProfit: number;
  updatedBalance: number;
  onClose: () => void;
  onViewHistory: () => void;
};

export default function CompletedMissionModal({
  open,
  title,
  subtitle,
  creditAdded,
  totalProfit,
  updatedBalance,
  onClose,
  onViewHistory,
}: CompletedMissionModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-md">
      <div className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-emerald-400/25 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.2),rgba(10,12,8,0.98)_48%,rgba(0,0,0,1)_100%)] p-5 shadow-[0_0_60px_rgba(52,211,153,0.18)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/55 active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-emerald-400 text-black shadow-[0_0_35px_rgba(52,211,153,0.45)]">
          <CheckCircle className="h-8 w-8" />
        </div>

        <div className="text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
            <Sparkles className="h-3.5 w-3.5" />
            Completed
          </div>

          <h2 className="text-xl font-black text-white">{title}</h2>

          <p className="mt-2 text-sm leading-6 text-white/60">
            {subtitle}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3">
          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.15em] text-emerald-100/55">
              Campaign Credit Added
            </p>
            <p className="mt-1 text-3xl font-black text-emerald-300">
              ${creditAdded.toFixed(2)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl bg-black/35 p-3">
              <p className="text-[10px] uppercase text-white/35">
                Total Profit
              </p>
              <p className="mt-1 text-sm font-black text-yellow-300">
                ${totalProfit.toFixed(2)}
              </p>
            </div>

            <div className="rounded-2xl bg-black/35 p-3">
              <p className="text-[10px] uppercase text-white/35">
                New Balance
              </p>
              <p className="mt-1 text-sm font-black text-white">
                ${updatedBalance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 px-4 py-3 text-sm font-black text-black shadow-[0_0_28px_rgba(250,204,21,0.25)] active:scale-[0.98]"
          >
            Continue
          </button>

          <button
            type="button"
            onClick={onViewHistory}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white/75 active:scale-[0.98]"
          >
            <ClipboardList className="h-4 w-4" />
            History
          </button>
        </div>
      </div>
    </div>
  );
}