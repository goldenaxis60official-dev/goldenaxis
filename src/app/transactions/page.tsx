"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import type { Transaction } from "@/types/transaction";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Gem,
  AlertCircle,
  ReceiptText,
} from "lucide-react";

function getTransactionLabel(type: string) {
  const labels: Record<string, string> = {
    task_purchase: "Task Purchase",
    task_return: "Task Return",
    task_commission: "Task Commission",
    lucky_bonus: "Lucky Bonus",
    referral_reward: "Team Reward",
    deposit_credit_approved: "Credit Approved",
    withdrawal_requested: "Withdrawal Request",
    admin_adjustment: "Admin Adjustment",
  };

  return labels[type] || type.replaceAll("_", " ");
}

function isPositiveAmount(amount: number) {
  return Number(amount) >= 0;
}

export default function TransactionsPage() {
  return (
    <RequireAuth>
      {() => <TransactionsContent />}
    </RequireAuth>
  );
}

function TransactionsContent() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    async function loadTransactions() {
      setLoading(true);
      setErrorText("");

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setErrorText(error.message);
        setLoading(false);
        return;
      }

      setTransactions((data || []) as Transaction[]);
      setLoading(false);
    }

    loadTransactions();
  }, []);

  const totalIn = transactions
    .filter((t) => Number(t.amount) > 0)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalOut = transactions
    .filter((t) => Number(t.amount) < 0)
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  return (
    <AppShell>
      <section className="px-5 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">Wallet Ledger</p>
            <h1 className="text-2xl font-black">Transaction Details</h1>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <ReceiptText className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
            <p className="text-xs text-white/45">Records</p>
            <p className="mt-1 font-bold text-white">{transactions.length}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
            <p className="text-xs text-white/45">Credit In</p>
            <p className="mt-1 font-bold text-emerald-300">
              ${totalIn.toFixed(2)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
            <p className="text-xs text-white/45">Credit Out</p>
            <p className="mt-1 font-bold text-red-300">
              ${totalOut.toFixed(2)}
            </p>
          </div>
        </div>

        {loading && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 text-center text-white/60">
            Loading transactions...
          </div>
        )}

        {errorText && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="h-4 w-4" />
            {errorText}
          </div>
        )}

        {!loading && !errorText && transactions.length === 0 && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center">
            <Gem className="mx-auto mb-3 h-9 w-9 text-yellow-300" />
            <p className="font-bold">No transactions yet</p>
            <p className="mt-2 text-sm text-white/50">
              Complete a mission to create your first wallet record.
            </p>
          </div>
        )}

        <div className="space-y-4 pb-6">
          {transactions.map((item) => {
            const amount = Number(item.amount);
            const positive = isPositiveAmount(amount);

            return (
              <div
                key={item.id}
                className="rounded-[1.7rem] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        positive
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "bg-red-400/10 text-red-300"
                      }`}
                    >
                      {positive ? (
                        <ArrowDownCircle className="h-6 w-6" />
                      ) : (
                        <ArrowUpCircle className="h-6 w-6" />
                      )}
                    </div>

                    <div>
                      <h3 className="font-black">
                        {getTransactionLabel(item.type)}
                      </h3>

                      <p className="mt-1 text-xs text-white/45">
                        {new Date(item.created_at).toLocaleString()}
                      </p>

                      {item.description && (
                        <p className="mt-2 text-sm text-white/55">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <p
                    className={`shrink-0 font-black ${
                      positive ? "text-emerald-300" : "text-red-300"
                    }`}
                  >
                    {positive ? "+" : "-"}${Math.abs(amount).toFixed(2)}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-black/30 p-3">
                    <p className="text-xs text-white/45">Before</p>
                    <p className="mt-1 font-bold text-white/70">
                      ${Number(item.balance_before).toFixed(2)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-black/30 p-3">
                    <p className="text-xs text-white/45">After</p>
                    <p className="mt-1 font-bold text-yellow-300">
                      ${Number(item.balance_after).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}