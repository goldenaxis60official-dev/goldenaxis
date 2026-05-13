"use client";

import { Gem, X } from "lucide-react";

type InsufficientBalanceModalProps = {
  open: boolean;
  balanceVerification: string;
  required: number;
  profit: number;
  needed: number;
  onAddCredits: () => void;
  onContactSupport: () => void;
  onClose: () => void;
};

export default function InsufficientBalanceModal({
  open,
  balanceVerification,
  required,
  profit,
  needed,
  onAddCredits,
  onContactSupport,
  onClose,
}: InsufficientBalanceModalProps) {
  if (!open) return null;

  return (
    <div className="mb-5 overflow-hidden rounded-[2rem] border border-yellow-300/35 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.22),rgba(24,18,4,0.96)_42%,rgba(5,5,5,0.98)_100%)] p-4 shadow-[0_0_45px_rgba(250,204,21,0.18)]">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-300 text-black shadow-[0_0_25px_rgba(250,204,21,0.45)]">
          <Gem className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-yellow-200/60">
            {balanceVerification}
          </p>

          <h3 className="mt-1 text-lg font-black text-white">
            Additional credits required
          </h3>

          <p className="mt-1 text-sm leading-6 text-yellow-100/65">
            Your current campaign balance is not enough to continue this premium mission.
            Please add credits and try again.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/50 active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-black/35 p-3">
          <p className="text-[10px] uppercase text-white/35">Required</p>
          <p className="mt-1 text-sm font-black text-yellow-300">
            ${required.toFixed(2)}
          </p>
        </div>

        <div className="rounded-2xl bg-black/35 p-3">
          <p className="text-[10px] uppercase text-white/35">Profit</p>
          <p className="mt-1 text-sm font-black text-emerald-300">
            ${profit.toFixed(2)}
          </p>
        </div>

        <div className="rounded-2xl bg-black/35 p-3">
          <p className="text-[10px] uppercase text-white/35">Needed</p>
          <p className="mt-1 text-sm font-black text-rose-200">
            ${needed.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onAddCredits}
          className="rounded-2xl bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 px-4 py-3 text-sm font-black text-black shadow-[0_0_28px_rgba(250,204,21,0.28)] active:scale-[0.98]"
        >
          Add Credits
        </button>

        <button
          type="button"
          onClick={onContactSupport}
          className="rounded-2xl border border-yellow-300/25 bg-white/[0.06] px-4 py-3 text-sm font-black text-yellow-100 active:scale-[0.98]"
        >
          Contact Support
        </button>
      </div>
    </div>
  );
}