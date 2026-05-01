"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import {
  Wallet,
  AlertCircle,
  CheckCircle,
  BadgeDollarSign,
} from "lucide-react";

const amounts = [100, 300, 500, 1000, 1500, 3000];

export default function DepositPage() {
  return (
    <RequireAuth>
      {(profile) => <DepositContent profile={profile} />}
    </RequireAuth>
  );
}

function DepositContent({ profile }: { profile: any }) {
  const [amount, setAmount] = useState(100);
  const [method, setMethod] = useState("Demo Credit");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setSuccessText("");
    setErrorText("");

    const { error } = await supabase.from("wallet_requests").insert({
      user_id: profile.id,
      type: "deposit_credit",
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

    setSuccessText("Credit request submitted. Please wait for admin review.");
    setNote("");
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
          <p className="text-sm text-white/50">Current Campaign Balance</p>
          <h2 className="mt-2 text-4xl font-black">
            ${Number(profile.balance).toFixed(2)}
          </h2>

          <div className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-100/80">
            These are campaign/demo credits for the platform simulation.
            Requests require admin approval before balance changes.
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl"
        >
          <div className="mb-5">
            <p className="mb-3 font-bold">Select Amount</p>

            <div className="grid grid-cols-3 gap-3">
              {amounts.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAmount(value)}
                  className={`rounded-2xl border px-3 py-4 font-black ${
                    amount === value
                      ? "border-yellow-400 bg-yellow-400 text-black"
                      : "border-white/10 bg-black/30 text-white/75"
                  }`}
                >
                  ${value}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <p className="mb-3 font-bold">Method</p>

            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-400/50"
            >
              <option>Demo Credit</option>
              <option>Campaign Credit</option>
              <option>Manual Review</option>
            </select>
          </div>

          <div className="mb-5">
            <p className="mb-3 font-bold">Note Optional</p>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Write note for admin..."
              className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
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
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:opacity-60"
          >
            <BadgeDollarSign className="h-5 w-5" />
            {loading ? "Submitting..." : "Submit Credit Request"}
          </button>
        </form>
      </section>
    </AppShell>
  );
}