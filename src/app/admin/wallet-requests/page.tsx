//app>admin>wallet-requests>page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { en } from "@/i18n/en";
import { zh } from "@/i18n/zh";
import RequireAuth from "@/components/auth/RequireAuth";
import AdminNav from "../AdminNav";
import { supabase } from "@/lib/supabaseClient";
import { canAccessAdminPath } from "@/lib/adminPermissions";
import type { Profile } from "@/types/profile";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Search,
  ShieldCheck,
  Upload,
  Wallet,
  XCircle,
} from "lucide-react";

type RequestFilter = "pending" | "approved" | "rejected" | "all";

type AdminWalletRequest = {
  id: string;
  user_id: string;
  type: "deposit_credit" | "withdrawal";
  amount: number;
  method: string | null;
  status: "pending" | "approved" | "rejected";
  note: string | null;
  proof_image_url: string | null;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  profiles: {
  member_id: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  referral_code: string | null;
  referred_by: string | null;
  balance: number;
  deposited_balance: number;
  referral_bonus_balance: number;
  task_profit_balance: number;
  current_step: number;
} | null;

used_referral_code?: string | null;
used_referral_owner?: string | null;
};

type AdminWalletRequestsText = typeof en.adminWalletRequests;

export default function AdminWalletRequestsPage() {
  return (
    <RequireAuth>
      {(profile) => <AdminWalletRequestsContent profile={profile} />}
    </RequireAuth>
  );
}

