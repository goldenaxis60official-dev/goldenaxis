//src>app>missions>page.tsx

"use client";

import LuxuryCard from "@/components/ui/LuxuryCard";
import StatCard from "@/components/ui/StatCard";
import { useEffect, useMemo, useState } from "react";
import { getLanguage, messages } from "@/i18n";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import {
  Gem,
  Trophy,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Star,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  ShieldCheck,
} from "lucide-react";

type GeneratedOrderItem = {
  id: string;
  product_snapshot: {
    id?: string | null;
    name?: string;
    category?: string;
    price?: number;
    original_price?: number;
    custom_lucky_amount?: number | string;
    currency?: string;
    rating?: number;
    reviews_count?: number;
    description?: string | null;
    main_image?: string | null;
    images?: string[];
    tier?: string | null;
    stock_status?: string;
    product_type?: string;
  };
  unit_price: number;
  quantity: number;
  subtotal: number;
};

type GeneratedOrder = {
  id: string;
  user_id: string;
  step_number: number;
  order_total: number;
  profit_rate: number;
  profit_amount: number;
  lucky_profit_rate_percent: number | null;
  lucky_profit_amount: number;
  order_type: "normal" | "lucky";
  status: "pending" | "completed" | "cancelled";
  is_lucky_bonus: boolean;
  created_at: string;
  completed_at: string | null;
  user_generated_order_items?: GeneratedOrderItem[];
};

export default function MissionsPage() {
  return (
    <RequireAuth>
      {(profile) => <MissionContent profile={profile} />}
    </RequireAuth>
  );
}

function RatingStars({ rating }: { rating: number }) {
  const safeRating = Math.min(Math.max(rating, 0), 5);
  const fillWidth = `${(safeRating / 5) * 100}%`;

  return (
    <div className="relative inline-flex">
      <div className="flex gap-0.5 text-white/20">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className="h-4 w-4" />
        ))}
      </div>

      <div
        className="absolute left-0 top-0 flex gap-0.5 overflow-hidden text-yellow-300"
        style={{ width: fillWidth }}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className="h-4 w-4 fill-current" />
        ))}
      </div>
    </div>
  );
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function MissionContent({ profile }: { profile: Profile }) {
  const router = useRouter();

  const lang = getLanguage(profile.language);
  const t = messages[lang];

  const [orders, setOrders] = useState<GeneratedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

const [showCompletedPopup, setShowCompletedPopup] = useState(false);
const [showInsufficientPopup, setShowInsufficientPopup] = useState(false);
const [showProcessingPopup, setShowProcessingPopup] = useState(false);

const [insufficientInfo, setInsufficientInfo] = useState({
  required: 0,
  balance: 0,
  needed: 0,
});

const [processingStep, setProcessingStep] = useState(0);
const [completedReward, setCompletedReward] = useState("0.00");
const [completedStep, setCompletedStep] = useState<number | null>(null);
const [completedAllOrders, setCompletedAllOrders] = useState(false);

const [finalReward, setFinalReward] = useState("0.00");

  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [galleryIndex, setGalleryIndex] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadGeneratedOrders() {
      setLoading(true);
      setErrorText("");

      const { data, error } = await supabase
        .from("user_generated_orders")
        .select(
          `
          id,
          user_id,
          step_number,
          order_total,
          profit_rate,
          profit_amount,
lucky_profit_rate_percent,
lucky_profit_amount,
order_type,
          status,
          is_lucky_bonus,
          created_at,
          completed_at,
          user_generated_order_items (
            id,
            product_snapshot,
            unit_price,
            quantity,
            subtotal
          )
        `
        )
        .eq("user_id", profile.id)
        .in("status", ["pending", "completed"])
        .order("step_number", { ascending: true });

      if (error) {
        setErrorText(error.message);
        setLoading(false);
        return;
      }

      setOrders((data || []) as unknown as GeneratedOrder[]);
      setLoading(false);
    }

    loadGeneratedOrders();
  }, [profile.id, profile.current_step]);

  const totalOrders = orders.length;

  const completedCount = orders.filter(
    (order) => order.status === "completed"
  ).length;

  const pendingOrders = orders.filter((order) => order.status === "pending");

  const maxStep = orders.reduce(
    (max, order) => Math.max(max, order.step_number),
    0
  );

  const activeOrder =
    orders.find(
      (order) =>
        order.step_number === profile.current_step && order.status === "pending"
    ) ||
    pendingOrders[0] ||
    null;

  const allGeneratedCompleted = totalOrders > 0 && completedCount >= totalOrders;

  const progressBase = totalOrders || 1;
  const progressPercent = Math.min((completedCount / progressBase) * 100, 100);

