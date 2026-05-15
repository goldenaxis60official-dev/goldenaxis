//app>page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import LuxuryCard from "@/components/ui/LuxuryCard";
import StatCard from "@/components/ui/StatCard";
import { getLanguage, messages } from "@/i18n";
import type { Profile } from "@/types/profile";
import type { Task } from "@/types/task";
import { supabase } from "@/lib/supabaseClient";
import {
  Gem,
  Wallet,
  Users,
  ShieldCheck,
  Headphones,
  Sparkles,
  Trophy,
  PlayCircle,
  History,
  ArrowRight,
  Clock,
  Activity,
} from "lucide-react";

type UserTaskAssignment = {
  id: string;
  assigned_step: number;
  is_active: boolean;
  tasks: Task | null;
};

type RecentActivityItem = {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  tone: "gold" | "green" | "blue";
};

const quickActions = [
  { key: "startMission", icon: PlayCircle, href: "/missions" },
  { key: "deposit", icon: Wallet, href: "/deposit" },
  { key: "team", icon: Users, href: "/team" },
  { key: "history", icon: History, href: "/history" },
  { key: "support", icon: Headphones, href: "/support" },
  { key: "security", icon: ShieldCheck, href: "/terms" },
] as const;

export default function HomePage() {
  return (
    <RequireAuth>
      {(profile) => <HomeContent profile={profile} />}
    </RequireAuth>
  );
}

function HomeContent({ profile }: { profile: Profile }) {
  const router = useRouter();

  const lang = getLanguage(profile.language);
  const t = messages[lang];

  const liveText = t.home.live;
  const actionText = t.home.actionStatus;
  const recentText = t.home.recentActivity;

    const [assignments, setAssignments] = useState<UserTaskAssignment[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>([]);

  useEffect(() => {
    if (profile.role === "admin") {
      router.replace("/admin");
    }
  }, [profile.role, router]);

    useEffect(() => {
    async function loadHomeData() {
      if (profile.role === "admin") return;

      setLoadingTasks(true);

      const { data: assignmentData } = await supabase
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

      setAssignments((assignmentData || []) as unknown as UserTaskAssignment[]);
      setLoadingTasks(false);

      const activities: RecentActivityItem[] = [];

      const { data: latestHistory } = await supabase
        .from("task_history")
        .select("id, reward_amount, created_at, product_snapshot")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestHistory) {
        const snapshot = latestHistory.product_snapshot as
          | { name?: string; category?: string }
          | null;

        activities.push({
          id: `history-${latestHistory.id}`,
          title: recentText.missionRewardConfirmed,
          description: snapshot?.name
            ? `${snapshot.name} ${recentText.campaignCompleted}`
            : recentText.campaignMissionCompleted,
          status: `+$${Number(latestHistory.reward_amount || 0).toFixed(2)}`,
          created_at: latestHistory.created_at,
          tone: "green",
        });
      }

      const { data: latestWallet } = await supabase
        .from("wallet_requests")
        .select("id, type, amount, status, created_at")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestWallet) {
          activities.push({
          id: `wallet-${latestWallet.id}`,
          title:
            ["withdraw", "withdrawal"].includes(String(latestWallet.type))
              ? recentText.withdrawalRequestSubmitted
              : recentText.depositRequestSubmitted,
          description: recentText.walletReview,
          status: String(latestWallet.status || liveText.pending),
          created_at: latestWallet.created_at,
          tone: "gold",
        });
      }

      setRecentActivities(
        activities.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
    }

    loadHomeData();
    }, [profile.id, profile.role, recentText, liveText.pending]);

  if (profile.role === "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-yellow-300 border-t-transparent" />
          <p className="text-sm text-white/60">{t.home.openingAdmin}</p>
        </div>
      </main>
    );
  }

  const assignedTotal = assignments.length;
  const completedCount = Math.max(profile.current_step - 1, 0);
  const progressPercent =
    assignedTotal > 0
      ? Math.min((completedCount / assignedTotal) * 100, 100)
      : 0;

  const currentAssignment =
    assignments.find(
      (assignment) => assignment.assigned_step === profile.current_step
    ) || null;

  const nextTask = currentAssignment?.tasks || null;
  const nextProduct = nextTask?.products || null;

  const nextTaskName =
  nextProduct?.name || nextTask?.title || t.home.preparingTitle;

