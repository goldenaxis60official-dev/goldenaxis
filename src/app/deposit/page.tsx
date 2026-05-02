"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import {
  Wallet,
  AlertCircle,
  CheckCircle,
  BadgeDollarSign,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";

const amounts = [100, 300, 500, 1000, 1500, 3000];

export default function DepositPage() {
  return (
    <RequireAuth>
      {(profile) => <DepositContent profile={profile} />}
    </RequireAuth>
  );
}

function DepositContent({ profile }: { profile: Profile }) {
  const router = useRouter();

  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState("");
  const [method, setMethod] = useState("Campaign Credit");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");

  const finalAmount = customAmount
    ? Number(customAmount)
    : Number(amount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSuccessText("");
    setErrorText("");

    if (!finalAmount || finalAmount <= 0) {
      setErrorText("Please enter a valid credit amount.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("wallet_requests").insert({
      user_id: profile.id,
      type: "deposit_credit",
      amount: finalAmount,
      method,
      note: note.trim() || null,
      status: "pending",
    });

    if (error) {
      setErrorText(error.message);
      setLoading(false);
      return;
    }

    setSuccessText("Credit request submitted. Please wait for admin review.");
    setNote("");
    setCustomAmount("");
    setLoading(false);
  }

  return (
    <AppShell>
      <section className="px-5 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">Wallet Center</p>
            <h1 className="text-2xl font-black">Deposit Credits</h1>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <Wallet className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <div className="mb-5 rounded-[2rem] border border-yellow-400/20 bg-white/[0.06] p-5 backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-white/50">Current Campaign Balance</p>
              <h2 className="mt-2 text-4xl font-black">
                ${Number(profile.balance).toFixed(2)}
              </h2>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-yellow-300 to-yellow-600 p-3 text-black">
              <BadgeDollarSign className="h-7 w-7" />
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" />
            <p className="text-sm leading-6 text-yellow-100/80">
              Deposit requests are reviewed by admin before credits are added to
              your campaign balance.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl"
        >
          <div className="mb-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-bold">Select Amount</p>
              <p className="text-xs text-yellow-300">
                Selected: ${finalAmount > 0 ? finalAmount.toFixed(2) : "0.00"}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {amounts.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setAmount(value);
                    setCustomAmount("");
                  }}
                  className={`rounded-2xl border px-3 py-4 font-black ${
                    !customAmount && amount === value
                      ? "border-yellow-400 bg-yellow-400 text-black"
                      : "border-white/10 bg-black/30 text-white/75"
                  }`}
                >
                  ${value}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <input
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
                type="number"
                min="1"
                step="0.01"
                placeholder="Or enter custom amount"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
              />
            </div>
          </div>

          <div className="mb-5">
            <p className="mb-3 font-bold">Request Method</p>

            <select
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-400/50"
            >
              <option>Campaign Credit</option>
              <option>Demo Credit</option>
              <option>Manual Review</option>
            </select>
          </div>

          <div className="mb-5">
            <p className="mb-3 font-bold">Note Optional</p>

            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Write note for admin..."
              className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
            />
          </div>

          <div className="mb-5 rounded-[1.5rem] border border-white/10 bg-black/30 p-4">
            <p className="text-xs text-white/45">Request Summary</p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-white/40">Amount</p>
                <p className="mt-1 font-black text-yellow-300">
                  ${finalAmount > 0 ? finalAmount.toFixed(2) : "0.00"}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">Status</p>
                <p className="mt-1 font-black text-blue-300">Pending Review</p>
              </div>
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

          <button
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:opacity-60"
          >
            <BadgeDollarSign className="h-5 w-5" />
            {loading ? "Submitting..." : "Submit Credit Request"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/wallet-records?type=deposit_credit")}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 font-bold text-white/75"
          >
            <ClipboardList className="h-5 w-5" />
            View Deposit Records
          </button>
        </form>
      </section>
    </AppShell>
  );
}