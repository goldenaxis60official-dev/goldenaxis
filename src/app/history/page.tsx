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
  Star,
} from "lucide-react";
import type { Profile } from "@/types/profile";

type ProductSnapshot = {
  id: string | null;
  name: string | null;
  category: string | null;
  price: number | string | null;
  currency: string | null;
  rating: number | string | null;
  reviews_count: number | string | null;
  description: string | null;
  main_image: string | null;
  images: string[] | null;
};

type TaskRelation = {
  title: string;
  category: string;
  task_type: "standard" | "lucky_bonus";
  image_url: string | null;
};

type HistoryRow = {
  id: string;
  step_number: number;
  task_price: number;
  commission_earned: number;
  multiplier_applied: number;
  balance_before: number;
  balance_after: number;
  status: string;
  unlock_method: string | null;
  created_at: string;
  product_snapshot: ProductSnapshot | null;
  tasks: TaskRelation | TaskRelation[] | null;
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
        searchPlaceholder: "搜索任务、产品或步骤...",
        allTypes: "全部类型",
        newest: "最新优先",
        oldest: "最旧优先",
        commissionHigh: "佣金最高",
        valueHigh: "价值最高",
        perPage: "每页",
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
        searchPlaceholder: "Search task, product, or step...",
        allTypes: "All Types",
        newest: "Newest First",
        oldest: "Oldest First",
        commissionHigh: "Commission High",
        valueHigh: "Value High",
        perPage: "Per Page",
        showing: "Showing",
        of: "of",
        records: "records",
        noMatchTitle: "No matching records",
        noMatchNote: "Try another keyword or change the filters.",
        page: "Page",
        prev: "Prev",
        next: "Next",
      };
  const [history, setHistory] = useState<HistoryRow[]>([]);
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
        .from("task_history")
        .select(
          `
          id,
          step_number,
          task_price,
          commission_earned,
          multiplier_applied,
          balance_before,
          balance_after,
          status,
          unlock_method,
          created_at,
          product_snapshot,
          tasks (
            title,
            category,
            task_type,
            image_url
          )
        `
        )
        .eq("user_id", profile.id)
.order("created_at", { ascending: false });

      if (error) {
        setErrorText(error.message);
        setLoading(false);
        return;
      }

      setHistory((data || []) as unknown as HistoryRow[]);
      setLoading(false);
    }

    loadHistory();
  }, [profile.id]);

  function getTask(item: HistoryRow) {
    if (Array.isArray(item.tasks)) {
      return item.tasks[0] || null;
    }

    return item.tasks;
  }

  function isLuckyHistory(item: HistoryRow) {
    const task = getTask(item);

    return (
      task?.task_type === "lucky_bonus" ||
      Number(item.multiplier_applied || 1) > 1
    );
  }

  const filteredHistory = useMemo(() => {
  const keyword = searchText.trim().toLowerCase();

  const result = history.filter((item) => {
    const task = getTask(item);
    const snapshot = item.product_snapshot;
    const lucky = isLuckyHistory(item);

    const productName =
      snapshot?.name ||
      task?.title ||
      `${t.history.step} ${item.step_number}`;

    const productCategory =
      snapshot?.category || task?.category || t.history.campaign;

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
    if (sortBy === "oldest") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }

    if (sortBy === "commission_high") {
      return Number(b.commission_earned || 0) - Number(a.commission_earned || 0);
    }

    if (sortBy === "value_high") {
      return Number(b.task_price || 0) - Number(a.task_price || 0);
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
            <p className="text-sm text-yellow-200/80">{t.history.missionLedger}</p>
            <h1 className="text-2xl font-black">{t.history.historicalRecord}</h1>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <Gem className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3">
<StatCard label={t.history.all} value={String(history.length)} color="white" />

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

        {!loading && !errorText && history.length > 0 && filteredHistory.length === 0 && (
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
            const task = getTask(item);
            const snapshot = item.product_snapshot;
            const lucky = isLuckyHistory(item);

            const productName =
  snapshot?.name ||
  task?.title ||
  `${t.history.step} ${item.step_number}`;

const productCategory =
  snapshot?.category || task?.category || t.history.campaign;

            const productImage =
              snapshot?.main_image ||
              snapshot?.images?.[0] ||
              task?.image_url ||
              "";

            const productCurrency = snapshot?.currency || "USD";
            const productValue = Number(snapshot?.price || item.task_price || 0);
            const productRating = Number(snapshot?.rating || 0);
            const productReviews = Number(snapshot?.reviews_count || 0);

            return (
              <LuxuryCard
  key={item.id}
  goldGlow={lucky}
  className="overflow-hidden p-0"
>
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
                      className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                        lucky
                          ? "bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 text-black shadow-[0_0_22px_rgba(250,204,21,0.35)]"
: "bg-white/10 text-white/80 backdrop-blur"
                      }`}
                    >
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
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>

                    <CheckCircle className="h-6 w-6 shrink-0 text-emerald-300" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-black/30 p-3">
                      <p className="text-xs text-white/45">{t.history.productValue}</p>
                      <p className="mt-1 font-bold text-white">
                        {productCurrency} {productValue.toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/30 p-3">
                      <p className="text-xs text-white/45">{t.history.commission}</p>
                      <p className="mt-1 font-bold text-yellow-300">
                        ${Number(item.commission_earned).toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/30 p-3">
                      <p className="text-xs text-white/45">{t.history.before}</p>
                      <p className="mt-1 font-bold text-white/70">
                        ${Number(item.balance_before).toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/30 p-3">
                      <p className="text-xs text-white/45">{t.history.after}</p>
                      <p className="mt-1 font-bold text-emerald-300">
                        ${Number(item.balance_after).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {Number(item.multiplier_applied) > 1 && (
                    <div className="mt-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-2 text-xs text-yellow-100/80">
                      {t.history.bonusMultiplierApplied}{" "}
                      <span className="font-black text-yellow-300">
                        {Number(item.multiplier_applied).toFixed(1)}x
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