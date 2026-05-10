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
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronLeft,
  ChevronRight,
  Gem,
  ReceiptText,
  Search,
} from "lucide-react";

type TransactionFilter = "all" | "in" | "out";

function getTransactionLabel(
  type: string,
  labels: Record<string, string>
) {
  const fallbackLabels: Record<string, string> = {
    task_commission: "Promotion Order Profit",
    lucky_order_profit: "Lucky Order Profit",
    deposit_credit: "Deposit Credit",
    withdrawal: "Withdrawal Request",
    admin_adjustment: "Balance Adjustment",
  };

  return labels[type] || fallbackLabels[type] || type.replaceAll("_", " ");
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

  const ui =
    lang === "zh"
    ? {
        searchPlaceholder: "搜索交易、说明或类型...",
        newest: "最新优先",
        oldest: "最旧优先",
        amountHigh: "金额最高",
        amountLow: "金额最低",
        showing: "显示",
        of: "共",
        records: "条记录",
        page: "页",
        prev: "上一页",
        next: "下一页",
      }
    : {
        searchPlaceholder: "Search transaction, note, or type...",
        newest: "Newest First",
        oldest: "Oldest First",
        amountHigh: "Amount High",
        amountLow: "Amount Low",
        showing: "Showing",
        of: "of",
        records: "records",
        page: "Page",
        prev: "Prev",
        next: "Next",
      };

  const [transactions, setTransactions] = useState<Transaction[]>([]);
const [filter, setFilter] = useState<TransactionFilter>("all");

const [searchText, setSearchText] = useState("");
const [sortBy, setSortBy] = useState<
  "newest" | "oldest" | "amount_high" | "amount_low"
>("newest");
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(5);

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
  const keyword = searchText.trim().toLowerCase();

  const result = transactions.filter((item) => {
    const amount = Number(item.amount);

    const matchesDirection =
      filter === "all" ||
      (filter === "in" && amount >= 0) ||
      (filter === "out" && amount < 0);

    const label = getTransactionLabel(item.type, t.transactions.labels);

    const matchesSearch =
      !keyword ||
      label.toLowerCase().includes(keyword) ||
      item.type.toLowerCase().includes(keyword) ||
      item.description?.toLowerCase().includes(keyword) ||
      String(item.amount).includes(keyword);

    return matchesDirection && matchesSearch;
  });

  return [...result].sort((a, b) => {
    if (sortBy === "oldest") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }

    if (sortBy === "amount_high") {
      return Math.abs(Number(b.amount)) - Math.abs(Number(a.amount));
    }

    if (sortBy === "amount_low") {
      return Math.abs(Number(a.amount)) - Math.abs(Number(b.amount));
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}, [filter, transactions, searchText, sortBy, t.transactions.labels]);

const totalPages = Math.max(
  1,
  Math.ceil(filteredTransactions.length / pageSize)
);

const paginatedTransactions = useMemo(() => {
  const start = (currentPage - 1) * pageSize;
  return filteredTransactions.slice(start, start + pageSize);
}, [filteredTransactions, currentPage, pageSize]);

const firstResult =
  filteredTransactions.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;

const lastResult = Math.min(
  currentPage * pageSize,
  filteredTransactions.length
);

useEffect(() => {
  setCurrentPage(1);
}, [filter, searchText, sortBy, pageSize]);

useEffect(() => {
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }
}, [currentPage, totalPages]);

  const totalIn = transactions
    .filter((item) => Number(item.amount) > 0)
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const totalOut = transactions
    .filter((item) => Number(item.amount) < 0)
    .reduce((sum, item) => sum + Math.abs(Number(item.amount)), 0);

  const netChange = totalIn - totalOut;

const mainBalance = Number(profile.balance || 0);
const depositReserve = Number(profile.deposited_balance || 0);
const referralBalance = Number(profile.referral_bonus_balance || 0);
const taskProfitBalance = Number(profile.task_profit_balance || 0);

const displayBalance = mainBalance;
const luckyAvailableBalance = mainBalance + depositReserve;

const generatedProfitTotal = transactions
  .filter(
    (item) =>
      item.type === "task_commission" || item.type === "lucky_order_profit"
  )
  .reduce((sum, item) => sum + Number(item.amount || 0), 0);

const luckyProfitTotal = transactions
  .filter((item) => item.type === "lucky_order_profit")
  .reduce((sum, item) => sum + Number(item.amount || 0), 0);

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
            ${displayBalance.toFixed(2)}
          </h2>

