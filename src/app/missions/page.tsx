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

function MissionContent({ profile }: { profile: Profile }) {
  const router = useRouter();

  const lang = getLanguage(profile.language);
  const t = messages[lang];

  const [orders, setOrders] = useState<GeneratedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [showCompletedPopup, setShowCompletedPopup] = useState(false);
const [showInsufficientPopup, setShowInsufficientPopup] = useState(false);
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

  const activeReward = activeOrder ? Number(activeOrder.profit_amount || 0) : 0;

  const totalProfitAmount = useMemo(() => {
  return orders.reduce(
    (sum, order) => sum + Number(order.profit_amount || 0),
    0
  );
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

  const availableBalance =
    Number(profile.deposited_balance || 0) +
    Number(profile.referral_bonus_balance || 0) +
    Number(profile.task_profit_balance || 0);

  const fallbackBalance =
    availableBalance > 0 ? availableBalance : Number(profile.balance || 0);

  const orderTotal = Number(order.order_total || 0);

  if (fallbackBalance < orderTotal) {
  setErrorText(t.missions.insufficientBalance);
  setShowInsufficientPopup(true);
  return;
}

  setActionLoading(true);
  setErrorText("");
  setSuccessText("");

  const { data, error } = await supabase.rpc("complete_generated_order");

    if (error) {
      if (error.message.includes("no_generated_orders")) {
        setErrorText(t.missions.noAssignedTasks);
      } else if (error.message.includes("current_generated_order_not_found")) {
        setErrorText(t.missions.stepNotAssignedTitle);
      } else if (error.message.includes("account_not_active")) {
  setErrorText(t.missions.assignedTaskNotFound);
} else if (error.message.includes("insufficient_balance")) {
  setErrorText(t.missions.insufficientBalance);
  setShowInsufficientPopup(true);
} else {
  setErrorText(error.message);
}

      setActionLoading(false);
      return;
    }

    const reward = Number(data?.profit_amount || 0);

const totalProfitAfterComplete = orders.reduce((sum, item) => {
  const profit = Number(item.profit_amount || 0);

  if (item.id === order.id) {
    return sum + reward;
  }

  return sum + profit;
}, 0);

setFinalReward(totalProfitAfterComplete.toFixed(2));

    const allCompleted = Boolean(data?.all_completed);

    if (allCompleted || order.step_number >= maxStep) {
      setShowCompletedPopup(true);
      setActionLoading(false);
      return;
    }

    setSuccessText(
  t.missions.successCompleted.replace("${reward}", `$${reward.toFixed(2)}`)
);

    setTimeout(() => {
      window.location.reload();
    }, 900);
  }

  const activeItems = activeOrder ? getOrderItems(activeOrder) : [];
  const earnBalance = Number(profile.task_profit_balance || 0);
const referralBalance = Number(profile.referral_bonus_balance || 0);
const depositBalance = Number(profile.deposited_balance || 0);

const splitTotalBalance = earnBalance + referralBalance + depositBalance;

const displayTotalBalance =
  splitTotalBalance > 0 ? splitTotalBalance : Number(profile.balance || 0);

const isInsufficientBalanceError =
  errorText === t.missions.insufficientBalance;

const requiredBalance = Number(activeOrder?.order_total || 0);
const balanceShortage = Math.max(requiredBalance - displayTotalBalance, 0);

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
                {t.missions.reward}
              </p>
              <p className="font-black text-yellow-300">
                ${activeReward.toFixed(2)}
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
    label="Earn"
    value={`$${earnBalance.toFixed(2)}`}
    color="green"
  />

  <StatCard
    label="Referral"
    value={`$${referralBalance.toFixed(2)}`}
    color="blue"
  />

  <StatCard
    label="Deposit"
    value={`$${depositBalance.toFixed(2)}`}
    color="gold"
  />

  <StatCard
    label="Balance"
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
          Balance Verification
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
          ${requiredBalance.toFixed(2)}
        </p>
      </div>

      <div className="rounded-2xl bg-black/35 p-3">
        <p className="text-[10px] uppercase text-white/35">Balance</p>
        <p className="mt-1 text-sm font-black text-white">
          ${displayTotalBalance.toFixed(2)}
        </p>
      </div>

      <div className="rounded-2xl bg-black/35 p-3">
        <p className="text-[10px] uppercase text-white/35">Needed</p>
        <p className="mt-1 text-sm font-black text-rose-200">
          ${balanceShortage.toFixed(2)}
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
  <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-500/10 p-6 text-center">
    <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-300" />

    <h2 className="text-xl font-black">Congratulations</h2>

    <div className="mx-auto mt-4 max-w-xs rounded-[1.5rem] border border-yellow-300/25 bg-black/35 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
        Total Profit Earned
      </p>

      <p className="mt-2 text-3xl font-black text-yellow-300">
        ${totalProfitAmount.toFixed(2)}
      </p>
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
              const reward = Number(order.profit_amount || 0);
              const profitRate = Number(order.profit_rate || 0);

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
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black">{productName}</h3>

                        <p className="mt-1 text-sm text-white/45">
                          {productCategory} {t.missions.campaign}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-black/35 px-3 py-2 text-right">
                        <p className="text-[10px] uppercase tracking-wide text-white/40">
                          {t.missions.value}
                        </p>
                        <p className="font-black text-yellow-300">
                          {productCurrency} {productPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {lucky && (
  <div className="mb-4 rounded-[1.4rem] border border-yellow-300/25 bg-yellow-300/10 p-3 shadow-[inset_0_0_22px_rgba(250,204,21,0.08)]">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-black shadow-[0_0_18px_rgba(250,204,21,0.35)]">
          <Sparkles className="h-4 w-4" />
        </div>

        <div>
          <p className="text-sm font-black text-yellow-100">
            {t.missions.specialBonusUnlocked}
          </p>
          <p className="mt-0.5 text-xs text-yellow-100/55">
            {t.missions.premiumJewelOpportunity}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-black/40 px-3 py-2 text-right">
        <p className="text-[10px] font-black uppercase text-yellow-100/50">
          {t.missions.boost}
        </p>
        <p className="text-sm font-black text-yellow-300">
          {profitRate.toFixed(2)}%
        </p>
      </div>
    </div>
  </div>
)}

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

                    {lucky && (
                      <div className="mt-4 rounded-[1.5rem] border border-yellow-300/30 bg-gradient-to-r from-yellow-400/15 to-amber-600/10 p-4 shadow-[inset_0_0_25px_rgba(250,204,21,0.08)]">
                        <div className="mb-2 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-300 text-black">
                            <Sparkles className="h-4 w-4" />
                          </div>

                          <div>
                            <p className="text-sm font-black text-yellow-100">
                              {t.missions.luckyBonusCampaign}
                            </p>
                            <p className="text-xs text-yellow-100/55">
                              {t.missions.luckyBonusNote}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-2xl bg-black/35 p-2">
                            <p className="text-[10px] text-white/40">
                              {t.missions.type}
                            </p>
                            <p className="font-black text-yellow-300">
                              {t.missions.special}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-black/35 p-2">
                            <p className="text-[10px] text-white/40">
                              {t.missions.boost}
                            </p>
                            <p className="font-black text-yellow-300">
                              {profitRate.toFixed(2)}%
                            </p>
                          </div>

                          <div className="rounded-2xl bg-black/35 p-2">
                            <p className="text-[10px] text-white/40">
                              {t.missions.reward}
                            </p>
                            <p className="font-black text-yellow-300">
                              ${reward.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
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
                          {t.missions.campaignValue}
                        </p>
                        <p className="mt-1 font-bold text-white">
                          ${Number(order.order_total).toFixed(2)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-black/30 p-3">
                        <p className="text-xs text-white/45">
                          {t.missions.reward}
                        </p>
                        <p className="mt-1 font-bold text-yellow-300">
                          ${reward.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <button
                      disabled={!isCurrent || actionLoading || completed}
                      onClick={() => handleCompleteGeneratedOrder(order)}
                      className={`mt-4 w-full rounded-2xl px-5 py-3 text-sm font-black shadow-lg ${
                        completed
                          ? "bg-emerald-400/10 text-emerald-300"
                          : isCurrent && lucky
                            ? "bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-600 text-black shadow-[0_0_30px_rgba(250,204,21,0.35)]"
                            : isCurrent
                              ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black"
                              : "bg-white/10 text-white/40"
                      }`}
                    >
                      {completed
                        ? t.missions.completed
                        : isCurrent
                          ? actionLoading
                            ? t.missions.completing
                            : lucky
                              ? t.missions.claimLuckyBonusTask
                              : t.missions.startPromotionTask
                          : t.missions.locked}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </section>

{showInsufficientPopup && (
  <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-md">
    <div className="max-h-[calc(100vh-4rem)] w-full max-w-md overflow-y-auto rounded-[2.2rem] border border-yellow-300/40 bg-[radial-gradient(circle_at_top,#6b4c08_0%,#171003_42%,#050505_100%)] shadow-[0_0_70px_rgba(250,204,21,0.32)]">
      <div className="relative p-5">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-yellow-300/25 blur-3xl" />

        <div className="relative flex items-start gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-300 text-black shadow-[0_0_30px_rgba(250,204,21,0.5)]">
            <Gem className="h-7 w-7" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-yellow-200/65">
              Balance Verification
            </p>

            <h2 className="mt-1 text-2xl font-black text-white">
              Additional credits required
            </h2>

            <p className="mt-2 text-sm leading-6 text-yellow-100/70">
              This premium mission requires more campaign balance before it can be completed.
            </p>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-black/40 p-3">
            <p className="text-[10px] uppercase text-white/35">Required</p>
            <p className="mt-1 text-sm font-black text-yellow-300">
              ${requiredBalance.toFixed(2)}
            </p>
          </div>

          <div className="rounded-2xl bg-black/40 p-3">
            <p className="text-[10px] uppercase text-white/35">Balance</p>
            <p className="mt-1 text-sm font-black text-white">
              ${displayTotalBalance.toFixed(2)}
            </p>
          </div>

          <div className="rounded-2xl bg-black/40 p-3">
            <p className="text-[10px] uppercase text-white/35">Needed</p>
            <p className="mt-1 text-sm font-black text-rose-200">
              ${balanceShortage.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/deposit")}
            className="rounded-2xl bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 px-4 py-3 text-sm font-black text-black shadow-[0_0_30px_rgba(250,204,21,0.35)] active:scale-[0.98]"
          >
            Add Credits
          </button>

          <button
            onClick={() => setShowInsufficientPopup(false)}
            className="rounded-2xl border border-yellow-300/25 bg-white/[0.06] px-4 py-3 text-sm font-black text-yellow-100 active:scale-[0.98]"
          >
            Not Now
          </button>
        </div>

        <button
          onClick={() => router.push("/support")}
          className="relative mt-3 w-full rounded-2xl bg-black/35 px-4 py-3 text-sm font-bold text-white/65 active:scale-[0.98]"
        >
          Contact Support
        </button>
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
                {t.missions.campaignCompleted}
              </p>

              <h2 className="mt-2 text-3xl font-black text-white">
                {t.missions.congratulations}
              </h2>

              <div className="mt-5 rounded-[1.5rem] border border-yellow-300/25 bg-black/35 p-4">
                <p className="text-xs text-white/45">
                  Total Profit Earned
                </p>
                <p className="mt-1 text-2xl font-black text-yellow-300">
                  ${finalReward}
                </p>
              </div>

              <div className="mt-5">
  <button
    onClick={() => window.location.reload()}
    className="w-full rounded-2xl bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 px-4 py-3 text-sm font-black text-black shadow-[0_0_30px_rgba(250,204,21,0.35)]"
  >
    Continue
  </button>
</div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}