"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import {
  Download,
  Lock,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";
import type { Profile } from "@/types/profile";

const methods = ["Manual Review", "Campaign Wallet", "Bank Review"];

export default function WithdrawPage() {
  return (
    <RequireAuth>
      {(profile) => <WithdrawContent profile={profile} />}
    </RequireAuth>
  );
}

function WithdrawContent({ profile }: { profile: Profile }) {
  const [amount, setAmount] = useState(Number(profile.balance || 0));
  const [method, setMethod] = useState("Manual Review");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");

  const completedAllMissions = Number(profile.current_step) >= 81;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setSuccessText("");
    setErrorText("");

    if (!completedAllMissions) {
      setErrorText("Complete all 80 campaign missions to unlock withdrawal request.");
      setLoading(false);
      return;
    }

    if (amount <= 0) {
      setErrorText("Please enter a valid amount.");
      setLoading(false);
      return;
    }

    if (amount > Number(profile.balance)) {
      setErrorText("Request amount cannot exceed your campaign balance.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("wallet_requests").insert({
      user_id: profile.id,
      type: "withdrawal",
      amount,
      method,
      note,
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
                {Math.min(profile.current_step - 1, 80)} / 80
              </p>
            </div>

            <div className="rounded-2xl bg-black/30 p-3">
              <p className="text-xs text-white/45">Status</p>
              <p
                className={`mt-1 font-bold ${
                  completedAllMissions ? "text-emerald-300" : "text-red-300"
                }`}
              >
                {completedAllMissions ? "Unlocked" : "Locked"}
              </p>
            </div>
          </div>

          {!completedAllMissions && (
            <div className="mt-4 flex gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100/80">
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
              <p>
                Withdrawal request unlocks after all 80 campaign missions are
                completed. This keeps the simulation sequence consistent.
              </p>
            </div>
          )}

          {completedAllMissions && (
            <div className="mt-4 flex gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100/80">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              <p>
                Your campaign sequence is complete. You can submit a withdrawal
                request for admin review.
              </p>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className={`rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl ${
            !completedAllMissions ? "opacity-60" : ""
          }`}
        >
          <div className="mb-5">
            <p className="mb-3 font-bold">Request Amount</p>

            <input
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              type="number"
              min="1"
              step="0.01"
              disabled={!completedAllMissions}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="mb-5">
            <p className="mb-3 font-bold">Method</p>

            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              disabled={!completedAllMissions}
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
              onChange={(e) => setNote(e.target.value)}
              disabled={!completedAllMissions}
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
            disabled={loading || !completedAllMissions}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-5 w-5" />
            {loading ? "Submitting..." : "Submit Withdrawal Request"}
          </button>
        </form>
      </section>
    </AppShell>
  );
}