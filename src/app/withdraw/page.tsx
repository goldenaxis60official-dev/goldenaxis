"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import {
  Download,
  Lock,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";

const methods = ["Manual Review", "Campaign Wallet", "Bank Review"];

type AssignmentRow = {
  assigned_step: number;
};

export default function WithdrawPage() {
  return (
    <RequireAuth>
      {(profile) => <WithdrawContent profile={profile} />}
    </RequireAuth>
  );
}

function WithdrawContent({ profile }: { profile: Profile }) {
  const router = useRouter();

  const [amount, setAmount] = useState(Number(profile.balance || 0));
  const [method, setMethod] = useState("Manual Review");
  const [note, setNote] = useState("");

  const [assignedTotal, setAssignedTotal] = useState(0);
  const [maxAssignedStep, setMaxAssignedStep] = useState(0);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  const [loading, setLoading] = useState(false);
  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    async function loadAssignedProgress() {
      setLoadingAssignments(true);

      const { data, error } = await supabase
        .from("user_task_assignments")
        .select("assigned_step")
        .eq("user_id", profile.id)
        .eq("is_active", true)
        .order("assigned_step", { ascending: true });

      if (error) {
        setErrorText(error.message);
        setLoadingAssignments(false);
        return;
      }

      const rows = (data || []) as AssignmentRow[];
      const highestStep = rows.reduce(
        (max, row) => Math.max(max, Number(row.assigned_step)),
        0
      );

      setAssignedTotal(rows.length);
      setMaxAssignedStep(highestStep);
      setLoadingAssignments(false);
    }

    loadAssignedProgress();
  }, [profile.id]);

  const completedCount = Math.max(profile.current_step - 1, 0);

  const completedAllAssignedMissions =
    assignedTotal > 0 && Number(profile.current_step) > maxAssignedStep;

  const hasNoAssignedTasks = !loadingAssignments && assignedTotal === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSuccessText("");
    setErrorText("");

    if (loadingAssignments) {
      setErrorText("Checking campaign progress. Please wait.");
      return;
    }

    if (hasNoAssignedTasks) {
      setErrorText(
        "Your campaign task list has not been assigned yet. Withdrawal is not available."
      );
      return;
    }

    if (!completedAllAssignedMissions) {
      setErrorText(
        "Complete all assigned campaign missions to unlock withdrawal request."
      );
      return;
    }

    if (amount <= 0) {
      setErrorText("Please enter a valid amount.");
      return;
    }

    if (amount > Number(profile.balance)) {
      setErrorText("Request amount cannot exceed your campaign balance.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("wallet_requests").insert({
      user_id: profile.id,
      type: "withdrawal",
      amount,
      method,
      note: note.trim() || null,
      status: "pending",
    });

    if (error) {
      setErrorText(error.message);
      setLoading(false);
      return;
    }

    setSuccessText("Withdrawal request submitted for admin review.");
    setNote("");
    setLoading(false);
  }

  return (
    <AppShell>
      <section className="px-5 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">Wallet Center</p>
            <h1 className="text-2xl font-black">Withdraw Request</h1>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <Download className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <div className="mb-5 rounded-[2rem] border border-yellow-400/20 bg-white/[0.06] p-5 backdrop-blur-xl">
          <p className="text-sm text-white/50">Available Campaign Balance</p>
          <h2 className="mt-2 text-4xl font-black">
            ${Number(profile.balance).toFixed(2)}
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-black/30 p-3">
              <p className="text-xs text-white/45">Mission Progress</p>
              <p className="mt-1 font-bold text-yellow-300">
                {loadingAssignments
                  ? "..."
                  : `${Math.min(completedCount, assignedTotal)} / ${
                      assignedTotal || "-"
                    }`}
              </p>
            </div>

            <div className="rounded-2xl bg-black/30 p-3">
              <p className="text-xs text-white/45">Status</p>
              <p
                className={`mt-1 font-bold ${
                  completedAllAssignedMissions
                    ? "text-emerald-300"
                    : "text-red-300"
                }`}
              >
                {completedAllAssignedMissions ? "Unlocked" : "Locked"}
              </p>
            </div>
          </div>

          {hasNoAssignedTasks && (
            <div className="mt-4 flex gap-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-100/80">
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" />
              <p>
                Your campaign task list is still preparing. Withdrawal becomes
                available after admin assigns and you complete your missions.
              </p>
            </div>
          )}

          {!hasNoAssignedTasks && !completedAllAssignedMissions && (
            <div className="mt-4 flex gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100/80">
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
              <p>
                Withdrawal request unlocks after all assigned campaign missions
                are completed.
              </p>
            </div>
          )}

          {completedAllAssignedMissions && (
            <div className="mt-4 flex gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100/80">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              <p>
                Your assigned campaign sequence is complete. You can submit a
                withdrawal request for admin review.
              </p>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className={`rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl ${
            !completedAllAssignedMissions ? "opacity-60" : ""
          }`}
        >
          <div className="mb-5">
            <p className="mb-3 font-bold">Request Amount</p>

            <input
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
              type="number"
              min="1"
              step="0.01"
              disabled={!completedAllAssignedMissions}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="mb-5">
            <p className="mb-3 font-bold">Method</p>

            <select
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              disabled={!completedAllAssignedMissions}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-400/50 disabled:cursor-not-allowed"
            >
              {methods.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="mb-5">
            <p className="mb-3 font-bold">Note Optional</p>

            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={!completedAllAssignedMissions}
              placeholder="Write note for admin..."
              className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50 disabled:cursor-not-allowed"
            />
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

          <button
            disabled={loading || !completedAllAssignedMissions}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-5 w-5" />
            {loading ? "Submitting..." : "Submit Withdrawal Request"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/wallet-records?type=withdrawal")}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 font-bold text-white/75"
          >
            <ClipboardList className="h-5 w-5" />
            View Withdrawal Records
          </button>
        </form>
      </section>
    </AppShell>
  );
}