const nextTaskCategory =
  nextProduct?.category || nextTask?.category || t.home.pendingReview;

  const nextTaskImage =
    nextProduct?.main_image || nextTask?.image_url || "";

      const nextReward = nextTask
    ? Number(nextTask.price) *
      Number(nextTask.commission_rate) *
      Number(nextTask.multiplier)
    : 0;

  const campaignPreviewItems = assignments
    .filter((assignment) => assignment.tasks)
    .slice(0, 6);

  const missionStatusLabel = loadingTasks
    ? liveText.checking
    : assignedTotal > 0 && nextTask
      ? liveText.ready
      : assignedTotal === 0
        ? liveText.pending
        : liveText.completed;

const rawMainBalance = Number(profile.balance || 0);
const depositedBalance = Number(profile.deposited_balance || 0);
const referralBalance = Number(profile.referral_bonus_balance || 0);
const taskProfitBalance = Number(profile.task_profit_balance || 0);

const hasSplitBalances =
  profile.deposited_balance !== undefined ||
  profile.referral_bonus_balance !== undefined ||
  profile.task_profit_balance !== undefined;

const splitBalance = Number(
  (depositedBalance + referralBalance + taskProfitBalance).toFixed(2)
);

// After split-balance SQL fix, profile.balance already represents the total.
// Do not add deposited_balance again.
const homepageTotalBalance = hasSplitBalances ? splitBalance : rawMainBalance;

    const actionStatus = {
    startMission: missionStatusLabel,
    deposit: actionText.wallet,
    team: actionText.codeCenter,
    history: actionText.records,
    support: actionText.available247,
    security: `${t.home.creditScore} ${profile.credit_score}`,
  } as const;

    return (
    <AppShell>
      <section className="relative px-5 pb-4 pt-8">
        <div className="absolute right-6 top-8 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs text-yellow-200">
          {t.home.creditScore} {profile.credit_score}
        </div>

        <div className="mb-5 flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-400/40 bg-yellow-400/10 shadow-[0_0_25px_rgba(212,175,55,0.25)]">
            <div className="absolute inset-0 rounded-2xl bg-yellow-300/20 blur-xl" />
            <Gem className="relative h-6 w-6 text-yellow-300" />
          </div>

          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]" />
              <p className="text-xs font-semibold text-emerald-200">
                {liveText.centerOnline}
              </p>
            </div>

            <p className="text-sm text-yellow-200/80">{t.home.welcomeBack}</p>
            <h1 className="text-2xl font-bold tracking-tight">
              {profile.display_name || t.home.goldMember}
            </h1>
          </div>
        </div>

                <LuxuryCard className="mb-4 px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              <p className="text-sm font-black text-white/85">
                {liveText.liveCampaign}
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[11px] font-bold text-emerald-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
              {liveText.online}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 px-2 py-3 text-center">
              <p className="text-[10px] text-white/40">{liveText.support}</p>
              <p className="mt-1 text-xs font-black text-emerald-300">
                {actionText.available247}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 px-2 py-3 text-center">
              <p className="text-[10px] text-white/40">{liveText.assigned}</p>
              <p className="mt-1 text-xs font-black text-sky-300">
                {loadingTasks ? "..." : assignedTotal}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 px-2 py-3 text-center">
              <p className="text-[10px] text-white/40">{liveText.step}</p>
              <p className="mt-1 text-xs font-black text-yellow-300">
                {profile.current_step}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 px-2 py-3 text-center">
              <p className="text-[10px] text-white/40">{liveText.status}</p>
              <p className="mt-1 truncate text-xs font-black text-white">
                {missionStatusLabel}
              </p>
            </div>
          </div>

          <p className="mt-3 text-[11px] leading-5 text-white/45">
            {liveText.progressUpdates}
          </p>
        </LuxuryCard>

        <LuxuryCard goldGlow className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <p className="text-sm text-white/55">
                  {t.home.campaignBalance}
                </p>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/45">
                  {liveText.updatedJustNow}
                </span>
              </div>

              <h2 className="mt-1 text-4xl font-black tracking-tight">
  ${homepageTotalBalance.toFixed(2)}
