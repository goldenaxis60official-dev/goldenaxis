"use client";

import LuxuryCard from "@/components/ui/LuxuryCard";
import StatCard from "@/components/ui/StatCard";
import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle, Gem, AlertCircle, Star } from "lucide-react";

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
      {() => <HistoryContent />}
    </RequireAuth>
  );
}

function HistoryContent() {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

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
  }, []);

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

  return (
    <AppShell>
      <section className="px-5 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">Mission Ledger</p>
            <h1 className="text-2xl font-black">Historical Record</h1>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <Gem className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3">
  <StatCard label="All" value={String(history.length)} color="white" />

  <StatCard
    label="Completed"
    value={String(history.filter((h) => h.status === "completed").length)}
    color="green"
  />

  <StatCard
    label="Bonus"
    value={String(history.filter((h) => isLuckyHistory(h)).length)}
    color="gold"
  />
</div>

        {loading && (
          <LuxuryCard className="p-5 text-center text-white/60">
  Loading records...
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
  <p className="font-black">No mission records yet</p>
  <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-white/55">
    Complete your first campaign mission to create your historical record.
  </p>
</LuxuryCard>
        )}

        <div className="space-y-4 pb-6">
          {history.map((item) => {
            const task = getTask(item);
            const snapshot = item.product_snapshot;
            const lucky = isLuckyHistory(item);

            const productName =
              snapshot?.name || task?.title || `Mission Step ${item.step_number}`;

            const productCategory =
              snapshot?.category || task?.category || "Campaign";

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
                      {lucky ? "Lucky Bonus" : "Standard"}
                    </span>

                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-bold text-emerald-300 backdrop-blur">
                      Completed
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black">{productName}</h3>

                      <p className="mt-1 text-sm text-white/45">
                        Step {item.step_number} • {productCategory}
                      </p>

                      {productRating > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-yellow-300">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span className="font-bold">
                            {productRating.toFixed(1)}
                          </span>
                          <span className="text-white/40">
                            ({productReviews} reviews)
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
                      <p className="text-xs text-white/45">Product Value</p>
                      <p className="mt-1 font-bold text-white">
                        {productCurrency} {productValue.toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/30 p-3">
                      <p className="text-xs text-white/45">Commission</p>
                      <p className="mt-1 font-bold text-yellow-300">
                        ${Number(item.commission_earned).toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/30 p-3">
                      <p className="text-xs text-white/45">Before</p>
                      <p className="mt-1 font-bold text-white/70">
                        ${Number(item.balance_before).toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/30 p-3">
                      <p className="text-xs text-white/45">After</p>
                      <p className="mt-1 font-bold text-emerald-300">
                        ${Number(item.balance_after).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {Number(item.multiplier_applied) > 1 && (
                    <div className="mt-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-2 text-xs text-yellow-100/80">
                      Bonus multiplier applied:{" "}
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
      </section>
    </AppShell>
  );
}