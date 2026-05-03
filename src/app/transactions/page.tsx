//app>transactions>page.tsx

"use client";

import LuxuryCard from "@/components/ui/LuxuryCard";
import { getLanguage, messages } from "@/i18n";
import StatCard from "@/components/ui/StatCard";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import type { Transaction } from "@/types/transaction";
import type { Profile } from "@/types/profile";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Gem,
  AlertCircle,
  ReceiptText,
} from "lucide-react";

type TransactionFilter = "all" | "in" | "out";

function getTransactionLabel(
  type: string,
  labels: Record<string, string>
) {
  return labels[type] || type.replaceAll("_", " ");
}

function isPositiveAmount(amount: number) {
  return Number(amount) >= 0;
}

export default function TransactionsPage() {
  return (
    <RequireAuth>
      {(profile) => <TransactionsContent profile={profile} />}
    </RequireAuth>
  );
}

function TransactionsContent({ profile }: { profile: Profile }) {
  const lang = getLanguage(profile.language);
  const t = messages[lang];

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<TransactionFilter>("all");

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    async function loadTransactions() {
      setLoading(true);
      setErrorText("");

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", profile.id)
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
  }, [profile.id]);

  const filteredTransactions = useMemo(() => {
    if (filter === "in") {
      return transactions.filter((item) => Number(item.amount) >= 0);
    }

    if (filter === "out") {
      return transactions.filter((item) => Number(item.amount) < 0);
    }

    return transactions;
  }, [filter, transactions]);

  const totalIn = transactions
    .filter((item) => Number(item.amount) > 0)
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const totalOut = transactions
    .filter((item) => Number(item.amount) < 0)
    .reduce((sum, item) => sum + Math.abs(Number(item.amount)), 0);

  const netChange = totalIn - totalOut;

  return (
    <AppShell>
      <section className="px-5 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">{t.transactions.walletLedger}</p>
            <h1 className="text-2xl font-black">{t.transactions.transactionDetails}</h1>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <ReceiptText className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <LuxuryCard goldGlow className="mb-5 p-5">
          <p className="text-sm text-white/50">{t.transactions.currentBalance}</p>
          <h2 className="mt-2 text-3xl font-black">
            ${Number(profile.balance).toFixed(2)}
          </h2>

          <div className="mt-4 grid grid-cols-3 gap-3">
  <StatCard
    label={t.transactions.creditIn}
    value={`$${totalIn.toFixed(2)}`}
    color="green"
  />

  <StatCard
    label={t.transactions.creditOut}
    value={`$${totalOut.toFixed(2)}`}
    color="red"
  />

  <StatCard
    label={t.transactions.net}
    value={`$${netChange.toFixed(2)}`}
    color={netChange >= 0 ? "gold" : "red"}
  />
</div>
        </LuxuryCard>

        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
  { label: t.transactions.all, value: "all" },
  { label: t.transactions.creditIn, value: "in" },
  { label: t.transactions.creditOut, value: "out" },
].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value as TransactionFilter)}
              className={`rounded-2xl border px-3 py-3 text-sm font-bold ${
                filter === item.value
                  ? "border-yellow-400 bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 text-black shadow-[0_10px_25px_rgba(234,179,8,0.24)]"
: "border-white/10 bg-white/[0.06] text-white/65 hover:bg-white/[0.08]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3">
  <StatCard label={t.transactions.all} value={String(transactions.length)} color="white" />

  <StatCard
    label={t.transactions.showing}
    value={String(filteredTransactions.length)}
    color="gold"
  />

  <StatCard
    label={t.transactions.today}
    value={`$${Number(profile.today_earnings).toFixed(2)}`}
    color="green"
  />
</div>

        {loading && (
          <LuxuryCard className="p-5 text-center text-white/60">
  {t.transactions.loading}
</LuxuryCard>
        )}

        {errorText && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="h-4 w-4" />
            {errorText}
          </div>
        )}

        {!loading && !errorText && filteredTransactions.length === 0 && (
          <LuxuryCard goldGlow className="p-6 text-center">
            <Gem className="mx-auto mb-3 h-9 w-9 text-yellow-300" />
            <p className="font-bold">{t.transactions.noTransactionsTitle}</p>
            <p className="mt-2 text-sm text-white/50">
              {t.transactions.noTransactionsNote}
            </p>
          </LuxuryCard>
        )}

        <div className="space-y-4 pb-6">
          {filteredTransactions.map((item) => {
            const amount = Number(item.amount);
            const positive = isPositiveAmount(amount);

            return (
              <LuxuryCard key={item.id} className="p-4">
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
                        {getTransactionLabel(item.type, t.transactions.labels)}
                      </h3>

                      <p className="mt-1 text-xs text-white/45">
                        {new Date(item.created_at).toLocaleString()}
                      </p>

                      {item.description && (
                        <p className="mt-2 text-sm leading-6 text-white/55">
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
                    <p className="text-xs text-white/45">{t.transactions.before}</p>
                    <p className="mt-1 font-bold text-white/70">
                      ${Number(item.balance_before).toFixed(2)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-black/30 p-3">
                    <p className="text-xs text-white/45">{t.transactions.after}</p>
                    <p className="mt-1 font-bold text-yellow-300">
                      ${Number(item.balance_after).toFixed(2)}
                    </p>
                  </div>
                </div>
              </LuxuryCard>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}