const totalProfitAmount = useMemo(() => {
  return orders.reduce((sum, order) => {
    if (order.is_lucky_bonus || order.order_type === "lucky") {
      return sum + Number(order.lucky_profit_amount || 0);
    }

    return sum + Number(order.profit_amount || 0);
  }, 0);
}, [orders]);

  const missionStatusLabel = loading
    ? t.common.loading
    : totalOrders === 0
      ? t.missions.preparingTitle
      : allGeneratedCompleted
        ? t.missions.allCompletedTitle
        : activeOrder
          ? t.missions.startPromotionTask
          : t.missions.stepNotAssignedTitle;

  function getOrderItems(order: GeneratedOrder) {
    return order.user_generated_order_items || [];
  }

  function getMainSnapshot(order: GeneratedOrder) {
    return getOrderItems(order)[0]?.product_snapshot || {};
  }

  function getImages(order: GeneratedOrder) {
    const snapshot = getMainSnapshot(order);

    const productImages = Array.isArray(snapshot.images)
      ? snapshot.images.filter(Boolean)
      : [];

    const mainImage = snapshot.main_image || "";

    const images = mainImage
      ? [mainImage, ...productImages.filter((image) => image !== mainImage)]
      : productImages;

    return images;
  }

  function changeGalleryImage(order: GeneratedOrder, direction: "prev" | "next") {
    const images = getImages(order);
    if (images.length <= 1) return;

    const currentIndex = galleryIndex[order.id] || 0;

    const nextIndex =
      direction === "next"
        ? (currentIndex + 1) % images.length
        : (currentIndex - 1 + images.length) % images.length;

    setGalleryIndex({
      ...galleryIndex,
      [order.id]: nextIndex,
    });
  }

  async function handleCompleteGeneratedOrder(order: GeneratedOrder) {
  if (order.step_number !== profile.current_step) return;

 const orderTotal = Number(order.order_total || 0);

const isLuckyOrder = order.is_lucky_bonus || order.order_type === "lucky";

const mainBalance = Number(profile.balance || 0);
const depositReserve = Number(profile.deposited_balance || 0);
const availableForOrder = isLuckyOrder
  ? mainBalance + depositReserve
  : mainBalance;

const neededForOrder = Math.max(orderTotal - availableForOrder, 0);

if (neededForOrder > 0) {
  setInsufficientInfo({
    required: orderTotal,
    balance: availableForOrder,
    needed: neededForOrder,
  });

  setErrorText(t.missions.insufficientBalance);
  setShowInsufficientPopup(true);
  return;
}
  setActionLoading(true);
  setShowProcessingPopup(true);
  setProcessingStep(0);
  setErrorText("");
  setSuccessText("");

  const stepDelay = order.is_lucky_bonus ? 700 : 520;

  try {
    setProcessingStep(0);
    await wait(stepDelay);

    setProcessingStep(1);
    await wait(stepDelay);

    setProcessingStep(2);
    await wait(stepDelay);

    const { data, error } = await supabase.rpc("complete_generated_order");

    if (error) {
      if (error.message.includes("no_generated_orders")) {
        setErrorText(t.missions.noAssignedTasks);
      } else if (error.message.includes("current_generated_order_not_found")) {
        setErrorText(t.missions.stepNotAssignedTitle);
      } else if (error.message.includes("account_not_active")) {
        setErrorText(t.missions.assignedTaskNotFound);
} else if (error.message.includes("insufficient_balance")) {
  const neededForOrder = Math.max(orderTotal - availableForOrder, 0);

  setInsufficientInfo({
    required: orderTotal,
    balance: availableForOrder,
    needed: neededForOrder,
  });

  setErrorText(t.missions.insufficientBalance);
  setShowInsufficientPopup(true);
} else {
        setErrorText(error.message);
      }

      setShowProcessingPopup(false);
      setActionLoading(false);
      return;
    }

    setProcessingStep(3);
    await wait(stepDelay);

    setProcessingStep(4);
    await wait(stepDelay);

    setProcessingStep(5);
    await wait(stepDelay);

    const reward = Number(data?.profit_amount || 0);

    const totalProfitAfterComplete = orders.reduce((sum, item) => {
  if (item.id === order.id) {
    return sum + reward;
  }

  if (item.status === "completed") {
    return sum + Number(item.profit_amount || 0);
  }

  return sum;
}, 0);

    const allCompleted =
      Boolean(data?.all_completed) || order.step_number >= maxStep;

    setCompletedReward(reward.toFixed(2));
    setCompletedStep(order.step_number);
    setCompletedAllOrders(allCompleted);
    setFinalReward(totalProfitAfterComplete.toFixed(2));

    setShowProcessingPopup(false);
    setShowCompletedPopup(true);
    setActionLoading(false);
  } catch (err) {
    setErrorText(
      err instanceof Error ? err.message : "Promotion task could not be completed."
    );
    setShowProcessingPopup(false);
    setActionLoading(false);
  }
}

const activeItems = activeOrder ? getOrderItems(activeOrder) : [];

const mainBalance = Number(profile.balance || 0);
const depositBalance = Number(profile.deposited_balance || 0);
const todayEarnings = Number(profile.today_earnings || 0);
// Reserved for future stat display if needed.
// const taskEarnBalance = Number(profile.task_profit_balance || 0);
// const referralBalance = Number(profile.referral_bonus_balance || 0);

// Frontend display only.
// This does not change task generation, task completion, or lucky calculation.
const displayTotalBalance = mainBalance + depositBalance;

const availableForLuckyRequirement = mainBalance + depositBalance;
function calculateDisplayReward(order: GeneratedOrder | null) {
  if (!order) return 0;

  if (order.is_lucky_bonus || order.order_type === "lucky") {
    const storedLuckyProfit = Number(order.lucky_profit_amount || 0);

    if (storedLuckyProfit > 0) {
      return storedLuckyProfit;
    }

    return (
      (Number(order.order_total || 0) *
        Number(order.lucky_profit_rate_percent || 0)) /
      100
    );
  }

  return Number(order.profit_amount || 0);
}

function stableNumber(seed: string, min: number, max: number) {
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  }

  const percent = hash / 100000;
  return min + percent * (max - min);
}

