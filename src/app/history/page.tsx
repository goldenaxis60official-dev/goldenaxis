//src>app>history>page.tsx

"use client";

import LuxuryCard from "@/components/ui/LuxuryCard";
import { getLanguage, messages } from "@/i18n";
import StatCard from "@/components/ui/StatCard";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Gem,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import type { Profile } from "@/types/profile";

type GeneratedSnapshot = {
  id?: string | null;
  name?: string | null;
  category?: string | null;
  price?: number | string | null;
  original_price?: number | string | null;
  custom_lucky_amount?: number | string | null;
  currency?: string | null;
  rating?: number | string | null;
  reviews_count?: number | string | null;
  description?: string | null;
  main_image?: string | null;
  images?: string[] | null;
  tier?: string | null;
  product_type?: string | null;
};

type GeneratedOrderItem = {
  id: string;
  product_snapshot: GeneratedSnapshot;
  unit_price: number;
  quantity: number;
  subtotal: number;
};

type TransactionPreview = {
  reference_id: string | null;
  balance_before: number | null;
  balance_after: number | null;
};

type GeneratedHistoryRow = {
  id: string;
  step_number: number;
  order_total: number;
  profit_rate: number;
  profit_amount: number;
  lucky_profit_rate_percent: number | null;
  lucky_profit_amount: number;
  order_type: "normal" | "lucky";
  status: "pending" | "completed" | "cancelled";
  is_lucky_bonus: boolean;
  created_at: string;
  completed_at: string | null;
  user_generated_order_items?: GeneratedOrderItem[];
  transaction?: TransactionPreview | null;
};

export default function HistoryPage() {
  return (
    <RequireAuth>
      {(profile) => <HistoryContent profile={profile} />}
    </RequireAuth>
  );
}

function HistoryContent({ profile }: { profile: Profile }) {
  const lang = getLanguage(profile.language);
  const t = messages[lang];

  const ui =
    lang === "zh"
      ? {
          searchPlaceholder: "搜索订单、产品或步骤...",
          allTypes: "全部类型",
          newest: "最新优先",
          oldest: "最旧优先",
          commissionHigh: "收益最高",
          valueHigh: "价值最高",
          showing: "显示",
          of: "共",
          records: "条记录",
          noMatchTitle: "没有匹配记录",
          noMatchNote: "请尝试其他关键词或更改筛选条件。",
          page: "页",
          prev: "上一页",
          next: "下一页",
        }
      : {
          searchPlaceholder: "Search order, product, or step...",
          allTypes: "All Types",
          newest: "Newest First",
          oldest: "Oldest First",
          commissionHigh: "Profit High",
          valueHigh: "Value High",
          showing: "Showing",
          of: "of",
          records: "records",
          noMatchTitle: "No matching records",
          noMatchNote: "Try another keyword or change the filters.",
          page: "Page",
          prev: "Prev",
          next: "Next",
        };

  const [history, setHistory] = useState<GeneratedHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "standard" | "lucky_bonus"
  >("all");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "commission_high" | "value_high"
  >("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setErrorText("");

      const { data, error } = await supabase
        .from("user_generated_orders")
        .select(
          `
          id,
          step_number,
          order_total,
          profit_rate,
          profit_amount,
          lucky_profit_rate_percent,
          lucky_profit_amount,
          order_type,
          status,
          is_lucky_bonus,
          created_at,
          completed_at,
          user_generated_order_items (
            id,
            product_snapshot,
            unit_price,
            quantity,
            subtotal
          )
        `
        )
        .eq("user_id", profile.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(50); // <- This single line stops infinite data growth

      if (error) {
        setErrorText(error.message);
        setLoading(false);
        return;
      }

      const rows = (data || []) as unknown as GeneratedHistoryRow[];
      const orderIds = rows.map((row) => row.id);

      let transactionMap = new Map<string, TransactionPreview>();

      if (orderIds.length > 0) {
        const { data: txData } = await supabase
          .from("transactions")
          .select("reference_id, balance_before, balance_after")
          .eq("user_id", profile.id)
          .in("reference_id", orderIds)
          .in("type", ["task_commission", "lucky_order_profit"]);

        transactionMap = new Map(
          ((txData || []) as TransactionPreview[])
            .filter((tx) => tx.reference_id)
            .map((tx) => [tx.reference_id as string, tx])
        );
      }

      setHistory(
        rows.map((row) => ({
          ...row,
          transaction: transactionMap.get(row.id) || null,
        }))
      );

      setLoading(false);
    }

    loadHistory();
  }, [profile.id]);

  function getItems(item: GeneratedHistoryRow) {
    return item.user_generated_order_items || [];
  }

  function getFirstSnapshot(item: GeneratedHistoryRow) {
    return getItems(item)[0]?.product_snapshot || {};
  }

function isLuckyHistory(item: GeneratedHistoryRow) {
  return item.is_lucky_bonus || item.order_type === "lucky";
}

