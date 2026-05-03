//src>app>wallet-records>page.tsx

"use client";

import LuxuryCard from "@/components/ui/LuxuryCard";
import { getLanguage, messages } from "@/i18n";
import StatCard from "@/components/ui/StatCard";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import type { WalletRequest } from "@/types/walletRequest";
import type { Profile } from "@/types/profile";
import {
  ClipboardList,
  AlertCircle,
  Upload,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";

type RequestFilter = "all" | "deposit_credit" | "withdrawal";

function getTypeLabel(
  type: WalletRequest["type"],
  labels: Record<WalletRequest["type"], string>
) {
  return labels[type] || type;
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
      {(profile) => <WalletRecordsContent profile={profile} />}
    </RequireAuth>
  );
}

function WalletRecordsContent({ profile }: { profile: Profile }) {
  const lang = getLanguage(profile.language);
  const t = messages[lang];

  const searchParams = useSearchParams();
  const defaultType = searchParams.get("type");

  const [records, setRecords] = useState<WalletRequest[]>([]);
  const [filter, setFilter] = useState<RequestFilter>(
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
        .eq("user_id", profile.id)
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
  }, [filter, profile.id]);

  const pendingCount = records.filter((item) => item.status === "pending").length;
  const approvedCount = records.filter(
    (item) => item.status === "approved"
  ).length;
  const rejectedCount = records.filter(
    (item) => item.status === "rejected"
  ).length;

  const totalDeposit = records
    .filter((item) => item.type === "deposit_credit")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalWithdrawal = records
    .filter((item) => item.type === "withdrawal")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <AppShell>
      <section className="px-5 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">{t.walletRecords.walletCenter}</p>
            <h1 className="text-2xl font-black">{t.walletRecords.requestRecords}</h1>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <ClipboardList className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <LuxuryCard goldGlow className="mb-5 p-5">
          <p className="text-sm text-white/50">{t.walletRecords.currentBalance}</p>
          <h2 className="mt-2 text-3xl font-black">
            ${Number(profile.balance).toFixed(2)}
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
  <StatCard
    label={t.walletRecords.depositRequests}
    value={`$${totalDeposit.toFixed(2)}`}
    color="green"
  />

  <StatCard
    label={t.walletRecords.withdrawRequests}
    value={`$${totalWithdrawal.toFixed(2)}`}
    color="blue"
  />
</div>
        </LuxuryCard>

        <div className="mb-5 grid grid-cols-4 gap-3">
  <StatCard label={t.walletRecords.all} value={String(records.length)} color="white" />

  <StatCard label={t.walletRecords.pending} value={String(pendingCount)} color="gold" />

  <StatCard label={t.walletRecords.approved} value={String(approvedCount)} color="green" />

  <StatCard label={t.walletRecords.rejected} value={String(rejectedCount)} color="red" />
</div>

        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
  { label: t.walletRecords.all, value: "all" },
  { label: t.walletRecords.deposit, value: "deposit_credit" },
  { label: t.walletRecords.withdraw, value: "withdrawal" },
].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value as RequestFilter)}
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

        {loading && (
          <LuxuryCard className="p-5 text-center text-white/60">
  {t.walletRecords.loading}
</LuxuryCard>
        )}

        {errorText && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="h-4 w-4" />
            {errorText}
          </div>
        )}

        {!loading && !errorText && records.length === 0 && (
          <LuxuryCard goldGlow className="p-6 text-center">
            <ClipboardList className="mx-auto mb-3 h-9 w-9 text-yellow-300" />
            <p className="font-bold">{t.walletRecords.noRecordsTitle}</p>
            <p className="mt-2 text-sm text-white/50">
              {t.walletRecords.noRecordsNote}
            </p>
          </LuxuryCard>
        )}

        <div className="space-y-4 pb-6">
          {records.map((item) => {
            const StatusIcon = getStatusIcon(item.status);
            const isDeposit = item.type === "deposit_credit";

            return (
              <LuxuryCard key={item.id} className="p-4">
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
                      <h3 className="font-black">{getTypeLabel(item.type, t.walletRecords.types)}</h3>

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
                    {t.walletRecords.statuses[item.status]}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-black/30 p-3">
                    <p className="text-xs text-white/45">{t.walletRecords.amount}</p>
                    <p className="mt-1 font-bold text-yellow-300">
                      ${Number(item.amount).toFixed(2)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-black/30 p-3">
                    <p className="text-xs text-white/45">{t.walletRecords.method}</p>
                    <p className="mt-1 font-bold text-white/70">
                      {item.method || t.walletRecords.manualReview}
                    </p>
                  </div>
                </div>

                {item.note && (
                  <div className="mt-3 rounded-2xl bg-black/30 p-3">
                    <p className="text-xs text-white/45">{t.walletRecords.yourNote}</p>
                    <p className="mt-1 text-sm text-white/70">{item.note}</p>
                  </div>
                )}

                {item.admin_note && (
                  <div className="mt-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-3">
                    <p className="text-xs text-yellow-200/70">{t.walletRecords.reviewNote}</p>
                    <p className="mt-1 text-sm text-yellow-100">
                      {item.admin_note}
                    </p>
                  </div>
                )}

                {item.reviewed_at && (
                  <p className="mt-3 text-xs text-white/35">
                    {t.walletRecords.reviewed}: {new Date(item.reviewed_at).toLocaleString()}
                  </p>
                )}
              </LuxuryCard>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}