"use client";

import { CheckCircle, ShieldCheck, Sparkles, Trophy } from "lucide-react";

type CampaignCompletedCardProps = {
  lang: string;
  completedCount: number;
  totalOrders: number;
  totalProfitAmount: number;
  onViewHistory: () => void;
  onOpenSupport: () => void;
};

export default function CampaignCompletedCard({
  lang,
  completedCount,
  totalOrders,
  totalProfitAmount,
  onViewHistory,
  onOpenSupport,
}: CampaignCompletedCardProps) {
  const isZh = lang === "zh";

  return (
    <div className="relative overflow-hidden rounded-[2.4rem] border border-yellow-300/35 bg-[radial-gradient(circle_at_top,#7a560d55_0%,#171003_42%,#030303_100%)] p-5 text-center shadow-[0_0_70px_rgba(250,204,21,0.22)]">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-yellow-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-44 w-44 rounded-full bg-yellow-500/10 blur-3xl" />

      <div className="relative z-10">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-yellow-100/50 bg-gradient-to-br from-yellow-100 via-yellow-400 to-amber-700 text-black shadow-[0_0_45px_rgba(250,204,21,0.55)]">
          <Trophy className="h-12 w-12" />
        </div>

        <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-4 py-2">
          <CheckCircle className="h-4 w-4 text-emerald-300" />
          <span className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">
            {isZh ? "全部任务已完成" : "All Missions Completed"}
          </span>
        </div>

        <h2 className="mt-4 text-2xl font-black text-white">
          {isZh ? "恭喜完成推广任务" : "Congratulations!"}
        </h2>

        <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-yellow-100/65">
          {isZh
            ? "您的全部推广任务已成功完成，收益已记录到账户余额。"
            : "Your full promotion campaign has been completed successfully. Total profit has been recorded to your account."}
        </p>

        <div className="mt-5 rounded-[2rem] border border-yellow-300/30 bg-black/45 p-5 shadow-[inset_0_0_28px_rgba(250,204,21,0.08)]">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-100/55">
              {isZh ? "总收益" : "Total Profit Earned"}
            </p>
            <Sparkles className="h-4 w-4 text-yellow-300" />
          </div>

          <p className="text-4xl font-black tracking-tight text-yellow-300 drop-shadow-[0_0_18px_rgba(250,204,21,0.35)]">
            ${totalProfitAmount.toFixed(2)}
          </p>

          <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-yellow-300 to-transparent" />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-[10px] uppercase text-white/35">
              {isZh ? "任务" : "Missions"}
            </p>
            <p className="mt-1 text-sm font-black text-white">
              {completedCount}/{totalOrders}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-3">
            <p className="text-[10px] uppercase text-yellow-100/45">
              {isZh ? "进度" : "Progress"}
            </p>
            <p className="mt-1 text-sm font-black text-yellow-300">100%</p>
          </div>

          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3">
            <p className="text-[10px] uppercase text-emerald-100/45">
              {isZh ? "状态" : "Status"}
            </p>
            <p className="mt-1 text-sm font-black text-emerald-300">
              {isZh ? "完成" : "Verified"}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4 text-left">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-yellow-300 text-black shadow-[0_0_22px_rgba(250,204,21,0.35)]">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-black text-white">
                {isZh ? "账户收益已确认" : "Campaign Profit Confirmed"}
              </p>
              <p className="mt-1 text-xs leading-5 text-white/50">
                {isZh
                  ? "您可以查看任务记录，或前往客服中心获取下一步帮助。"
                  : "You can review your task records or continue to the support center for next-step help."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onViewHistory}
            className="rounded-2xl border border-yellow-300/25 bg-white/[0.06] px-4 py-3 text-sm font-black text-yellow-100 active:scale-[0.98]"
          >
            {isZh ? "查看记录" : "View Records"}
          </button>

          <button
            type="button"
            onClick={onOpenSupport}
            className="rounded-2xl bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 px-4 py-3 text-sm font-black text-black shadow-[0_0_32px_rgba(250,204,21,0.35)] active:scale-[0.98]"
          >
            {isZh ? "客服中心" : "Support Center"}
          </button>
        </div>
      </div>
    </div>
  );
}