function getHistoryProfit(item: GeneratedHistoryRow) {
  if (isLuckyHistory(item)) {
    const luckyProfit = Number(item.lucky_profit_amount || 0);

    if (luckyProfit > 0) {
      return luckyProfit;
    }

    return Number(item.profit_amount || 0);
  }

  return Number(item.profit_amount || 0);
}

function getHistoryProfitRate(item: GeneratedHistoryRow) {
  if (isLuckyHistory(item)) {
    return Number(item.lucky_profit_rate_percent ?? item.profit_rate ?? 0);
  }

  return Number(item.profit_rate || 0);
}

  const filteredHistory = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    const result = history.filter((item) => {
      const snapshot = getFirstSnapshot(item);
const lucky = isLuckyHistory(item);

      const productName =
        snapshot?.name || `${t.history.step} ${item.step_number}`;

      const productCategory =
        snapshot?.category || t.history.campaign;

      const matchesSearch =
        !keyword ||
        String(item.step_number).includes(keyword) ||
        item.status.toLowerCase().includes(keyword) ||
        productName.toLowerCase().includes(keyword) ||
        productCategory.toLowerCase().includes(keyword);

      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "lucky_bonus" && lucky) ||
        (typeFilter === "standard" && !lucky);

      return matchesSearch && matchesType;
    });

    return [...result].sort((a, b) => {
      const aTime = new Date(a.completed_at || a.created_at).getTime();
      const bTime = new Date(b.completed_at || b.created_at).getTime();

      if (sortBy === "oldest") {
        return aTime - bTime;
      }

if (sortBy === "commission_high") {
  return getHistoryProfit(b) - getHistoryProfit(a);
}

      if (sortBy === "value_high") {
        return Number(b.order_total || 0) - Number(a.order_total || 0);
      }

      return bTime - aTime;
    });
  }, [history, searchText, typeFilter, sortBy, t.history.step, t.history.campaign]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));

  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredHistory.slice(start, start + pageSize);
  }, [filteredHistory, currentPage, pageSize]);

  const firstResult =
    filteredHistory.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;

  const lastResult = Math.min(currentPage * pageSize, filteredHistory.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, typeFilter, sortBy, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <AppShell>
      <section className="px-5 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">
              {t.history.missionLedger}
            </p>
            <h1 className="text-2xl font-black">
              {t.history.historicalRecord}
            </h1>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <Gem className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3">
          <StatCard
            label={t.history.all}
            value={String(history.length)}
            color="white"
          />

          <StatCard
            label={t.history.completed}
            value={String(history.filter((h) => h.status === "completed").length)}
            color="green"
          />

          <StatCard
            label={t.history.bonus}
            value={String(history.filter((h) => isLuckyHistory(h)).length)}
            color="gold"
          />
        </div>

        {history.length > 0 && (
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

              <div className="grid grid-cols-3 gap-2">
                <select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(
                      event.target.value as
                        | "all"
                        | "standard"
                        | "lucky_bonus"
                    )
                  }
                  className="rounded-2xl border border-white/10 bg-black/35 px-3 py-3 text-xs font-bold text-white outline-none focus:border-yellow-400/50"
                >
                  <option className="bg-black" value="all">
                    {ui.allTypes}
                  </option>
                  <option className="bg-black" value="standard">
                    {t.history.standard}
                  </option>
                  <option className="bg-black" value="lucky_bonus">
                    {t.history.luckyBonus}
                  </option>
                </select>

                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(
                      event.target.value as
                        | "newest"
                        | "oldest"
                        | "commission_high"
                        | "value_high"
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
                  <option className="bg-black" value="commission_high">
                    {ui.commissionHigh}
                  </option>
                  <option className="bg-black" value="value_high">
                    {ui.valueHigh}
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
                  {filteredHistory.length}
                </span>{" "}
                {ui.records}
              </p>
            </div>
          </LuxuryCard>
        )}

        {loading && (
          <LuxuryCard className="p-5 text-center text-white/60">
            {t.history.loadingRecords}
          </LuxuryCard>
        )}

        {errorText && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="h-4 w-4" />
            {errorText}
          </div>
        )}

        {!loading && !errorText && history.length === 0 && (
          <LuxuryCard goldGlow className="p-6 text-center">
            <Gem className="mx-auto mb-3 h-10 w-10 text-yellow-300" />
            <p className="font-black">{t.history.noRecordsTitle}</p>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-white/55">
              {t.history.noRecordsNote}
            </p>
          </LuxuryCard>
        )}

        {!loading &&
          !errorText &&
          history.length > 0 &&
          filteredHistory.length === 0 && (
            <LuxuryCard className="p-6 text-center">
              <Search className="mx-auto mb-3 h-10 w-10 text-yellow-300" />
              <p className="font-black">{ui.noMatchTitle}</p>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-white/55">
                {ui.noMatchNote}
              </p>
            </LuxuryCard>
          )}

        <div className="space-y-4 pb-6">
          {paginatedHistory.map((item) => {
const snapshot = getFirstSnapshot(item);
const items = getItems(item);
const lucky = isLuckyHistory(item);
const historyProfit = getHistoryProfit(item);
const historyProfitRate = getHistoryProfitRate(item);

            const productName =
              snapshot?.name || `${t.history.step} ${item.step_number}`;

            const productCategory =
              snapshot?.category || t.history.campaign;

            const productImage =
              snapshot?.main_image || snapshot?.images?.[0] || "";

            const productCurrency = snapshot?.currency || "USD";
            const productValue = Number(item.order_total || 0);
            const productRating = Number(snapshot?.rating || 0);
            const productReviews = Number(snapshot?.reviews_count || 0);

            return (
              <LuxuryCard key={item.id} goldGlow={lucky} className="overflow-hidden p-0">
                <div className="relative h-44 bg-black/35">
                  {productImage ? (
                    <img
                      src={productImage}
                      alt={productName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Gem className="h-16 w-16 text-yellow-300/70" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                  <div className="absolute left-4 top-4 flex items-center gap-2">
                    <span
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ${
                        lucky
                          ? "bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 text-black shadow-[0_0_22px_rgba(250,204,21,0.35)]"
                          : "bg-white/10 text-white/80 backdrop-blur"
                      }`}
                    >
                      {lucky && <Sparkles className="h-3.5 w-3.5" />}
                      {lucky ? t.history.luckyBonus : t.history.standard}
                    </span>

                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-bold text-emerald-300 backdrop-blur">
                      {t.history.completed}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black">{productName}</h3>

                      <p className="mt-1 text-sm text-white/45">
                        {t.history.step} {item.step_number} • {productCategory}
                      </p>

                      {productRating > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-yellow-300">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span className="font-bold">
                            {productRating.toFixed(1)}
                          </span>
                          <span className="text-white/40">
                            ({productReviews} {t.history.reviews})
                          </span>
                        </div>
                      )}

                      <p className="mt-2 text-xs text-white/35">
                        {new Date(item.completed_at || item.created_at).toLocaleString()}
                      </p>
                    </div>

                    <CheckCircle className="h-6 w-6 shrink-0 text-emerald-300" />
                  </div>

                  {items.length > 0 && (
                    <div className="mb-3 rounded-2xl border border-white/10 bg-black/25 p-3">
                      <p className="mb-2 text-xs font-black uppercase tracking-wide text-white/40">
                        {t.history.orderItems}
                      </p>

                      <div className="space-y-2">
                        {items.map((orderItem) => (
                          <div
                            key={orderItem.id}
                            className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] px-3 py-2 text-xs"
                          >
                            <div>
                              <p className="font-bold text-white/80">
                                {orderItem.product_snapshot?.name || productName}
                              </p>
                              <p className="mt-0.5 text-white/40">
                                {t.history.qty} {orderItem.quantity} × $
                                {Number(orderItem.unit_price || 0).toFixed(2)}
                              </p>
                            </div>

                            <p className="font-black text-yellow-300">
                              ${Number(orderItem.subtotal || 0).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-black/30 p-3">
                      <p className="text-xs text-white/45">
                        {t.history.productValue}
                      </p>
                      <p className="mt-1 font-bold text-white">
                        {productCurrency} {productValue.toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/30 p-3">
  <p className="text-xs text-white/45">
    {lucky ? t.history.luckyProfit : t.history.normalProfit}
  </p>

  <p className="mt-1 font-bold text-yellow-300">
    ${historyProfit.toFixed(2)}
  </p>

  <p className="mt-1 text-[10px] text-white/35">
    {lucky ? t.history.luckyProfitRate : t.history.profitRate}:{" "}
    {historyProfitRate.toFixed(2)}%
  </p>
</div>

                    <div className="rounded-2xl bg-black/30 p-3">
                      <p className="text-xs text-white/45">
                        {t.history.before}
                      </p>
                      <p className="mt-1 font-bold text-white/70">
                        {item.transaction?.balance_before !== null &&
                        item.transaction?.balance_before !== undefined
                          ? `$${Number(item.transaction.balance_before).toFixed(2)}`
                          : "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/30 p-3">
                      <p className="text-xs text-white/45">
                        {t.history.after}
                      </p>
                      <p className="mt-1 font-bold text-emerald-300">
                        {item.transaction?.balance_after !== null &&
                        item.transaction?.balance_after !== undefined
                          ? `$${Number(item.transaction.balance_after).toFixed(2)}`
                          : "-"}
                      </p>
                    </div>
                  </div>

{lucky && (
  <div className="mt-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-2 text-xs text-yellow-100/80">
    {t.history.luckyProfit}:{" "}
    <span className="font-black text-yellow-300">
      ${historyProfit.toFixed(2)}
    </span>
    {" · "}
    {t.history.luckyProfitRate}:{" "}
    <span className="font-black text-yellow-300">
      {historyProfitRate.toFixed(2)}%
    </span>
  </div>
)}
                </div>
              </LuxuryCard>
            );
          })}
        </div>

        {!loading && !errorText && filteredHistory.length > 0 && (
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