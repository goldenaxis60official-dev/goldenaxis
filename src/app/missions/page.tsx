"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";

export default function MissionsPage() {
  return (
    <RequireAuth>
      {(profile) => <MissionContent profile={profile} />}
    </RequireAuth>
  );
}

function MissionContent({ profile }: { profile: Profile }) {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [luckyTask, setLuckyTask] = useState<Task | null>(null);

  useEffect(() => {
    async function loadTasks() {
      setLoading(true);
      setErrorText("");

      const group = Math.floor((profile.current_step - 1) / 3);
      const startStep = group * 3 + 1;
      const endStep = startStep + 2;

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .gte("step_number", startStep)
        .lte("step_number", endStep)
        .eq("is_active", true)
        .order("step_number", { ascending: true });

      if (error) {
        setErrorText(error.message);
        setLoading(false);
        return;
      }

      setTasks((data || []) as Task[]);
      setLoading(false);
    }

    loadTasks();
  }, [profile.current_step]);

  async function handleCompleteMission(task: Task) {
    if (task.step_number !== profile.current_step) return;

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
        setErrorText(
          "Insufficient campaign balance. Please add demo credits to continue this mission."
        );
      } else {
        setErrorText(error.message);
      }

      setActionLoading(false);
      return;
    }

    const reward = Number(data?.commission_earned || 0).toFixed(2);
    setSuccessText(`Mission completed. Reward $${reward} added.`);

    setTimeout(() => {
      window.location.reload();
    }, 900);
  }

  const completedCount = Math.max(profile.current_step - 1, 0);
  const progressPercent = Math.min((completedCount / 80) * 100, 100);

  return (
    <AppShell>
      <section className="px-5 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">Campaign Center</p>
            <h1 className="text-2xl font-black">Missions</h1>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <Gem className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <div className="mb-5 rounded-[2rem] border border-yellow-400/20 bg-white/[0.06] p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-white/55">Current Progress</p>

            <div className="flex items-center gap-1 text-sm text-yellow-300">
              <Trophy className="h-4 w-4" />
              Step {profile.current_step} / 80
            </div>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white/[0.06] p-3">
            <p className="text-xs text-white/45">Today</p>
            <p className="mt-1 font-bold text-emerald-300">
              ${Number(profile.today_earnings).toFixed(2)}
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.06] p-3">
            <p className="text-xs text-white/45">Balance</p>
            <p className="mt-1 font-bold text-yellow-300">
              ${Number(profile.balance).toFixed(2)}
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.06] p-3">
            <p className="text-xs text-white/45">Done</p>
            <p className="mt-1 font-bold text-blue-300">{completedCount}</p>
          </div>
        </div>

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
            Loading missions...
          </div>
        )}

        {!loading && (
          <div className="space-y-4">
            {tasks.map((task) => {
              const lucky = task.task_type === "lucky_bonus";
              const reward =
                Number(task.price) *
                Number(task.commission_rate) *
                Number(task.multiplier);

              const isCurrent = task.step_number === profile.current_step;
              const completed = task.step_number < profile.current_step;
              const locked = task.step_number > profile.current_step;

              return (
                <div
                  key={task.id}
                  className={`rounded-[1.7rem] border p-4 backdrop-blur-xl ${
                    lucky
                      ? "border-yellow-400/50 bg-yellow-400/10 shadow-[0_0_35px_rgba(212,175,55,0.18)]"
                      : "border-white/10 bg-white/[0.05]"
                  } ${locked ? "opacity-50" : ""}`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                        lucky
                          ? "bg-yellow-300 text-black"
                          : "bg-white/10 text-white/70"
                      }`}
                    >
                      {lucky ? "Lucky Bonus 2x" : "Standard"}
                    </span>

                    <p className="text-sm text-white/50">
                      Step {task.step_number}
                    </p>
                  </div>

                  <h3 className="text-lg font-black">{task.title}</h3>

                  <p className="mt-1 text-sm text-white/45">
                    {task.category} Campaign
                  </p>

                  {lucky && (
                    <div className="mt-3 flex items-center gap-2 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-2 text-xs text-yellow-100/80">
                      <Sparkles className="h-4 w-4 text-yellow-300" />
                      Premium Jewel task with 2x reward multiplier.
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-black/30 p-3">
                      <p className="text-xs text-white/45">Product Value</p>
                      <p className="mt-1 font-bold text-white">
                        ${Number(task.price).toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/30 p-3">
                      <p className="text-xs text-white/45">Reward</p>
                      <p className="mt-1 font-bold text-yellow-300">
                        ${reward.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <button
                    disabled={!isCurrent || actionLoading || completed}
                    onClick={() => handleCompleteMission(task)}
                    className={`mt-4 w-full rounded-2xl px-5 py-3 text-sm font-black shadow-lg ${
                      completed
                        ? "bg-emerald-400/10 text-emerald-300"
                        : isCurrent
                        ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black"
                        : "bg-white/10 text-white/40"
                    }`}
                  >
                    {completed
                      ? "Completed"
                      : isCurrent
                      ? actionLoading
                        ? "Completing..."
                        : lucky
                        ? "Start Lucky Bonus"
                        : "Start Mission"
                      : "Locked"}
                  </button>
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
                  Lucky Jewel Campaign
                </p>
                <h2 className="text-2xl font-black">Insufficient Balance</h2>
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
                <h3 className="font-black">{luckyTask.title}</h3>
              </div>

              <p className="text-sm text-yellow-100/75">
                This premium Jewel task requires a higher campaign balance. Add
                demo credits first, then return to continue the 2x bonus task.
              </p>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-black/40 p-3">
                <p className="text-xs text-white/45">Required Value</p>
                <p className="mt-1 font-bold text-white">
                  ${Number(luckyTask.price).toFixed(2)}
                </p>
              </div>

              <div className="rounded-2xl bg-black/40 p-3">
                <p className="text-xs text-white/45">Your Balance</p>
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
              Add Demo Credits
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}