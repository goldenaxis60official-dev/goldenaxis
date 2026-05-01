"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle, Gem, AlertCircle } from "lucide-react";

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
  tasks: {
    title: string;
    category: string;
    task_type: "standard" | "lucky_bonus";
    image_url: string | null;
  } | null;
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

      setHistory((data || []) as HistoryRow[]);
      setLoading(false);
    }

    loadHistory();
  }, []);

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
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
            <p className="text-xs text-white/45">All</p>
            <p className="mt-1 font-bold text-white">{history.length}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
            <p className="text-xs text-white/45">Completed</p>
            <p className="mt-1 font-bold text-emerald-300">
              {history.filter((h) => h.status === "completed").length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
            <p className="text-xs text-white/45">Bonus</p>
            <p className="mt-1 font-bold text-yellow-300">
              {
                history.filter((h) => h.tasks?.task_type === "lucky_bonus")
                  .length
              }
            </p>
          </div>
        </div>

        {loading && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 text-center text-white/60">
            Loading records...
          </div>
        )}

        {errorText && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="h-4 w-4" />
            {errorText}
          </div>
        )}

        {!loading && !errorText && history.length === 0 && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center">
            <p className="font-bold">No mission records yet</p>
            <p className="mt-2 text-sm text-white/50">
              Complete your first campaign mission to create a record.
            </p>
          </div>
        )}

        <div className="space-y-4 pb-6">
          {history.map((item) => {
            const lucky = item.tasks?.task_type === "lucky_bonus";

            return (
              <div
                key={item.id}
                className={`rounded-[1.7rem] border p-4 backdrop-blur-xl ${
                  lucky
                    ? "border-yellow-400/50 bg-yellow-400/10 shadow-[0_0_35px_rgba(212,175,55,0.18)]"
                    : "border-white/10 bg-white/[0.05]"
                }`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                          lucky
                            ? "bg-yellow-300 text-black"
                            : "bg-white/10 text-white/70"
                        }`}
                      >
                        {lucky ? "Lucky Bonus" : "Standard"}
                      </span>

                      <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-bold text-emerald-300">
                        Completed
                      </span>
                    </div>

                    <h3 className="text-lg font-black">
                      {item.tasks?.title || `Mission Step ${item.step_number}`}
                    </h3>

                    <p className="mt-1 text-sm text-white/45">
                      Step {item.step_number} •{" "}
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>

                  <CheckCircle className="h-6 w-6 shrink-0 text-emerald-300" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-black/30 p-3">
                    <p className="text-xs text-white/45">Product Value</p>
                    <p className="mt-1 font-bold text-white">
                      ${Number(item.task_price).toFixed(2)}
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
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}