function getCraftProfile(order: GeneratedOrder | null) {
  if (!order) {
    return {
      grade: "-",
      score: 0,
      minCredit: 0,
      maxCredit: 0,
      workMin: 0,
      workMax: 0,
    };
  }

const reward = calculateDisplayReward(order);

const storedRate = Number(order.profit_rate || 0.8);
const rate =
  storedRate > 0.05
    ? storedRate / 100
    : storedRate || 0.008;

const seed = `${order.id}-${order.step_number}`;

  const score = Math.round(stableNumber(`${seed}-score`, 88, 99));

  const grade =
    score >= 97
      ? "S"
      : score >= 94
        ? "A+"
        : score >= 91
          ? "A"
          : "B+";

  const lowFactor = stableNumber(`${seed}-low`, 0.78, 0.92);
  const highFactor = stableNumber(`${seed}-high`, 1.14, 1.38);

  const minCredit = Math.max(0.01, reward * lowFactor);
  const maxCredit = Math.max(minCredit + 0.1, reward * highFactor);

  return {
    grade,
    score,
    minCredit,
    maxCredit,
    workMin: minCredit / rate,
    workMax: maxCredit / rate,
  };
}

function formatCreditRange(profile: ReturnType<typeof getCraftProfile>) {
  return `$${profile.minCredit.toFixed(2)} - $${profile.maxCredit.toFixed(2)}`;
}

function formatWorkValueRange(profile: ReturnType<typeof getCraftProfile>) {
  return `${profile.workMin.toFixed(0)} - ${profile.workMax.toFixed(0)} pts`;
}

const activeCraftProfile = getCraftProfile(activeOrder);
const activeOrderCurrency =
  activeOrder ? getMainSnapshot(activeOrder).currency || "USD" : "USD";

const isInsufficientBalanceError =
  errorText === t.missions.insufficientBalance;

const isLuckyActiveOrder = Boolean(
  activeOrder && (activeOrder.is_lucky_bonus || activeOrder.order_type === "lucky")
);

const requiredBalance = Number(activeOrder?.order_total || 0);

const balanceShortage = isLuckyActiveOrder
  ? Math.max(requiredBalance - availableForLuckyRequirement, 0)
  : 0;

const requiredDisplayValue =
  balanceShortage > 0 ? `-$${balanceShortage.toFixed(2)}` : "$0.00";

const missionCardStatus = loading
  ? t.common.loading
  : totalOrders === 0
    ? t.missions.preparing
    : allGeneratedCompleted
      ? t.missions.completed
      : balanceShortage > 0
        ? t.missions.insufficient
        : activeOrder
          ? t.missions.processing
          : t.missions.locked;

const processingSteps = useMemo(() => {
  const lucky = Boolean(activeOrder?.is_lucky_bonus);

  if (lang === "zh") {
    return lucky
      ? [
          "正在提交幸运推广任务",
          "正在上传产品评分记录",
          "正在验证高级珠宝活动价值",
          "正在计算幸运奖励收益",
          "正在更新账户余额",
          "正在准备下一项推广任务",
        ]
      : [
  "正在提交产品推广任务",
  "正在上传评分与活动记录",
  "正在验证工艺评分",
  "正在计算推广收益",
  "正在更新账户余额",
  "正在准备下一项推广任务",
];
  }

  return lucky
    ? [
        "Submitting lucky promotion task",
        "Uploading product rating activity",
        "Verifying premium jewel campaign value",
        "Calculating lucky reward profit",
        "Updating account balance",
        "Preparing next promotion task",
      ]
    : [
  "Submitting product promotion task",
  "Uploading rating and campaign activity",
  "Verifying craftsmanship score",
  "Calculating campaign credit",
  "Updating account balance",
  "Preparing next promotion task",
];
}, [lang, activeOrder?.is_lucky_bonus]);

const activeProcessingText =
  processingSteps[Math.min(processingStep, processingSteps.length - 1)] ||
  processingSteps[0];

const processingProgressPercent = Math.min(
  ((processingStep + 1) / processingSteps.length) * 100,
  100
);

  return (
    <AppShell>
      <section className="px-5 pb-5 pt-8">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]" />
              <p className="text-xs font-bold text-emerald-200">
                {t.missions.campaignCenter}
              </p>
            </div>

            <h1 className="text-2xl font-black">{t.missions.title}</h1>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3 shadow-[0_0_25px_rgba(234,179,8,0.18)]">
            <Gem className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <LuxuryCard goldGlow className="mb-4 p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-200/60">
                {t.missions.currentProgress}
              </p>

              <h2 className="mt-2 text-xl font-black text-white">
                {missionStatusLabel}
              </h2>

              <p className="mt-1 text-xs leading-5 text-white/45">
                {t.missions.step}{" "}
                {allGeneratedCompleted
                  ? maxStep || "-"
                  : profile.current_step}{" "}
                / {totalOrders || "-"}
              </p>
            </div>

<div className="rounded-2xl bg-black/35 px-3 py-2 text-right">
  <p className="text-[10px] uppercase tracking-wide text-white/40">
    {lang === "zh" ? "工艺评级" : "Craft Grade"}
  </p>
  <p className="font-black text-yellow-300">
    {activeCraftProfile.grade}
  </p>
  <p className="mt-0.5 text-[10px] font-bold text-white/40">
    {lang === "zh" ? "评分" : "Score"} {activeCraftProfile.score || "-"}
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
              {completedCount}/{totalOrders || "-"} {t.missions.completed}
            </span>

            <span className="font-black text-yellow-300">
              {Math.round(progressPercent)}%
            </span>
          </div>
        </LuxuryCard>