<div className="mt-4 grid grid-cols-2 gap-2">
  <div className="rounded-2xl bg-black/30 p-3">
    <p className="text-[10px] text-white/40">
      {t.transactions.mainBalance}
    </p>
    <p className="mt-1 text-sm font-black text-yellow-300">
      ${mainBalance.toFixed(2)}
    </p>
  </div>

  <div className="rounded-2xl bg-black/30 p-3">
    <p className="text-[10px] text-white/40">
      {t.transactions.depositReserve}
    </p>
    <p className="mt-1 text-sm font-black text-white">
      ${depositReserve.toFixed(2)}
    </p>
  </div>

  <div className="rounded-2xl bg-black/30 p-3">
    <p className="text-[10px] text-white/40">
      {t.transactions.luckyAvailable}
    </p>
    <p className="mt-1 text-sm font-black text-yellow-300">
      ${luckyAvailableBalance.toFixed(2)}
    </p>
  </div>

  <div className="rounded-2xl bg-black/30 p-3">
    <p className="text-[10px] text-white/40">
      {t.transactions.profitTracker}
    </p>
    <p className="mt-1 text-sm font-black text-emerald-300">
      ${taskProfitBalance.toFixed(2)}
    </p>
  </div>

  <div className="rounded-2xl bg-black/30 p-3 md:col-span-2">
    <p className="text-[10px] text-white/40">
      {t.transactions.referralTracker}
    </p>
    <p className="mt-1 text-sm font-black text-yellow-300">
      ${referralBalance.toFixed(2)}
    </p>
  </div>
</div>

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

        {transactions.length > 0 && (
          <LuxuryCard className="mb-5 p-4">
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder={ui.searchPlaceholder}
                  className="w-full rounded-2xl border border-white/10 bg-black/35 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-yellow-400/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(
                      event.target.value as
                        | "newest"
                        | "oldest"
                        | "amount_high"
                        | "amount_low"
                    )
                  }
                  className="rounded-2xl border border-white/10 bg-black/35 px-3 py-3 text-xs font-bold text-white outline-none focus:border-yellow-400/50"
                >
                  <option className="bg-black" value="newest">
                    {ui.newest}
                  </option>
                  <option className="bg-black" value="oldest">
                    {ui.oldest}
                  </option>
                  <option className="bg-black" value="amount_high">
                    {ui.amountHigh}
                  </option>
                  <option className="bg-black" value="amount_low">
                    {ui.amountLow}
                  </option>
                </select>

                <select
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                  className="rounded-2xl border border-white/10 bg-black/35 px-3 py-3 text-xs font-bold text-white outline-none focus:border-yellow-400/50"
                >
                  <option className="bg-black" value={5}>
                    5
                  </option>
                  <option className="bg-black" value={10}>
                    10
                  </option>
                  <option className="bg-black" value={20}>
                    20
                  </option>
                </select>
              </div>

              <p className="text-center text-xs text-white/45">
                {ui.showing}{" "}
                <span className="font-black text-white">{firstResult}</span>
                {" - "}
                <span className="font-black text-white">{lastResult}</span>{" "}
                {ui.of}{" "}
                <span className="font-black text-yellow-300">
                  {filteredTransactions.length}
                </span>{" "}
                {ui.records}
              </p>
            </div>
          </LuxuryCard>
        )}

<div className="mb-5 grid grid-cols-3 gap-3">
  <StatCard
    label={t.transactions.all}
    value={String(transactions.length)}
    color="white"
  />

<StatCard
  label={t.transactions.orderProfit}
  value={`$${generatedProfitTotal.toFixed(2)}`}
  color="green"
/>

<StatCard
  label={t.transactions.luckyProfit}
  value={`$${luckyProfitTotal.toFixed(2)}`}
  color="gold"
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
          {paginatedTransactions.map((item) => {
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

        {!loading && !errorText && filteredTransactions.length > 0 && (
          <LuxuryCard className="mb-6 p-3">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
                className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white/70 disabled:opacity-35"
              >
                <ChevronLeft className="h-4 w-4" />
                {ui.prev}
              </button>

              <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black text-yellow-300">
                {ui.page} {currentPage} / {totalPages}
              </div>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white/70 disabled:opacity-35"
              >
                {ui.next}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </LuxuryCard>
        )}
      </section>
    </AppShell>
  );
}