function AdminWalletRequestsContent({ profile }: { profile: Profile }) {
  const currentLanguage = profile.language === "zh" ? "zh" : "en";

  const t: AdminWalletRequestsText =
    currentLanguage === "zh"
      ? (zh.adminWalletRequests as unknown as AdminWalletRequestsText)
      : en.adminWalletRequests;

  const [records, setRecords] = useState<AdminWalletRequest[]>([]);
const [filter, setFilter] = useState<RequestFilter>("pending");
const [typeFilter, setTypeFilter] = useState<"all" | "deposit_credit" | "withdrawal">("all");
const [searchText, setSearchText] = useState("");
const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount_high" | "amount_low">("newest");
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(10);
const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
const [liveStatus, setLiveStatus] = useState<
  "connecting" | "live" | "error"
>("connecting");
const [lastLiveUpdate, setLastLiveUpdate] = useState("");

const [loading, setLoading] = useState(true);
const [actionId, setActionId] = useState<string | null>(null);

  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");

  const hasPageAccess = canAccessAdminPath(profile.role, "/admin/wallet-requests");
  function getRequestFilterLabel(value: RequestFilter) {
  return t.filters[value];
}

async function loadRecords(options?: { silent?: boolean }) {
  if (!options?.silent) {
    setLoading(true);
  }

  setErrorText("");

  const { data, error } = await supabase
    .from("wallet_requests")
    .select(
      `
      *,
      profiles (
  member_id,
  display_name,
  email,
  phone,
  referral_code,
        referred_by,
        balance,
        deposited_balance,
        referral_bonus_balance,
        task_profit_balance,
        current_step
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    setErrorText(error.message);
    setLoading(false);
    return;
  }

  const rawRecords = (data || []) as AdminWalletRequest[];

  const referrerIds = Array.from(
    new Set(
      rawRecords
        .map((item) => item.profiles?.referred_by)
        .filter((id): id is string => Boolean(id))
    )
  );

  if (referrerIds.length === 0) {
    setRecords(rawRecords);
    setLoading(false);
    return;
  }

  const { data: referrerData, error: referrerError } = await supabase
    .from("profiles")
    .select("id, referral_code, display_name, member_id")
    .in("id", referrerIds);

  if (referrerError) {
    setErrorText(referrerError.message);
    setRecords(rawRecords);
    setLoading(false);
    return;
  }

  const referrerMap = new Map(
    ((referrerData || []) as {
      id: string;
      referral_code: string | null;
      display_name: string | null;
      member_id: string | null;
    }[]).map((referrer) => [referrer.id, referrer])
  );

  const enrichedRecords = rawRecords.map((item) => {
    const referrer = item.profiles?.referred_by
      ? referrerMap.get(item.profiles.referred_by)
      : null;

    return {
      ...item,
      used_referral_code: referrer?.referral_code || null,
      used_referral_owner:
        referrer?.display_name || referrer?.member_id || null,
    };
  });

  setRecords(enrichedRecords);
  setLoading(false);
}

useEffect(() => {
  if (!hasPageAccess) {
    setLoading(false);
    return;
  }

  let isMounted = true;

  loadRecords();

  const channel = supabase
    .channel("admin-wallet-requests-live")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "wallet_requests",
      },
      () => {
        if (!isMounted) return;

        setLastLiveUpdate(new Date().toLocaleTimeString());
        loadRecords({ silent: true });
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "profiles",
      },
      () => {
        if (!isMounted) return;

        setLastLiveUpdate(new Date().toLocaleTimeString());
        loadRecords({ silent: true });
      }
    )
    .subscribe((status) => {
      if (!isMounted) return;

      if (status === "SUBSCRIBED") {
        setLiveStatus("live");
      }

      if (
        status === "CHANNEL_ERROR" ||
        status === "TIMED_OUT" ||
        status === "CLOSED"
      ) {
        setLiveStatus("error");
      }
    });

  return () => {
    isMounted = false;
    supabase.removeChannel(channel);
  };
}, [hasPageAccess]);

  async function handleApprove(id: string) {
    setActionId(id);
    setSuccessText("");
    setErrorText("");

    const { error } = await supabase.rpc("approve_wallet_request", {
      input_request_id: id,
      input_admin_note: adminNotes[id] || null,
    });

    if (error) {
      setErrorText(error.message);
      setActionId(null);
      return;
    }

    setSuccessText(t.messages.approved);
    setActionId(null);
    loadRecords();
  }

  async function handleReject(id: string) {
    setActionId(id);
    setSuccessText("");
    setErrorText("");

    const { error } = await supabase.rpc("reject_wallet_request", {
      input_request_id: id,
      input_admin_note: adminNotes[id] || null,
    });

    if (error) {
      setErrorText(error.message);
      setActionId(null);
      return;
    }

    setSuccessText(t.messages.rejected);
    setActionId(null);
    loadRecords();
  }

  const filteredRecords = useMemo(() => {
  const keyword = searchText.toLowerCase().trim();

  const result = records.filter((item) => {
    const matchesStatus = filter === "all" || item.status === filter;
    const matchesType = typeFilter === "all" || item.type === typeFilter;

const matchesSearch =
  !keyword ||
  item.profiles?.display_name?.toLowerCase().includes(keyword) ||
  item.profiles?.email?.toLowerCase().includes(keyword) ||
item.profiles?.phone?.toLowerCase().includes(keyword) ||
  item.profiles?.member_id?.toLowerCase().includes(keyword) ||
  item.profiles?.referral_code?.toLowerCase().includes(keyword) ||
  item.profiles?.referred_by?.toLowerCase().includes(keyword) ||
  item.used_referral_code?.toLowerCase().includes(keyword) ||
  item.used_referral_owner?.toLowerCase().includes(keyword) ||
  item.user_id.toLowerCase().includes(keyword) ||
  item.method?.toLowerCase().includes(keyword) ||
  item.note?.toLowerCase().includes(keyword) ||
  item.admin_note?.toLowerCase().includes(keyword) ||
  item.id.toLowerCase().includes(keyword);

    return matchesStatus && matchesType && matchesSearch;
  });

  return [...result].sort((a, b) => {
    if (sortBy === "oldest") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }

    if (sortBy === "amount_high") {
      return Number(b.amount || 0) - Number(a.amount || 0);
    }

    if (sortBy === "amount_low") {
      return Number(a.amount || 0) - Number(b.amount || 0);
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}, [records, filter, typeFilter, searchText, sortBy]);

const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));

const paginatedRecords = useMemo(() => {
  const start = (currentPage - 1) * pageSize;
  return filteredRecords.slice(start, start + pageSize);
}, [filteredRecords, currentPage, pageSize]);

const firstResult =
  filteredRecords.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;

const lastResult = Math.min(currentPage * pageSize, filteredRecords.length);

useEffect(() => {
  setCurrentPage(1);
}, [filter, typeFilter, searchText, sortBy, pageSize]);

useEffect(() => {
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }
}, [currentPage, totalPages]);

  if (!hasPageAccess) {
    return (
      <main className="min-h-screen bg-[#050505] p-6 text-white">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-red-400/30 bg-red-500/10 p-8 text-center">
          <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-red-300" />
          <h1 className="text-2xl font-black">{t.accessRequiredTitle}</h1>
<p className="mt-2 text-sm text-white/55">
  {t.accessRequiredDescription}
</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <AdminNav language={currentLanguage} profile={profile} />

        <div className="mb-8 flex items-center justify-between gap-5">
          <div>
            <p className="text-sm font-bold text-yellow-200/80">
  {t.pageTag}
</p>
<h1 className="mt-1 text-3xl font-black">{t.title}</h1>
<p className="mt-2 max-w-2xl text-sm text-white/50">
  {t.description}
</p>

<div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black">
  <span
    className={`h-2.5 w-2.5 rounded-full ${
      liveStatus === "live"
        ? "bg-emerald-400"
        : liveStatus === "error"
        ? "bg-red-400"
        : "bg-yellow-300"
    }`}
  />

  <span
    className={
      liveStatus === "live"
        ? "text-emerald-300"
        : liveStatus === "error"
        ? "text-red-300"
        : "text-yellow-300"
    }
  >
    {liveStatus === "live"
      ? currentLanguage === "zh"
        ? "实时更新已连接"
        : "Live updates active"
      : liveStatus === "error"
      ? currentLanguage === "zh"
        ? "实时连接异常"
        : "Live connection issue"
      : currentLanguage === "zh"
      ? "正在连接实时更新"
      : "Connecting live updates"}
  </span>

  {lastLiveUpdate && (
    <span className="text-white/35">
      {currentLanguage === "zh" ? "最后更新" : "Last update"} {lastLiveUpdate}
    </span>
  )}
</div>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4">
            <Wallet className="h-7 w-7 text-yellow-300" />
          </div>
        </div>
        <div className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.035] p-5">
  <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
    <div>
      <p className="text-sm text-yellow-200/80">{t.filters.title}</p>
<h2 className="text-xl font-black capitalize">
  {getRequestFilterLabel(filter)}
</h2>
    </div>

    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {(["pending", "approved", "rejected", "all"] as RequestFilter[]).map(
        (item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`rounded-2xl border px-5 py-3 text-sm font-black capitalize ${
              filter === item
                ? "border-yellow-400 bg-yellow-400 text-black"
                : "border-white/10 bg-black/35 text-white/60 hover:bg-white/[0.08]"
            }`}
          >
            {getRequestFilterLabel(item)}
          </button>
        )
      )}
    </div>
  </div>

  <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.4fr_0.8fr_0.9fr_0.6fr]">
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
      <input
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
        placeholder="Search user, phone, method, note, request ID..."
        className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-yellow-400/50"
      />
    </div>

    <select
      value={typeFilter}
      onChange={(event) =>
        setTypeFilter(event.target.value as "all" | "deposit_credit" | "withdrawal")
      }
      className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400/50"
    >
      <option className="bg-black" value="all">{t.filters.allTypes}</option>
<option className="bg-black" value="deposit_credit">{t.filters.deposits}</option>
<option className="bg-black" value="withdrawal">{t.filters.withdrawals}</option>
    </select>

    <select
      value={sortBy}
      onChange={(event) =>
        setSortBy(event.target.value as "newest" | "oldest" | "amount_high" | "amount_low")
      }
      className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400/50"
    >
      <option className="bg-black" value="newest">{t.filters.newestFirst}</option>
<option className="bg-black" value="oldest">{t.filters.oldestFirst}</option>
<option className="bg-black" value="amount_high">{t.filters.amountHigh}</option>
<option className="bg-black" value="amount_low">{t.filters.amountLow}</option>
    </select>

    <select
      value={pageSize}
      onChange={(event) => setPageSize(Number(event.target.value))}
      className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400/50"
    >
      <option className="bg-black" value={10}>10</option>
      <option className="bg-black" value={25}>25</option>
      <option className="bg-black" value={50}>50</option>
      <option className="bg-black" value={100}>100</option>
    </select>
  </div>
</div>

        {successText && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle className="h-4 w-4" />
            {successText}
          </div>
        )}

        {errorText && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="h-4 w-4" />
            {errorText}
          </div>
        )}

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5">
  <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
    <div>
      <p className="text-sm text-yellow-200/80">{t.list.tag}</p>
<h2 className="text-2xl font-black">{t.list.title}</h2>
<p className="mt-1 text-xs text-white/40">
  {t.list.description}
</p>
    </div>

    <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm font-black text-yellow-300">
      {filteredRecords.length} {t.list.shown} / {records.length} {t.list.total}
    </div>
  </div>

  {loading && (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center text-white/60">
      {t.list.loading}
    </div>
  )}

  {!loading && filteredRecords.length === 0 && (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center">
      <Clock className="mx-auto mb-4 h-12 w-12 text-yellow-300" />
      <p className="font-black">{t.list.noRequests}</p>
<p className="mt-2 text-sm text-white/50">
  {t.list.noRequestsDescription}
</p>
    </div>
  )}

  {!loading && filteredRecords.length > 0 && (
    <>
      <div className="space-y-4">
        {paginatedRecords.map((item) => {
          const isDeposit = item.type === "deposit_credit";
          const isPending = item.status === "pending";
          const separatedBalance =
  Number(item.profiles?.deposited_balance || 0) +
  Number(item.profiles?.referral_bonus_balance || 0) +
  Number(item.profiles?.task_profit_balance || 0);

const displayBalance =
  separatedBalance > 0
    ? separatedBalance
    : Number(item.profiles?.balance || 0);

          return (
            <div
              key={item.id}
              className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/25 transition hover:border-yellow-400/20 hover:bg-white/[0.035]"
            >
              <div className="grid grid-cols-1 gap-5 p-5 2xl:grid-cols-[1.2fr_0.9fr_0.9fr_1fr]">
                <div className="flex gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                      isDeposit
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-blue-400/10 text-blue-300"
                    }`}
                  >
                    {isDeposit ? (
                      <Upload className="h-7 w-7" />
                    ) : (
                      <Download className="h-7 w-7" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black">
                        {isDeposit ? t.list.depositCredit : t.list.withdrawal} {t.list.request}
                      </p>
                      <StatusBadge status={item.status} label={t.status[item.status]} />
                    </div>

                    <p className="mt-1 text-xs text-white/45">
                      {new Date(item.created_at).toLocaleString()}
                    </p>

                    <p className="mt-3 text-2xl font-black text-yellow-300">
                      ${Number(item.amount).toFixed(2)}
                    </p>

                    <p className="mt-1 text-sm text-white/55">
                      {item.method || t.list.manual}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-white/35">
                    {t.list.user}
                  </p>
                  <p className="mt-2 font-black">
                    {item.profiles?.display_name || t.list.unknownUser}
                  </p>
<p className="mt-1 truncate text-xs text-white/45">
  Phone:{" "}
  <span className="font-bold text-white/65">
    {item.profiles?.phone || "-"}
  </span>
</p>

                  <p className="mt-1 text-xs font-bold text-yellow-300">
  ID: {item.profiles?.member_id || item.user_id.slice(0, 8)}
</p>

<div className="mt-2 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-2">
  <p className="text-[10px] font-bold uppercase tracking-wide text-yellow-200/70">
    Used Referral Code
  </p>
  <p className="mt-1 text-sm font-black text-yellow-300">
    {item.used_referral_code || "-"}
  </p>
  {item.used_referral_owner && (
    <p className="mt-1 text-[10px] text-white/40">
      Owner: {item.used_referral_owner}
    </p>
  )}
</div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
  <div>
    <p className="text-xs text-white/35">{t.list.balance}</p>
    <p className="mt-1 font-black text-yellow-300">
      ${displayBalance.toFixed(2)}
    </p>
  </div>

  <div>
    <p className="text-xs text-white/35">{t.list.step}</p>
    <p className="mt-1 font-black text-white">
      {item.profiles?.current_step || 1}
    </p>
  </div>
</div>

<div className="mt-3 grid grid-cols-3 gap-2">
  <div className="rounded-xl bg-black/30 p-2">
    <p className="text-[10px] text-white/35">Deposited</p>
    <p className="mt-1 text-xs font-black text-white">
      ${Number(item.profiles?.deposited_balance || 0).toFixed(2)}
    </p>
  </div>

  <div className="rounded-xl bg-black/30 p-2">
    <p className="text-[10px] text-white/35">Referral</p>
    <p className="mt-1 text-xs font-black text-yellow-300">
      ${Number(item.profiles?.referral_bonus_balance || 0).toFixed(2)}
    </p>
  </div>

  <div className="rounded-xl bg-black/30 p-2">
    <p className="text-[10px] text-white/35">Profit</p>
    <p className="mt-1 text-xs font-black text-emerald-300">
      ${Number(item.profiles?.task_profit_balance || 0).toFixed(2)}
    </p>
  </div>
</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-white/35">
                    {t.list.userNoteProof}
                  </p>

                  {item.note ? (
                    <p className="mt-2 max-h-24 overflow-y-auto text-xs leading-5 text-white/55">
                      {item.note}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-white/35">{t.list.noUserNote}</p>
                  )}

                  {item.proof_image_url && (
                    <a
                      href={item.proof_image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 block overflow-hidden rounded-2xl border border-yellow-400/20 bg-black/40"
                    >
                      <img
                        src={item.proof_image_url}
                        alt={t.list.depositProofAlt}
                        className="h-32 w-full object-cover"
                      />

                      <div className="border-t border-white/10 px-3 py-2 text-xs font-bold text-yellow-200">
                        {t.list.openDepositProof}
                      </div>
                    </a>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-white/35">
                    {t.list.reviewAction}
                  </p>

                  {isPending ? (
                    <>
                      <textarea
                        value={adminNotes[item.id] || ""}
                        onChange={(event) =>
                          setAdminNotes({
                            ...adminNotes,
                            [item.id]: event.target.value,
                          })
                        }
                        placeholder={t.list.optionalReviewNote}
                        className="mt-3 min-h-24 w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
                      />

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleReject(item.id)}
                          disabled={actionId === item.id}
                          className="flex items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-3 text-xs font-black text-red-300 hover:bg-red-500/15 disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          {t.list.reject}
                        </button>

                        <button
                          onClick={() => handleApprove(item.id)}
                          disabled={actionId === item.id}
                          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-3 py-3 text-xs font-black text-black disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {t.list.approve}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-xs text-white/35">{t.list.reviewedNote}</p>
                      <p className="mt-2 text-sm leading-5 text-white/60">
                        {item.admin_note || "-"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/50 md:flex-row md:items-center md:justify-between">
        <p>
  {t.list.showing}{" "}
  <span className="font-black text-white">{firstResult}</span>
  {" - "}
  <span className="font-black text-white">{lastResult}</span>
  {" "}
  {t.list.of}{" "}
  <span className="font-black text-yellow-300">
    {filteredRecords.length}
  </span>{" "}
  {t.list.requests}
</p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white/70 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            {t.list.prev}
          </button>

          <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black text-yellow-300">
            {t.list.page} {currentPage} / {totalPages}
          </div>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white/70 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t.list.next}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  )}
</section>
      </div>
    </main>
  );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const styles =
    status === "approved"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
      : status === "rejected"
      ? "border-red-400/30 bg-red-500/10 text-red-300"
      : "border-yellow-400/30 bg-yellow-500/10 text-yellow-300";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black ${styles}`}>
      {label}
    </span>
  );
}