<div className="mb-4 grid grid-cols-2 gap-3">
  <StatCard
    label={t.missions.requiredAmount}
    value={requiredDisplayValue}
    color="gold"
  />

  <StatCard
    label={t.missions.mission}
    value={missionCardStatus}
    color={balanceShortage > 0 ? "blue" : "green"}
  />

<StatCard
  label={t.missions.today}
  value={`$${todayEarnings.toFixed(2)}`}
  color="green"
/>

  <StatCard
  label={t.missions.totalBalance}
  value={`$${displayTotalBalance.toFixed(2)}`}
  color="gold"
/>
</div>
      </section>

      <section className="px-5 pb-6">
        {successText && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle className="h-4 w-4" />
            {successText}
          </div>
        )}

        {errorText && isInsufficientBalanceError && (
  <div className="mb-5 overflow-hidden rounded-[2rem] border border-yellow-300/35 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.22),rgba(24,18,4,0.96)_42%,rgba(5,5,5,0.98)_100%)] p-4 shadow-[0_0_45px_rgba(250,204,21,0.18)]">
    <div className="flex items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-300 text-black shadow-[0_0_25px_rgba(250,204,21,0.45)]">
        <Gem className="h-6 w-6" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-yellow-200/60">
          {t.missions.balanceVerification}
        </p>

        <h3 className="mt-1 text-lg font-black text-white">
          Additional credits required
        </h3>

        <p className="mt-1 text-sm leading-6 text-yellow-100/65">
          Your current campaign balance is not enough to continue this premium mission.
          Please add credits and try again.
        </p>
      </div>
    </div>

    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
      <div className="rounded-2xl bg-black/35 p-3">
        <p className="text-[10px] uppercase text-white/35">Required</p>
        <p className="mt-1 text-sm font-black text-yellow-300">
          ${insufficientInfo.required.toFixed(2)}
        </p>
      </div>

      <div className="rounded-2xl bg-black/35 p-3">
  <p className="text-[10px] uppercase text-white/35">Balance</p>
  <p className="mt-1 text-sm font-black text-white">
    ${insufficientInfo.balance.toFixed(2)}
  </p>
</div>

      <div className="rounded-2xl bg-black/35 p-3">
        <p className="text-[10px] uppercase text-white/35">Needed</p>
        <p className="mt-1 text-sm font-black text-rose-200">
          ${insufficientInfo.needed.toFixed(2)}
        </p>
      </div>
    </div>

    <div className="mt-4 grid grid-cols-2 gap-3">
      <button
        onClick={() => router.push("/deposit")}
        className="rounded-2xl bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 px-4 py-3 text-sm font-black text-black shadow-[0_0_28px_rgba(250,204,21,0.28)] active:scale-[0.98]"
      >
        Add Credits
      </button>

      <button
        onClick={() => router.push("/support")}
        className="rounded-2xl border border-yellow-300/25 bg-white/[0.06] px-4 py-3 text-sm font-black text-yellow-100 active:scale-[0.98]"
      >
        Contact Support
      </button>
    </div>
  </div>
)}

{errorText && !isInsufficientBalanceError && (
  <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
    <AlertCircle className="h-4 w-4" />
    {errorText}
  </div>
)}

        {loading && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 text-center text-white/60">
            {t.missions.loadingAssigned}
          </div>
        )}

        {!loading && totalOrders === 0 && (
          <LuxuryCard goldGlow className="p-6 text-center">
            <Clock className="mx-auto mb-4 h-12 w-12 text-yellow-300" />

            <h2 className="text-xl font-black">{t.missions.preparingTitle}</h2>

            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-yellow-100/70">
              {t.missions.preparingNote}
            </p>

            <button
              onClick={() => router.push("/support")}
              className="mt-5 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-3 text-sm font-black text-black shadow-[0_12px_30px_rgba(234,179,8,0.25)] active:scale-[0.98]"
            >
              {t.missions.contactSupport}
            </button>
          </LuxuryCard>
        )}

