//app>missions>page.tsx

"use client";

import LuxuryCard from "@/components/ui/LuxuryCard";
import StatCard from "@/components/ui/StatCard";
import { useEffect, useState } from "react";
import { getLanguage, messages } from "@/i18n";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import type { Task } from "@/types/task";
import type { Profile } from "@/types/profile";
import {
  Gem,
  Trophy,
  AlertCircle,
  CheckCircle,
  X,
  Sparkles,
  Wallet,
  Star,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";

type UserTaskAssignment = {
  id: string;
  assigned_step: number;
  is_active: boolean;
  tasks: Task | null;
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


  const [visibleAssignments, setVisibleAssignments] = useState<
    UserTaskAssignment[]
  >([]);

  const [assignedTotal, setAssignedTotal] = useState(0);
  const [maxAssignedStep, setMaxAssignedStep] = useState(0);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [showCompletedPopup, setShowCompletedPopup] = useState(false);
  const [finalReward, setFinalReward] = useState("0.00");

  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [luckyTask, setLuckyTask] = useState<Task | null>(null);

  const [galleryIndex, setGalleryIndex] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadAssignedTasks() {
      setLoading(true);
      setErrorText("");

      const { data, error } = await supabase
        .from("user_task_assignments")
        .select(
          `
          id,
          assigned_step,
          is_active,
          tasks (
            *,
            products (*)
          )
        `
        )
        .eq("user_id", profile.id)
        .eq("is_active", true)
        .order("assigned_step", { ascending: true });

      if (error) {
        setErrorText(error.message);
        setLoading(false);
        return;
      }

      const rows = (data || []) as unknown as UserTaskAssignment[];

const visibleRows = rows.filter(
  (row) => row.assigned_step === profile.current_step && row.tasks
);

const maxStep = rows.reduce(
  (max, row) => Math.max(max, row.assigned_step),
  0
);

      setVisibleAssignments(visibleRows);
      setAssignedTotal(rows.length);
      setMaxAssignedStep(maxStep);
      setLoading(false);
    }

    loadAssignedTasks();
  }, [profile.id, profile.current_step]);

  function getImages(task: Task) {
    const product = task.products;

    const productImages = Array.isArray(product?.images)
      ? product.images.filter(Boolean)
      : [];

    const mainImage = product?.main_image || task.image_url || "";

    const images = mainImage
      ? [mainImage, ...productImages.filter((image) => image !== mainImage)]
      : productImages;

    return images;
  }

  function changeGalleryImage(task: Task, direction: "prev" | "next") {
    const images = getImages(task);
    if (images.length <= 1) return;

    const currentIndex = galleryIndex[task.id] || 0;

    const nextIndex =
      direction === "next"
        ? (currentIndex + 1) % images.length
        : (currentIndex - 1 + images.length) % images.length;

    setGalleryIndex({
      ...galleryIndex,
      [task.id]: nextIndex,
    });
  }

  async function handleCompleteMission(task: Task, assignedStep: number) {
    if (assignedStep !== profile.current_step) return;

    setActionLoading(true);
    setErrorText("");
    setSuccessText("");

    const { data, error } = await supabase.rpc("complete_current_task");

    if (error) {
      if (
        error.message.includes("insufficient_balance") &&
        task.task_type === "lucky_bonus"
      ) {
        setLuckyTask(task);
        setActionLoading(false);
        return;
      }

      if (error.message.includes("insufficient_balance")) {
        setErrorText(t.missions.insufficientBalance);
      } else if (error.message.includes("no_assigned_tasks")) {
        setErrorText(t.missions.noAssignedTasks);
      } else if (error.message.includes("all_assigned_missions_completed")) {
        setErrorText(t.missions.allAssignedCompletedError);
      } else if (error.message.includes("assigned_task_not_found")) {
        setErrorText(t.missions.assignedTaskNotFound);
      } else {
        setErrorText(error.message);
      }

      setActionLoading(false);
      return;
    }

    const reward = Number(data?.commission_earned || 0).toFixed(2);
setFinalReward(reward);

if (assignedStep >= maxAssignedStep) {
  setShowCompletedPopup(true);
  setActionLoading(false);
  return;
}

setSuccessText(
  t.missions.successCompleted.replace("${reward}", `$${reward}`)
);

setTimeout(() => {
  window.location.reload();
}, 900);
  }

  const completedCount = Math.max(profile.current_step - 1, 0);
  const progressBase = assignedTotal || 1;
  const progressPercent = Math.min((completedCount / progressBase) * 100, 100);
    const allAssignedCompleted =
    assignedTotal > 0 && profile.current_step > maxAssignedStep;

  const activeAssignment = visibleAssignments[0] || null;
  const activeTask = activeAssignment?.tasks || null;

  const activeReward = activeTask
    ? Number(activeTask.price) *
      Number(activeTask.commission_rate) *
      Number(activeTask.multiplier)
    : 0;

  const missionStatusLabel = loading
    ? t.common.loading
    : assignedTotal === 0
      ? t.missions.preparingTitle
      : allAssignedCompleted
        ? t.missions.allCompletedTitle
        : activeTask
          ? t.missions.startPromotionTask
          : t.missions.stepNotAssignedTitle;

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
                {t.missions.step} {profile.current_step} /{" "}
                {assignedTotal || "-"}
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
              {completedCount}/{assignedTotal || "-"} {t.missions.completed}
            </span>

            <span className="font-black text-yellow-300">
              {Math.round(progressPercent)}%
            </span>
          </div>
        </LuxuryCard>

        <div className="mb-4 grid grid-cols-3 gap-3">
          <StatCard
            label={t.missions.today}
            value={`$${Number(profile.today_earnings).toFixed(2)}`}
            color="green"
          />

          <StatCard
            label={t.missions.balance}
            value={`$${Number(profile.balance).toFixed(2)}`}
            color="gold"
          />

          <StatCard
            label={t.missions.assigned}
            value={String(assignedTotal)}
            color="blue"
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

        {errorText && (
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

        {!loading && assignedTotal === 0 && (
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

        {!loading && allAssignedCompleted && (
          <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-500/10 p-6 text-center">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-300" />
            <h2 className="text-xl font-black">{t.missions.allCompletedTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">
              {t.missions.allCompletedNote}
            </p>
          </div>
        )}

        {!loading &&
          assignedTotal > 0 &&
          !allAssignedCompleted &&
          visibleAssignments.length === 0 && (
            <div className="rounded-[2rem] border border-yellow-400/20 bg-yellow-400/10 p-6 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-yellow-300" />
              <h2 className="text-xl font-black">{t.missions.stepNotAssignedTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-yellow-100/70">
                {t.missions.stepNotAssignedNote}
              </p>
            </div>
          )}

        {!loading && visibleAssignments.length > 0 && (
          <div className="space-y-5 pb-32">
            {visibleAssignments.map((assignment) => {
              const task = assignment.tasks;
              if (!task) return null;

              const product = task.products;
              const lucky = task.task_type === "lucky_bonus";

              const images = getImages(task);
              const imageIndex = galleryIndex[task.id] || 0;
              const activeImage = images[imageIndex] || "";

              const productName = product?.name || task.title;
              const productCategory = product?.category || task.category;
              const productDescription =
                product?.description || task.description || "";
              const productCurrency = product?.currency || "USD";
              const productPrice = Number(task.price);
              const productRating = Number(product?.rating || 4.8);
              const productReviews = Number(product?.reviews_count || 0);

              const reward =
  Number(task.price) *
  Number(task.commission_rate) *
  Number(task.multiplier);

const bonusMultiplier = Number(task.multiplier || 1);
const bonusPercent = Math.max((bonusMultiplier - 1) * 100, 0);

const isCurrent =
  assignment.assigned_step === profile.current_step;
const completed =
  assignment.assigned_step < profile.current_step;
const locked = assignment.assigned_step > profile.current_step;

              return (
                <div
                  key={assignment.id}
                  className={`relative overflow-hidden rounded-[2rem] border backdrop-blur-xl ${
  lucky
    ? "border-yellow-300/70 bg-[radial-gradient(circle_at_top,#8a610d33_0%,#1a1202_42%,#050505_100%)] shadow-[0_0_55px_rgba(250,204,21,0.28)]"
    : "border-white/10 bg-white/[0.05]"
} ${locked ? "opacity-50" : ""}`}
                >
                {lucky && (
  <>
    <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-yellow-300/20 blur-3xl" />
    <div className="pointer-events-none absolute -left-16 top-40 h-44 w-44 rounded-full bg-amber-500/10 blur-3xl" />
  </>
)}
                  <div className="relative h-64 bg-black/40">
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
    {lucky
  ? `${t.missions.luckyBonus} ${bonusMultiplier.toFixed(1)}x`
  : t.missions.standard}
  </span>

  <span className="rounded-full bg-black/65 px-3 py-1 text-[11px] font-bold text-white/80 backdrop-blur">
    {t.missions.step} {assignment.assigned_step}
  </span>
</div>

{lucky && (
  <div className="absolute bottom-4 left-4 right-4 rounded-[1.4rem] border border-yellow-300/30 bg-black/55 p-3 backdrop-blur-md">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-yellow-200/70">
          {t.missions.specialBonusUnlocked}
        </p>
        <p className="mt-1 text-sm font-black text-yellow-100">
          {t.missions.premiumJewelOpportunity}
        </p>
      </div>

      <div className="rounded-2xl bg-yellow-300 px-3 py-2 text-center text-black">
        <p className="text-[10px] font-black">{t.missions.boost}</p>
        <p className="text-sm font-black">+{bonusPercent.toFixed(0)}%</p>
      </div>
    </div>
  </div>
)}

                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => changeGalleryImage(task, "prev")}
                          className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>

                        <button
                          onClick={() => changeGalleryImage(task, "next")}
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
                                  [task.id]: index,
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

                      {product && (
                        <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-300">
                          {t.missions.verifiedProduct}
                        </span>
                      )}
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
        <p className="text-[10px] text-white/40">{t.missions.multiplier}</p>
        <p className="font-black text-yellow-300">
          {bonusMultiplier.toFixed(1)}x
        </p>
      </div>

      <div className="rounded-2xl bg-black/35 p-2">
        <p className="text-[10px] text-white/40">{t.missions.bonus}</p>
        <p className="font-black text-yellow-300">
          +{bonusPercent.toFixed(0)}%
        </p>
      </div>

      <div className="rounded-2xl bg-black/35 p-2">
        <p className="text-[10px] text-white/40">{t.missions.type}</p>
        <p className="font-black text-yellow-300">{t.missions.special}</p>
      </div>
    </div>
  </div>
)}

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-black/30 p-3">
                        <p className="text-xs text-white/45">{t.missions.campaignValue}</p>
                        <p className="mt-1 font-bold text-white">
                          ${Number(task.price).toFixed(2)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-black/30 p-3">
                        <p className="text-xs text-white/45">{t.missions.reward}</p>
                        <p className="mt-1 font-bold text-yellow-300">
                          ${reward.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <button
                      disabled={!isCurrent || actionLoading || completed}
                      onClick={() =>
                        handleCompleteMission(task, assignment.assigned_step)
                      }
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
            })}
          </div>
        )}
      </section>

      {luckyTask && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 px-4 pb-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-yellow-400/30 bg-[#090909] p-5 shadow-[0_0_50px_rgba(212,175,55,0.25)]">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-sm text-yellow-200/80">
                  {t.missions.luckyJewelCampaign}
                </p>
                <h2 className="text-2xl font-black">{t.missions.insufficientBalanceTitle}</h2>
              </div>

              <button
                onClick={() => setLuckyTask(null)}
                className="rounded-2xl bg-white/10 p-3 text-white/70"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 rounded-[1.5rem] border border-yellow-400/20 bg-yellow-400/10 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Gem className="h-5 w-5 text-yellow-300" />
                <h3 className="font-black">
                  {luckyTask.products?.name || luckyTask.title}
                </h3>
              </div>

              <p className="text-sm text-yellow-100/75">
                {t.missions.luckyInsufficientNote}
              </p>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-black/40 p-3">
                <p className="text-xs text-white/45">{t.missions.requiredValue}</p>
                <p className="mt-1 font-bold text-white">
                  ${Number(luckyTask.price).toFixed(2)}
                </p>
              </div>

              <div className="rounded-2xl bg-black/40 p-3">
                <p className="text-xs text-white/45">{t.missions.yourBalance}</p>
                <p className="mt-1 font-bold text-red-300">
                  ${Number(profile.balance).toFixed(2)}
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push("/deposit")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black"
            >
              <Wallet className="h-5 w-5" />
              {t.missions.addCredits}
            </button>
          </div>
        </div>
      )}

      {showCompletedPopup && (
  <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 px-4 pb-4 backdrop-blur-md">
    <div className="w-full max-w-md overflow-hidden rounded-[2.2rem] border border-yellow-300/40 bg-[radial-gradient(circle_at_top,#7a560d_0%,#171003_42%,#050505_100%)] shadow-[0_0_70px_rgba(250,204,21,0.35)]">
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

        <p className="mt-3 text-sm leading-6 text-yellow-100/75">
          {t.missions.completedPopupNote}
        </p>

        <div className="mt-5 rounded-[1.5rem] border border-yellow-300/25 bg-black/35 p-4">
          <p className="text-xs text-white/45">{t.missions.finalMissionReward}</p>
          <p className="mt-1 text-2xl font-black text-yellow-300">
            ${finalReward}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white/80"
          >
            {t.missions.viewStatus}
          </button>

          <button
            onClick={() => router.push("/withdraw")}
            className="rounded-2xl bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 px-4 py-3 text-sm font-black text-black shadow-[0_0_30px_rgba(250,204,21,0.35)]"
          >
            {t.missions.withdrawNow}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </AppShell>
  );
}