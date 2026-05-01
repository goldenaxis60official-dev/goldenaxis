"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import type { WalletRequest } from "@/types/walletRequest";
import {
  ClipboardList,
  AlertCircle,
  Upload,
  Download,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

function getTypeLabel(type: WalletRequest["type"]) {
  if (type === "deposit_credit") return "Deposit Credit";
  return "Withdrawal";
}

function getStatusIcon(status: WalletRequest["status"]) {
  if (status === "approved") return CheckCircle;
  if (status === "rejected") return XCircle;
  return Clock;
}

function getStatusClass(status: WalletRequest["status"]) {
  if (status === "approved") {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
  }

  if (status === "rejected") {
    return "border-red-400/30 bg-red-500/10 text-red-300";
  }

  return "border-yellow-400/30 bg-yellow-500/10 text-yellow-300";
}

export default function WalletRecordsPage() {
  return (
    <RequireAuth>
      {() => <WalletRecordsContent />}
    </RequireAuth>
  );
}

function WalletRecordsContent() {
  const searchParams = useSearchParams();
  const defaultType = searchParams.get("type");

  const [records, setRecords] = useState<WalletRequest[]>([]);
  const [filter, setFilter] = useState<"all" | "deposit_credit" | "withdrawal">(
    defaultType === "deposit_credit" || defaultType === "withdrawal"
      ? defaultType
      : "all"
  );

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    async function loadRecords() {
      setLoading(true);
      setErrorText("");

      let query = supabase
        .from("wallet_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("type", filter);
      }

      const { data, error } = await query;

      if (error) {
        setErrorText(error.message);
        setLoading(false);
        return;
      }

      setRecords((data || []) as WalletRequest[]);
      setLoading(false);
    }

    loadRecords();
  }, [filter]);

  const pendingCount = records.filter((item) => item.status === "pending").length;
  const approvedCount = records.filter(
    (item) => item.status === "approved"
  ).length;

  return (
    <AppShell>
      <section className="px-5 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">Wallet Center</p>
            <h1 className="text-2xl font-black">Request Records</h1>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <ClipboardList className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
            <p className="text-xs text-white/45">Records</p>
            <p className="mt-1 font-bold text-white">{records.length}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
            <p className="text-xs text-white/45">Pending</p>
            <p className="mt-1 font-bold text-yellow-300">{pendingCount}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
            <p className="text-xs text-white/45">Approved</p>
            <p className="mt-1 font-bold text-emerald-300">{approvedCount}</p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
            { label: "All", value: "all" },
            { label: "Deposit", value: "deposit_credit" },
            { label: "Withdraw", value: "withdrawal" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() =>
                setFilter(item.value as "all" | "deposit_credit" | "withdrawal")
              }
              className={`rounded-2xl border px-3 py-3 text-sm font-bold ${
                filter === item.value
                  ? "border-yellow-400 bg-yellow-400 text-black"
                  : "border-white/10 bg-white/[0.06] text-white/65"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 text-center text-white/60">
            Loading request records...
          </div>
        )}

        {errorText && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="h-4 w-4" />
            {errorText}
          </div>
        )}

        {!loading && !errorText && records.length === 0 && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center">
            <ClipboardList className="mx-auto mb-3 h-9 w-9 text-yellow-300" />
            <p className="font-bold">No request records yet</p>
            <p className="mt-2 text-sm text-white/50">
              Deposit or withdrawal requests will appear here.
            </p>
          </div>
        )}

        <div className="space-y-4 pb-6">
          {records.map((item) => {
            const StatusIcon = getStatusIcon(item.status);
            const isDeposit = item.type === "deposit_credit";

            return (
              <div
                key={item.id}
                className="rounded-[1.7rem] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        isDeposit
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "bg-blue-400/10 text-blue-300"
                      }`}
                    >
                      {isDeposit ? (
                        <Upload className="h-6 w-6" />
                      ) : (
                        <Download className="h-6 w-6" />
                      )}
                    </div>

                    <div>
                      <h3 className="font-black">{getTypeLabel(item.type)}</h3>

                      <p className="mt-1 text-xs text-white/45">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                      item.status
                    )}`}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {item.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-black/30 p-3">
                    <p className="text-xs text-white/45">Amount</p>
                    <p className="mt-1 font-bold text-yellow-300">
                      ${Number(item.amount).toFixed(2)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-black/30 p-3">
                    <p className="text-xs text-white/45">Method</p>
                    <p className="mt-1 font-bold text-white/70">
                      {item.method || "Manual Review"}
                    </p>
                  </div>
                </div>

                {item.note && (
                  <div className="mt-3 rounded-2xl bg-black/30 p-3">
                    <p className="text-xs text-white/45">Your Note</p>
                    <p className="mt-1 text-sm text-white/70">{item.note}</p>
                  </div>
                )}

                {item.admin_note && (
                  <div className="mt-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-3">
                    <p className="text-xs text-yellow-200/70">Admin Note</p>
                    <p className="mt-1 text-sm text-yellow-100">
                      {item.admin_note}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}