{!loading && allGeneratedCompleted && (
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
          {lang === "zh" ? "全部任务已完成" : "All Missions Completed"}
        </span>
      </div>

      <h2 className="mt-4 text-2xl font-black text-white">
        {lang === "zh" ? "恭喜完成推广任务" : "Congratulations!"}
      </h2>

      <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-yellow-100/65">
        {lang === "zh"
          ? "您的全部推广任务已成功完成，收益已记录到账户余额。"
          : "Your full promotion campaign has been completed successfully. Total profit has been recorded to your account."}
      </p>

      <div className="mt-5 rounded-[2rem] border border-yellow-300/30 bg-black/45 p-5 shadow-[inset_0_0_28px_rgba(250,204,21,0.08)]">
        <div className="mb-3 flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-300" />
          <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-100/55">
            {lang === "zh" ? "总收益" : "Total Profit Earned"}
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
            {lang === "zh" ? "任务" : "Missions"}
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {completedCount}/{totalOrders}
          </p>
        </div>

        <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-3">
          <p className="text-[10px] uppercase text-yellow-100/45">
            {lang === "zh" ? "进度" : "Progress"}
          </p>
          <p className="mt-1 text-sm font-black text-yellow-300">
            100%
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3">
          <p className="text-[10px] uppercase text-emerald-100/45">
            {lang === "zh" ? "状态" : "Status"}
          </p>
          <p className="mt-1 text-sm font-black text-emerald-300">
            {lang === "zh" ? "完成" : "Verified"}
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
              {lang === "zh" ? "账户收益已确认" : "Campaign Profit Confirmed"}
            </p>
            <p className="mt-1 text-xs leading-5 text-white/50">
  {lang === "zh"
    ? "您可以查看任务记录，或前往客服中心获取下一步帮助。"
    : "You can review your task records or continue to the support center for next-step help."}
</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          onClick={() => router.push("/history")}
          className="rounded-2xl border border-yellow-300/25 bg-white/[0.06] px-4 py-3 text-sm font-black text-yellow-100 active:scale-[0.98]"
        >
          {lang === "zh" ? "查看记录" : "View Records"}
        </button>

<button
  onClick={() => router.push("/support")}
  className="rounded-2xl bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 px-4 py-3 text-sm font-black text-black shadow-[0_0_32px_rgba(250,204,21,0.35)] active:scale-[0.98]"
>
  {lang === "zh" ? "客服中心" : "Support Center"}
</button>
      </div>
    </div>
  </div>
)}

        {!loading &&
          totalOrders > 0 &&
          !allGeneratedCompleted &&
          !activeOrder && (
            <div className="rounded-[2rem] border border-yellow-400/20 bg-yellow-400/10 p-6 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-yellow-300" />
              <h2 className="text-xl font-black">
                {t.missions.stepNotAssignedTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-yellow-100/70">
                {t.missions.stepNotAssignedNote}
              </p>
            </div>
          )}

        {!loading && activeOrder && (
          <div className="space-y-5 pb-32">
            {(() => {
              const order = activeOrder;
              const firstItem = activeItems[0] || null;
              const snapshot = firstItem?.product_snapshot || {};
              const lucky = order.is_lucky_bonus;

              const images = getImages(order);
              const imageIndex = galleryIndex[order.id] || 0;
              const activeImage = images[imageIndex] || "";

              const productName =
                snapshot.name ||
                (lucky ? "Lucky Promotion Order" : "Promotion Order");

              const productCategory = snapshot.category || "Gold Jewelry";
              const productDescription = snapshot.description || "";
              const productCurrency = snapshot.currency || "USD";
              const productRating = Number(snapshot.rating || 4.8);
              const productReviews = Number(snapshot.reviews_count || 0);

              const productPrice = Number(order.order_total || 0);
              const reward = calculateDisplayReward(order);
const profitRate = Number(order.profit_rate || 0);
const craftProfile = getCraftProfile(order);
const expectedCreditText = formatCreditRange(craftProfile);
const qualityIndexText = formatWorkValueRange(craftProfile);

const luckyBoostRate = Number(order.lucky_profit_rate_percent ?? profitRate ?? 0);
const requiredCampaignBalance = Number(order.order_total || 0);

              const completed = order.status === "completed";
              const isCurrent = order.step_number === profile.current_step;

              return (
                <div
                  key={order.id}
                  className={`relative overflow-hidden rounded-[2rem] border backdrop-blur-xl ${
                    lucky
                      ? "border-yellow-300/70 bg-[radial-gradient(circle_at_top,#8a610d33_0%,#1a1202_42%,#050505_100%)] shadow-[0_0_55px_rgba(250,204,21,0.28)]"
                      : "border-white/10 bg-white/[0.05]"
                  }`}
                >
                  {lucky && (
  <>
    <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-yellow-300/20 blur-3xl" />
    <div className="pointer-events-none absolute -left-16 top-40 h-44 w-44 rounded-full bg-amber-500/10 blur-3xl" />
  </>
)}

<div className="relative z-10 border-b border-white/10 bg-black/40 p-3 backdrop-blur-xl">
  <div className="mb-3 flex items-center justify-between gap-3">
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-yellow-200/60">
        {lucky ? t.missions.luckyBonus : t.missions.standard} •{" "}
        {t.missions.step} {order.step_number}
      </p>

      <p className="mt-1 truncate text-sm font-black text-white">
        {productName}
      </p>
    </div>

<div className="shrink-0 rounded-2xl bg-black/45 px-3 py-2 text-right">
  <p className="text-[10px] uppercase tracking-wide text-white/40">
    {lucky
      ? lang === "zh"
        ? "奖励收益"
        : "Bonus Credit"
      : lang === "zh"
        ? "预计收益"
        : "Expected Credit"}
  </p>

  <p className="text-sm font-black text-yellow-300">
    {lucky ? `$${reward.toFixed(2)}` : expectedCreditText}
  </p>
</div>
  </div>

  <button
    disabled={!isCurrent || actionLoading || completed}
    onClick={() => handleCompleteGeneratedOrder(order)}
    className={`w-full rounded-2xl px-5 py-3 text-sm font-black shadow-lg active:scale-[0.98] ${
      completed
        ? "bg-emerald-400/10 text-emerald-300"
        : isCurrent && lucky
          ? "bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-600 text-black shadow-[0_0_30px_rgba(250,204,21,0.35)]"
          : isCurrent
            ? "bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 text-black shadow-[0_0_24px_rgba(250,204,21,0.28)]"
            : "bg-white/10 text-white/40"
    }`}
  >
    {completed
      ? t.missions.completed
      : isCurrent
        ? actionLoading
          ? lang === "zh"
            ? lucky
              ? "正在处理幸运推广..."
              : "正在提交推广..."
            : lucky
              ? "Processing lucky campaign..."
              : "Submitting campaign..."
          : lucky
            ? t.missions.claimLuckyBonusTask
            : t.missions.startPromotionTask
        : t.missions.locked}
  </button>
</div>

<div className="relative h-72 bg-black/40">
                    {activeImage ? (
                      <img
                        src={activeImage}
                        alt={productName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Gem className="h-20 w-20 text-yellow-300/70" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

                    <div className="absolute left-4 top-4 flex items-center gap-2">
                      <span
                        className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black backdrop-blur ${
                          lucky
                            ? "bg-gradient-to-r from-yellow-200 to-yellow-500 text-black shadow-[0_0_22px_rgba(250,204,21,0.45)]"
                            : "bg-black/65 text-white"
                        }`}
                      >
                        {lucky && <Sparkles className="h-3.5 w-3.5" />}
                        {lucky ? t.missions.luckyBonus : t.missions.standard}
                      </span>

                      <span className="rounded-full bg-black/65 px-3 py-1 text-[11px] font-bold text-white/80 backdrop-blur">
                        {t.missions.step} {order.step_number}
                      </span>
                    </div>



                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => changeGalleryImage(order, "prev")}
                          className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>

                        <button
                          onClick={() => changeGalleryImage(order, "next")}
                          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>

                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                          {images.map((image, index) => (
                            <button
                              key={`${image}-${index}`}
                              onClick={() =>
                                setGalleryIndex({
                                  ...galleryIndex,
                                  [order.id]: index,
                                })
                              }
                              className={`h-1.5 rounded-full transition-all ${
                                index === imageIndex
                                  ? "w-6 bg-yellow-300"
                                  : "w-1.5 bg-white/50"
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="p-4">
{lucky ? (
  <div className="mb-4 rounded-[1.8rem] border border-yellow-300/45 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.24),rgba(34,20,0,0.58)_48%,rgba(0,0,0,0.42)_100%)] p-4 shadow-[0_0_36px_rgba(250,204,21,0.16)]">
    <div className="mb-3 flex items-center justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-yellow-100/60">
          {lang === "zh" ? "高级奖励事件" : "Premium Bonus Event"}
        </p>

        <h3 className="mt-1 flex items-center gap-2 text-xl font-black text-white">
          <Sparkles className="h-5 w-5 text-yellow-300" />
          {lang === "zh" ? "特殊推广通道" : "Special Campaign Access"}
        </h3>
      </div>

      <div className="rounded-2xl bg-yellow-300 px-3 py-2 text-right text-black shadow-[0_0_22px_rgba(250,204,21,0.35)]">
        <p className="text-[10px] font-black uppercase">
          {lang === "zh" ? "加成倍率" : "Boost Rate"}
        </p>
        <p className="text-lg font-black">
          {luckyBoostRate.toFixed(2)}%
        </p>
      </div>
    </div>

    <p className="mb-4 text-sm leading-6 text-yellow-100/65">
      {lang === "zh"
        ? "此任务为限时高级奖励任务，需要满足对应推广余额后才能完成。"
        : "This is a premium bonus mission. The required campaign balance must be available before completion."}
    </p>

    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl bg-black/40 p-3">
        <p className="text-[10px] uppercase text-white/35">
          {lang === "zh" ? "所需推广余额" : "Required Campaign Balance"}
        </p>
        <p className="mt-1 text-sm font-black text-white">
          {productCurrency} {requiredCampaignBalance.toFixed(2)}
        </p>
      </div>

      <div className="rounded-2xl bg-yellow-300/10 p-3">
        <p className="text-[10px] uppercase text-yellow-100/45">
          {lang === "zh" ? "奖励收益" : "Bonus Credit"}
        </p>
        <p className="mt-1 text-sm font-black text-yellow-300">
          ${reward.toFixed(2)}
        </p>
      </div>
    </div>
  </div>
) : (
  <div className="mb-4 rounded-[1.6rem] border border-yellow-300/25 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.14),rgba(0,0,0,0.34)_55%)] p-4 shadow-[inset_0_0_26px_rgba(250,204,21,0.06)]">
    <div className="mb-3 flex items-center justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-100/50">
          {lang === "zh" ? "工艺评估" : "Craftsmanship Review"}
        </p>

        <h3 className="mt-1 text-xl font-black text-white">
          {lang === "zh" ? "工艺等级" : "Craft Grade"} {craftProfile.grade}
        </h3>
      </div>

      <div className="rounded-2xl bg-black/45 px-3 py-2 text-right">
        <p className="text-[10px] uppercase text-white/35">
          {lang === "zh" ? "质量评分" : "Quality Score"}
        </p>
        <p className="text-lg font-black text-yellow-300">
          {craftProfile.score}
        </p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl bg-black/35 p-3">
        <p className="text-[10px] uppercase text-white/35">
          {lang === "zh" ? "质量指数" : "Quality Index"}
        </p>
        <p className="mt-1 text-sm font-black text-white">
          {qualityIndexText}
        </p>
      </div>

      <div className="rounded-2xl bg-yellow-300/10 p-3">
        <p className="text-[10px] uppercase text-yellow-100/45">
          {lang === "zh" ? "预计收益" : "Expected Credit"}
        </p>
        <p className="mt-1 text-sm font-black text-yellow-300">
          {expectedCreditText}
        </p>
      </div>
    </div>
  </div>
)}

<div className="mb-3 flex items-start justify-between gap-3">
  <div>
    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
      {lang === "zh" ? "产品参考" : "Product Reference"}
    </p>

    <h3 className="mt-1 text-lg font-black text-white">{productName}</h3>

    <p className="mt-1 text-sm text-white/45">
      {productCategory} {t.missions.campaign}
    </p>
  </div>

  <div className="rounded-2xl bg-black/25 px-3 py-2 text-right">
    <p className="text-[10px] uppercase tracking-wide text-white/35">
      {lang === "zh" ? "产品价值" : "Product Value"}
    </p>
    <p className="font-black text-white/75">
      {productCurrency} {productPrice.toFixed(2)}
    </p>
  </div>
</div>

                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <RatingStars rating={productRating} />

                        <span className="text-sm font-black text-yellow-300">
                          {productRating.toFixed(1)}
                        </span>
                      </div>

                      <p className="text-xs text-white/45">
                        {productReviews} {t.missions.reviews}
                      </p>

                      <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-300">
                        {t.missions.verifiedProduct}
                      </span>
                    </div>

                    {productDescription && (
                      <p className="line-clamp-3 text-sm leading-6 text-white/60">
                        {productDescription}
                      </p>
                    )}

                    {activeItems.length > 0 && (
                      <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-black/25 p-3">
                        <p className="mb-2 text-xs font-black uppercase tracking-wide text-white/40">
                          Order Items
                        </p>

                        <div className="space-y-2">
                          {activeItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] px-3 py-2 text-xs"
                            >
                              <div>
                                <p className="font-bold text-white/80">
                                  {item.product_snapshot?.name || productName}
                                </p>
                                <p className="mt-0.5 text-white/40">
                                  Qty {item.quantity} × $
                                  {Number(item.unit_price || 0).toFixed(2)}
                                </p>
                              </div>

                              <p className="font-black text-yellow-300">
                                ${Number(item.subtotal || 0).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

<div className="mt-4 grid grid-cols-2 gap-3">
  <div className="rounded-2xl bg-black/30 p-3">
    <p className="text-xs text-white/45">
      {lucky
        ? lang === "zh"
          ? "所需推广余额"
          : "Required Balance"
        : lang === "zh"
          ? "质量指数"
          : "Quality Index"}
    </p>
    <p className="mt-1 font-bold text-white">
      {lucky
        ? `${productCurrency} ${requiredCampaignBalance.toFixed(2)}`
        : qualityIndexText}
    </p>
  </div>

  <div className="rounded-2xl bg-black/30 p-3">
    <p className="text-xs text-white/45">
      {lucky
        ? lang === "zh"
          ? "奖励收益"
          : "Bonus Credit"
        : lang === "zh"
          ? "预计收益"
          : "Expected Credit"}
    </p>
    <p className="mt-1 font-bold text-yellow-300">
      {lucky ? `$${reward.toFixed(2)}` : expectedCreditText}
    </p>
  </div>
</div>

                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </section>

      {showProcessingPopup && (
  <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/85 px-4 py-8 backdrop-blur-md">
    <div className="w-full max-w-md overflow-hidden rounded-[2.2rem] border border-yellow-300/40 bg-[radial-gradient(circle_at_top,#77540b_0%,#171003_42%,#050505_100%)] shadow-[0_0_80px_rgba(250,204,21,0.32)]">
      <div className="relative p-6">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-yellow-300/25 blur-3xl" />

        <div className="relative text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-yellow-200/40 bg-yellow-300/10 shadow-[0_0_35px_rgba(250,204,21,0.35)]">
            <Loader2 className="h-10 w-10 animate-spin text-yellow-300" />
          </div>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-yellow-200/65">
            {lang === "zh" ? "推广处理中" : "Promotion Processing"}
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            {activeProcessingText}
          </h2>

          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-yellow-100/60">
            {lang === "zh"
              ? "请等待系统完成当前推广任务记录。"
              : "Please wait while the campaign activity is being recorded."}
          </p>
        </div>

        <div className="relative mt-6">
          <div className="h-3 overflow-hidden rounded-full bg-black/45">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-100 shadow-[0_0_20px_rgba(250,204,21,0.45)] transition-all duration-500"
              style={{ width: `${processingProgressPercent}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-white/40">
              {lang === "zh" ? "进度" : "Progress"}
            </span>
            <span className="font-black text-yellow-300">
              {Math.round(processingProgressPercent)}%
            </span>
          </div>
        </div>

<div className="relative mt-5 grid grid-cols-2 gap-3">
  <div className="rounded-2xl bg-black/35 p-3 text-center">
    <p className="text-[10px] uppercase text-white/35">
      {isLuckyActiveOrder
        ? lang === "zh"
          ? "所需推广余额"
          : "Required Balance"
        : lang === "zh"
          ? "质量指数"
          : "Quality Index"}
    </p>
    <p className="mt-1 text-sm font-black text-yellow-300">
      {isLuckyActiveOrder
        ? `${activeOrderCurrency} ${Number(activeOrder?.order_total || 0).toFixed(2)}`
        : formatWorkValueRange(getCraftProfile(activeOrder))}
    </p>
  </div>

  <div className="rounded-2xl bg-black/35 p-3 text-center">
    <p className="text-[10px] uppercase text-white/35">
      {isLuckyActiveOrder
        ? lang === "zh"
          ? "奖励收益"
          : "Bonus Credit"
        : lang === "zh"
          ? "预估收益"
          : "Expected Credit"}
    </p>
    <p className="mt-1 text-sm font-black text-emerald-300">
      {isLuckyActiveOrder
        ? `$${calculateDisplayReward(activeOrder).toFixed(2)}`
        : formatCreditRange(getCraftProfile(activeOrder))}
    </p>
  </div>
</div>

        <div className="relative mt-5 space-y-2">
          {processingSteps.map((step, index) => {
            const active = index === processingStep;
            const done = index < processingStep;

            return (
              <div
                key={step}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-xs transition-all ${
                  done
                    ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                    : active
                      ? "border-yellow-300/35 bg-yellow-300/10 text-yellow-100"
                      : "border-white/10 bg-white/[0.03] text-white/35"
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    done
                      ? "bg-emerald-400 text-black"
                      : active
                        ? "bg-yellow-300 text-black"
                        : "bg-white/10 text-white/40"
                  }`}
                >
                  {done ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : active ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                </div>

                <span className="font-bold">{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
)}

{showInsufficientPopup && (
  <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-md">
    <div className="max-h-[calc(100vh-4rem)] w-full max-w-md overflow-y-auto rounded-[2.2rem] border border-yellow-300/40 bg-[radial-gradient(circle_at_top,#6b4c08_0%,#171003_42%,#050505_100%)] shadow-[0_0_70px_rgba(250,204,21,0.32)]">
      <div className="relative p-5">
        <button
          onClick={() => setShowInsufficientPopup(false)}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-yellow-300/20 bg-black/35 text-lg font-black text-yellow-100/70 active:scale-[0.96]"
        >
          ×
        </button>

        <div className="pointer-events-none absolute -top-20 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-yellow-300/25 blur-3xl" />

        <div className="relative flex items-start gap-3 pr-8">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-300 text-black shadow-[0_0_30px_rgba(250,204,21,0.5)]">
            <Gem className="h-7 w-7" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-yellow-200/65">
              {t.missions.balanceVerification}
            </p>

            <h2 className="mt-1 text-2xl font-black text-white">
              {t.missions.additionalCreditsRequired}
            </h2>

            <p className="mt-2 text-sm leading-6 text-yellow-100/70">
              {t.missions.insufficientPopupNote}
            </p>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-black/40 p-3">
            <p className="text-[10px] uppercase text-white/35">{t.missions.required}</p>
            <p className="mt-1 text-sm font-black text-yellow-300">
              ${insufficientInfo.required.toFixed(2)}
            </p>
          </div>

          <div className="rounded-2xl bg-black/40 p-3">
  <p className="text-[10px] uppercase text-white/35">{t.missions.balance}</p>
  <p className="mt-1 text-sm font-black text-white">
    ${insufficientInfo.balance.toFixed(2)}
  </p>
</div>

          <div className="rounded-2xl bg-black/40 p-3">
            <p className="text-[10px] uppercase text-white/35">{t.missions.needed}</p>
            <p className="mt-1 text-sm font-black text-rose-200">
              ${insufficientInfo.needed.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/deposit")}
            className="rounded-2xl bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 px-4 py-3 text-sm font-black text-black shadow-[0_0_30px_rgba(250,204,21,0.35)] active:scale-[0.98]"
          >
            {t.missions.addCredits}
          </button>

          <button
            onClick={() => router.push("/support")}
            className="rounded-2xl border border-yellow-300/25 bg-white/[0.06] px-4 py-3 text-sm font-black text-yellow-100 active:scale-[0.98]"
          >
            {t.missions.contactSupport}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{showCompletedPopup && (
  <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-md">
    <div className="max-h-[calc(100vh-4rem)] w-full max-w-md overflow-y-auto rounded-[2.2rem] border border-yellow-300/40 bg-[radial-gradient(circle_at_top,#7a560d_0%,#171003_42%,#050505_100%)] shadow-[0_0_70px_rgba(250,204,21,0.35)]">
      <div className="relative p-6 text-center">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-yellow-300/25 blur-3xl" />

        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-700 text-black shadow-[0_0_35px_rgba(250,204,21,0.55)]">
          <Trophy className="h-10 w-10" />
        </div>

        <p className="text-sm font-bold uppercase tracking-[0.22em] text-yellow-200/70">
          {completedAllOrders
            ? t.missions.campaignCompleted
            : lang === "zh"
              ? "推广任务完成"
              : "Promotion Completed"}
        </p>

        <h2 className="mt-2 text-3xl font-black text-white">
          {completedAllOrders
            ? t.missions.congratulations
            : lang === "zh"
  ? "推广收益已到账"
  : "Campaign Credit Added"}
        </h2>

        <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-yellow-100/65">
          {lang === "zh"
            ? `第 ${completedStep || "-"} 项推广任务已成功记录。`
            : `Step ${completedStep || "-"} promotion activity has been recorded successfully.`}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-[1.5rem] border border-emerald-300/25 bg-emerald-400/10 p-4">
            <p className="text-xs text-white/45">
              {lang === "zh" ? "本次推广收益" : "Campaign Credit"}
            </p>
            <p className="mt-1 text-2xl font-black text-emerald-300">
              ${completedReward}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-yellow-300/25 bg-black/35 p-4">
            <p className="text-xs text-white/45">
              {lang === "zh" ? "累计收益" : "Total Profit"}
            </p>
            <p className="mt-1 text-2xl font-black text-yellow-300">
              ${finalReward}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 text-left">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-yellow-300 text-black">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-black text-white">
                {lang === "zh" ? "账户余额已更新" : "Account Balance Updated"}
              </p>
              <p className="mt-1 text-xs leading-5 text-white/50">
                {completedAllOrders
                  ? lang === "zh"
                    ? "所有推广任务已完成，您现在可以查看记录。"
                    : "All promotion tasks are completed. You can now review your records."
                  : lang === "zh"
                    ? "您可以继续处理下一项推广任务。"
                    : "You can continue to the next promotion task."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-2xl bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 px-4 py-3 text-sm font-black text-black shadow-[0_0_30px_rgba(250,204,21,0.35)] active:scale-[0.98]"
          >
            {completedAllOrders
              ? t.missions.continue
              : lang === "zh"
                ? "继续下一项任务"
                : "Continue to Next Task"}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </AppShell>
  );
}