</h2>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-yellow-300 to-yellow-600 p-3 text-black shadow-[0_12px_30px_rgba(234,179,8,0.28)]">
              <Wallet className="h-7 w-7" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
<StatCard
  label={t.home.quickActions.deposit}
  value={`$${depositedBalance.toFixed(2)}`}
  color="green"
/>

            <StatCard
              label={t.home.mission}
              value={`${completedCount} / ${assignedTotal || "-"}`}
              color="gold"
            />

            <StatCard
              label={t.home.assigned}
              value={loadingTasks ? "..." : String(assignedTotal)}
              color="blue"
            />
          </div>
        </LuxuryCard>
      </section>

      <section className="px-5 pb-5">
        <LuxuryCard className="px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              <p className="text-sm font-bold text-white/80">
                {t.home.campaignProgress}
              </p>
            </div>

            <p className="text-xs font-bold text-yellow-300">
              {assignedTotal > 0
                ? `${Math.round(progressPercent)}%`
                : liveText.awaiting}
            </p>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-200 transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs leading-5 text-white/50">
              {t.home.progressNote}
            </p>

            <p className="shrink-0 text-xs font-black text-white/70">
              {completedCount}/{assignedTotal || "-"}
            </p>
          </div>
        </LuxuryCard>
      </section>

      <section className="px-5 pb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">{t.home.nextMission}</h3>

          <div className="flex items-center gap-1 text-xs text-yellow-300">
            <Trophy className="h-4 w-4" />
            {t.common.step} {profile.current_step}
          </div>
        </div>

        {loadingTasks && (
          <LuxuryCard className="p-5 text-center text-white/55">
            {t.home.loadingMission}
          </LuxuryCard>
        )}

        {!loadingTasks && assignedTotal === 0 && (
          <LuxuryCard goldGlow className="p-5 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-400/30 bg-yellow-400/10 shadow-[0_0_30px_rgba(234,179,8,0.18)]">
              <Clock className="h-7 w-7 text-yellow-300" />
            </div>

            <h4 className="font-black">{liveText.campaignMatching}</h4>

            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-white/55">
              {t.home.preparingNote}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2 text-[9px] font-bold">
              <div className="rounded-2xl border border-white/10 bg-black/25 px-2 py-2 text-white/60">
                {liveText.verificationQueue}
              </div>

              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-2 py-2 text-emerald-200">
                {liveText.supportAvailable}
              </div>

              <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-2 py-2 text-yellow-200">
                {liveText.walletReady}
              </div>
            </div>

            <button
              onClick={() => router.push("/support")}
              className="mt-4 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-2.5 text-sm font-black text-black shadow-[0_12px_30px_rgba(234,179,8,0.25)] active:scale-[0.98]"
            >
              {t.common.contactSupport}
            </button>
          </LuxuryCard>
        )}

        {!loadingTasks && assignedTotal > 0 && !nextTask && (
          <LuxuryCard className="p-5 text-center">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-emerald-300" />
            <h4 className="font-black">{t.home.allCompleted}</h4>
            <p className="mt-2 text-sm leading-6 text-white/55">
              {t.home.allCompletedNote}
            </p>
          </LuxuryCard>
        )}

        {!loadingTasks && nextTask && (
          <LuxuryCard
            goldGlow={nextTask.task_type === "lucky_bonus"}
            className="overflow-hidden p-0"
          >
            <div className="relative h-44 bg-black/40">
              {nextTaskImage ? (
                <img
                  src={nextTaskImage}
                  alt={nextTaskName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Gem className="h-16 w-16 text-yellow-300/70" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

              <div className="absolute left-4 top-4">
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-black ${
                    nextTask.task_type === "lucky_bonus"
                      ? "bg-yellow-300 text-black"
                      : "bg-black/65 text-white"
                  }`}
                >
                  {nextTask.task_type === "lucky_bonus"
                    ? t.common.luckyBonus
                    : t.common.standard}
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-200/80">
                  {nextTaskCategory}
                </p>
                <h4 className="mt-1 line-clamp-2 text-xl font-black text-white">
                  {nextTaskName}
                </h4>
              </div>
            </div>

            <div className="p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-white/45">
                    {t.common.campaign} • {t.common.step}{" "}
                    {profile.current_step}
                  </p>
                  <p className="mt-1 text-sm font-bold text-emerald-300">
                    {missionStatusLabel}
                  </p>
                </div>

                <div className="rounded-2xl bg-black/35 px-3 py-2 text-right">
                  <p className="text-[10px] uppercase tracking-wide text-white/40">
                    {t.common.reward}
                  </p>
                  <p className="font-black text-yellow-300">
                    ${nextReward.toFixed(2)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => router.push("/missions")}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-3 text-sm font-black text-black shadow-[0_12px_30px_rgba(234,179,8,0.25)] active:scale-[0.98]"
              >
                {t.home.continueMission}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </LuxuryCard>
        )}
      </section>

            {campaignPreviewItems.length > 0 && (
        <section className="px-5 pb-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold">
  {liveText.assignedCampaigns}
</h3>

            <span className="text-xs text-yellow-300">
              {campaignPreviewItems.length}/{assignedTotal}
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {campaignPreviewItems.map((assignment) => {
              const task = assignment.tasks;
              const product = task?.products;
              const image = product?.main_image || task?.image_url || "";
              const title =
                product?.name || task?.title || t.home.preparingTitle;
              const category =
                product?.category || task?.category || t.home.pendingReview;
              const reward = task
                ? Number(task.price) *
                  Number(task.commission_rate) *
                  Number(task.multiplier)
                : 0;

              return (
                <button
                  key={assignment.id}
                  onClick={() => router.push("/missions")}
                  className="w-36 shrink-0 overflow-hidden rounded-[1.4rem] border border-white/10 bg-black/30 text-left shadow-[0_14px_35px_rgba(0,0,0,0.28)] active:scale-[0.98]"
                >
                  <div className="relative h-24 bg-black/40">
                    {image ? (
                      <img
                        src={image}
                        alt={title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Gem className="h-9 w-9 text-yellow-300/70" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                    <div className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-black text-yellow-200">
                      {t.common.step} {assignment.assigned_step}
                    </div>
                  </div>

                  <div className="p-3">
                    <p className="truncate text-[10px] font-bold uppercase tracking-wide text-yellow-200/70">
                      {category}
                    </p>

                    <p className="mt-1 line-clamp-2 min-h-[32px] text-xs font-black text-white/90">
                      {title}
                    </p>

                    <p className="mt-2 text-xs font-black text-emerald-300">
                      +${reward.toFixed(2)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="px-5 pb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">{recentText.title}</h3>
          <span className="text-xs text-yellow-300">
            {recentText.liveRecords}
          </span>
        </div>

        <LuxuryCard className="p-4">
          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                        item.tone === "green"
                          ? "bg-emerald-300/10 text-emerald-300"
                          : item.tone === "blue"
                            ? "bg-sky-300/10 text-sky-300"
                            : "bg-yellow-300/10 text-yellow-300"
                      }`}
                    >
                      <Activity className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white/85">
                        {item.title}
                      </p>

                      <p className="mt-0.5 truncate text-[11px] text-white/45">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2.5 py-1 text-[11px] font-black text-yellow-200">
                    {item.status}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-yellow-300/10 text-yellow-300">
                <Activity className="h-4 w-4" />
              </div>

              <div>
                <p className="text-sm font-black text-white/85">
                  {recentText.noActivityTitle}
                </p>

                <p className="mt-0.5 text-[10px] leading-4 text-white/45">
                  {recentText.noActivityNote}
                </p>
              </div>
            </div>
          )}
        </LuxuryCard>
      </section>

      <section className="px-5 pb-32">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">{t.home.quickAccess}</h3>
          <span className="text-xs text-yellow-300">
            {t.home.memberTools}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {quickActions.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                onClick={() => router.push(item.href)}
                className="group rounded-[1.5rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.075),rgba(255,255,255,0.025))] p-4 text-center shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition active:scale-[0.97] hover:border-yellow-400/40 hover:bg-yellow-400/10"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-700 text-black shadow-[0_10px_28px_rgba(234,179,8,0.28)] transition group-hover:scale-105">
                  <Icon className="h-6 w-6" />
                </div>

                <p className="text-xs font-black text-white/85">
                  {t.home.quickActions[item.key]}
                </p>

                <p className="mt-1 truncate text-[10px] font-semibold text-yellow-200/60">
                  {actionStatus[item.key]}
                </p>
              </button>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}