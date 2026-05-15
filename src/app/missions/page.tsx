//src>app>missions>page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { getLanguage, messages } from "@/i18n";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import InsufficientBalanceModal from "./components/InsufficientBalanceModal";
import ProcessingMissionModal from "./components/ProcessingMissionModal";
import CompletedMissionModal from "./components/CompletedMissionModal";
import CampaignCompletedCard from "./components/CampaignCompletedCard";
import MissionEmptyState from "./components/MissionEmptyState";
import MissionHeader from "./components/MissionHeader";
import CampaignProgressCard from "./components/CampaignProgressCard";
import CampaignBalanceCard from "./components/CampaignBalanceCard";
import ActiveMissionCard from "./components/ActiveMissionCard";
import {
  AlertCircle,
  CheckCircle,
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

function getUsableCampaignBalance() {
  const rawMainBalance = Number(profile.balance || 0);
  const deposited = Number(profile.deposited_balance || 0);
  const referral = Number(profile.referral_bonus_balance || 0);
  const profit = Number(profile.task_profit_balance || 0);

  const hasSplitBalances =
    profile.deposited_balance !== undefined ||
    profile.referral_bonus_balance !== undefined ||
    profile.task_profit_balance !== undefined;

  if (hasSplitBalances) {
    return Number((deposited + referral + profit).toFixed(2));
  }

  return Number(rawMainBalance.toFixed(2));
}

  async function handleCompleteGeneratedOrder(order: GeneratedOrder) {
  if (order.step_number !== profile.current_step) return;

 const orderTotal = Number(order.order_total || 0);

const availableForOrder = getUsableCampaignBalance();

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

const mainBalance = getUsableCampaignBalance();
const todayEarnings = Number(profile.today_earnings || 0);

const displayTotalBalance = mainBalance;
const availableForLuckyRequirement = mainBalance;
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

const insufficientProfitPreview = calculateDisplayReward(activeOrder);

  return (
    <AppShell>
<section className="px-5 pb-5 pt-8">
  <MissionHeader
    campaignCenter={t.missions.campaignCenter}
    title={t.missions.title}
  />

<CampaignProgressCard
  currentProgressLabel={t.missions.currentProgress}
  statusLabel={missionStatusLabel}
  stepLabel={t.missions.step}
  currentStep={allGeneratedCompleted ? maxStep || "-" : profile.current_step}
  totalOrders={totalOrders || "-"}
  craftGradeLabel={lang === "zh" ? "工艺评级" : "Craft Grade"}
  grade={activeCraftProfile.grade}
  scoreLabel={lang === "zh" ? "评分" : "Score"}
  score={activeCraftProfile.score || "-"}
  progressPercent={progressPercent}
  completedCount={completedCount}
  completedLabel={t.missions.completed}
/>

<CampaignBalanceCard
  requiredAmountLabel={t.missions.requiredAmount}
  requiredAmountValue={requiredDisplayValue}
  missionLabel={t.missions.mission}
  missionStatus={missionCardStatus}
  missionColor={balanceShortage > 0 ? "blue" : "green"}
  todayLabel={t.missions.today}
  todayEarnings={todayEarnings}
  totalBalanceLabel={t.missions.totalBalance}
  totalBalance={displayTotalBalance}
/>
      </section>

      <section className="px-5 pb-6">
        {successText && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle className="h-4 w-4" />
            {successText}
          </div>
        )}

{errorText && isInsufficientBalanceError && (
  <InsufficientBalanceModal
    open={showInsufficientPopup}
    balanceVerification={t.missions.balanceVerification}
    required={insufficientInfo.required}
    profit={insufficientProfitPreview}
    needed={insufficientInfo.needed}
    onAddCredits={() => router.push("/deposit")}
    onContactSupport={() => router.push("/support")}
    onClose={() => {
      setShowInsufficientPopup(false);
      setErrorText("");
    }}
  />
)}

{errorText && !isInsufficientBalanceError && (
  <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
    <AlertCircle className="h-4 w-4" />
    {errorText}
  </div>
)}

{loading && (
  <MissionEmptyState
    state="loading"
    title={t.missions.loadingAssigned}
  />
)}

{!loading && totalOrders === 0 && (
  <MissionEmptyState
    state="preparing"
    title={t.missions.preparingTitle}
    note={t.missions.preparingNote}
    buttonLabel={t.missions.contactSupport}
    onButtonClick={() => router.push("/support")}
  />
)}

{!loading && allGeneratedCompleted && (
  <CampaignCompletedCard
    lang={lang}
    completedCount={completedCount}
    totalOrders={totalOrders}
    totalProfitAmount={totalProfitAmount}
    onViewHistory={() => router.push("/history")}
    onOpenSupport={() => router.push("/support")}
  />
)}

{!loading &&
  totalOrders > 0 &&
  !allGeneratedCompleted &&
  !activeOrder && (
    <MissionEmptyState
      state="missing"
      title={t.missions.stepNotAssignedTitle}
      note={t.missions.stepNotAssignedNote}
    />
  )}

{!loading && activeOrder && (
  <ActiveMissionCard
    order={activeOrder}
    activeItems={activeItems}
    currentStep={profile.current_step}
    actionLoading={actionLoading}
    lang={lang}
    t={t}
    galleryIndex={galleryIndex}
    setGalleryIndex={setGalleryIndex}
    getImages={getImages}
    changeGalleryImage={changeGalleryImage}
    calculateDisplayReward={calculateDisplayReward}
    getCraftProfile={getCraftProfile}
    formatCreditRange={formatCreditRange}
    formatWorkValueRange={formatWorkValueRange}
    onComplete={handleCompleteGeneratedOrder}
  />
)}
      </section>

      <ProcessingMissionModal
        open={showProcessingPopup}
        title={lang === "zh" ? "推广处理中" : "Promotion Processing"}
        currentStepText={activeProcessingText}
        progressPercent={processingProgressPercent}
      />

      <CompletedMissionModal
        open={showCompletedPopup}
        title={
          completedAllOrders
            ? t.missions.congratulations
            : lang === "zh"
              ? "推广收益已到账"
              : "Campaign Credit Added"
        }
        subtitle={
          completedAllOrders
            ? lang === "zh"
              ? "您的全部推广任务已成功完成。"
              : "Your full promotion campaign has been completed successfully."
            : lang === "zh"
              ? `第 ${completedStep || "-"} 步推广收益已成功加入您的账户。`
              : `Step ${completedStep || "-"} campaign credit has been added to your account.`
        }
        creditAdded={Number(completedReward || 0)}
        totalProfit={Number(finalReward || 0)}
        updatedBalance={displayTotalBalance + Number(completedReward || 0)}
        onClose={() => {
          setShowCompletedPopup(false);
          window.location.reload();
        }}
        onViewHistory={() => router.push("/history")}
      />
    </AppShell>
  );
}