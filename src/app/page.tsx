//app>page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import LuxuryCard from "@/components/ui/LuxuryCard";
import StatCard from "@/components/ui/StatCard";
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
} from "lucide-react";

type UserTaskAssignment = {
  id: string;
  assigned_step: number;
  is_active: boolean;
  tasks: Task | null;
};

const quickActions = [
  { label: "Start Mission", icon: PlayCircle, href: "/missions" },
  { label: "History", icon: History, href: "/history" },
  { label: "Deposit", icon: Wallet, href: "/deposit" },
  { label: "Team", icon: Users, href: "/team" },
  { label: "Security", icon: ShieldCheck, href: "/terms" },
  { label: "Support", icon: Headphones, href: "/support" },
];

export default function HomePage() {
  return (
    <RequireAuth>
      {(profile) => <HomeContent profile={profile} />}
    </RequireAuth>
  );
}

function HomeContent({ profile }: { profile: Profile }) {
  const router = useRouter();

  const [assignments, setAssignments] = useState<UserTaskAssignment[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    if (profile.role === "admin") {
      router.replace("/admin");
    }
  }, [profile.role, router]);

  useEffect(() => {
    async function loadAssignedTasks() {
      if (profile.role === "admin") return;

      setLoadingTasks(true);

      const { data } = await supabase
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

      setAssignments((data || []) as unknown as UserTaskAssignment[]);
      setLoadingTasks(false);
    }

    loadAssignedTasks();
  }, [profile.id, profile.role]);

  if (profile.role === "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-yellow-300 border-t-transparent" />
          <p className="text-sm text-white/60">Opening admin control...</p>
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
    nextProduct?.name || nextTask?.title || "Campaign List Preparing";

  const nextTaskCategory =
    nextProduct?.category || nextTask?.category || "Pending Review";

  const nextTaskImage =
    nextProduct?.main_image || nextTask?.image_url || "";

  const nextReward = nextTask
    ? Number(nextTask.price) *
      Number(nextTask.commission_rate) *
      Number(nextTask.multiplier)
    : 0;

  return (
    <AppShell>
      <section className="relative px-5 pb-6 pt-8">
        <div className="absolute right-6 top-8 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs text-yellow-200">
          Credit Score {profile.credit_score}
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-400/40 bg-yellow-400/10 shadow-[0_0_25px_rgba(212,175,55,0.25)]">
            <Gem className="h-6 w-6 text-yellow-300" />
          </div>

          <div>
            <p className="text-sm text-yellow-200/80">Welcome back</p>
            <h1 className="text-2xl font-bold tracking-tight">
              {profile.display_name || "Gold Member"}
            </h1>
          </div>
        </div>

        <LuxuryCard goldGlow className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-white/55">Campaign Balance</p>
              <h2 className="mt-1 text-4xl font-black tracking-tight">
                ${Number(profile.balance).toFixed(2)}
              </h2>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-yellow-300 to-yellow-600 p-3 text-black">
              <Wallet className="h-7 w-7" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Today"
              value={`$${Number(profile.today_earnings).toFixed(2)}`}
              color="green"
            />

            <StatCard
              label="Mission"
              value={`${completedCount} / ${assignedTotal || "-"}`}
              color="gold"
            />

            <StatCard
              label="Assigned"
              value={loadingTasks ? "..." : String(assignedTotal)}
              color="blue"
            />
          </div>
        </LuxuryCard>
      </section>

      <section className="px-5">
        <LuxuryCard className="px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              <p className="text-sm font-bold text-white/80">
                Campaign Progress
              </p>
            </div>

            <p className="text-xs text-yellow-300">
              Step {profile.current_step}
            </p>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="mt-3 text-xs leading-5 text-white/50">
            Complete assigned gold and jewel campaign missions to unlock rewards.
          </p>
        </LuxuryCard>
      </section>

      <section className="px-5 py-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">Quick Access</h3>
          <span className="text-xs text-yellow-300">Member Tools</span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {quickActions.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                onClick={() => router.push(item.href)}
                className="group rounded-[1.5rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.075),rgba(255,255,255,0.025))] p-4 text-center shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition active:scale-[0.97] hover:border-yellow-400/40 hover:bg-yellow-400/10"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-700 text-black shadow-[0_10px_28px_rgba(234,179,8,0.28)] transition group-hover:scale-105">
                  <Icon className="h-6 w-6" />
                </div>

                <p className="text-xs font-medium text-white/80">
                  {item.label}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="px-5 pb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">Next Mission</h3>

          <div className="flex items-center gap-1 text-xs text-yellow-300">
            <Trophy className="h-4 w-4" />
            Step {profile.current_step}
          </div>
        </div>

        {loadingTasks && (
          <LuxuryCard className="p-5 text-center text-white/55">
            Loading mission preview...
          </LuxuryCard>
        )}

        {!loadingTasks && assignedTotal === 0 && (
          <LuxuryCard goldGlow className="p-5 text-center">
            <Clock className="mx-auto mb-3 h-10 w-10 text-yellow-300" />
            <h4 className="font-black">Campaign List Preparing</h4>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-white/55">
  Your personalized campaign list is being prepared. Please wait for assignment
  or contact support for review.
</p>

<button
  onClick={() => router.push("/support")}
  className="mt-5 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-3 text-sm font-black text-black shadow-[0_12px_30px_rgba(234,179,8,0.25)] active:scale-[0.98]"
>
  Contact Support
</button>
          </LuxuryCard>
        )}

        {!loadingTasks && assignedTotal > 0 && !nextTask && (
          <LuxuryCard className="p-5 text-center">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-emerald-300" />
            <h4 className="font-black">All Missions Completed</h4>
            <p className="mt-2 text-sm leading-6 text-white/55">
              You have completed all assigned campaign missions.
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
                    ? "Lucky Bonus"
                    : "Standard"}
                </span>
              </div>
            </div>

            <div className="p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-black">{nextTaskName}</h4>
                  <p className="mt-1 text-sm text-white/45">
                    {nextTaskCategory} Campaign
                  </p>
                </div>

                <div className="rounded-2xl bg-black/35 px-3 py-2 text-right">
                  <p className="text-[10px] uppercase tracking-wide text-white/40">
                    Reward
                  </p>
                  <p className="font-black text-yellow-300">
                    ${nextReward.toFixed(2)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => router.push("/missions")}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-3 text-sm font-black text-black"
              >
                Continue Mission
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </LuxuryCard>
        )}
      </section>
    </AppShell>
  );
}