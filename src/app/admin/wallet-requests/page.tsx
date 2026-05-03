//app>admin>wallet-requests>page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import AdminNav from "../AdminNav";
import { supabase } from "@/lib/supabaseClient";
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
    display_name: string | null;
    email: string | null;
    balance: number;
    current_step: number;
  } | null;
};

export default function AdminWalletRequestsPage() {
  return (
    <RequireAuth>
      {(profile) => <AdminWalletRequestsContent profile={profile} />}
    </RequireAuth>
  );
}

function AdminWalletRequestsContent({ profile }: { profile: Profile }) {
  const [records, setRecords] = useState<AdminWalletRequest[]>([]);
const [filter, setFilter] = useState<RequestFilter>("pending");
const [typeFilter, setTypeFilter] = useState<"all" | "deposit_credit" | "withdrawal">("all");
const [searchText, setSearchText] = useState("");
const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount_high" | "amount_low">("newest");
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(10);
const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");

  const isAdmin = profile.role === "admin";

  async function loadRecords() {
  setLoading(true);
  setErrorText("");

  const { data, error } = await supabase
    .from("wallet_requests")
    .select(
      `
      *,
      profiles (
        display_name,
        email,
        balance,
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

  setRecords((data || []) as AdminWalletRequest[]);
  setLoading(false);
}

  useEffect(() => {
  if (isAdmin) {
    loadRecords();
  } else {
    setLoading(false);
  }
}, [isAdmin]);

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

    setSuccessText("Request approved successfully.");
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

    setSuccessText("Request rejected successfully.");
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

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#050505] p-6 text-white">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-red-400/30 bg-red-500/10 p-8 text-center">
          <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-red-300" />
          <h1 className="text-2xl font-black">Admin Access Required</h1>
          <p className="mt-2 text-sm text-white/55">
            This page is only available for admin accounts.
          </p>
        </div>
      </main>
    );
  }

  const pendingCount = records.filter((item) => item.status === "pending").length;
const depositCount = records.filter((item) => item.type === "deposit_credit").length;
const withdrawalCount = records.filter((item) => item.type === "withdrawal").length;
const totalAmount = filteredRecords.reduce(
  (sum, item) => sum + Number(item.amount || 0),
  0
);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <AdminNav />

        <div className="mb-8 flex items-center justify-between gap-5">
          <div>
            <p className="text-sm font-bold text-yellow-200/80">
              Admin Control
            </p>
            <h1 className="mt-1 text-3xl font-black">Wallet Requests</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Review user deposit credit and withdrawal requests. Approving
              requests updates user wallet balance through secure RPC actions.
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4">
            <Wallet className="h-7 w-7 text-yellow-300" />
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Showing" value={String(records.length)} />
          <StatCard label="Pending" value={String(pendingCount)} />
          <StatCard label="Deposits" value={String(depositCount)} />
          <StatCard label="Total Amount" value={`$${totalAmount.toFixed(2)}`} />
        </div>

        <div className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.035] p-5">
  <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
    <div>
      <p className="text-sm text-yellow-200/80">Filter Requests</p>
      <h2 className="text-xl font-black capitalize">{filter}</h2>
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
            {item}
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
        placeholder="Search user, email, method, note, request ID..."
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
      <option className="bg-black" value="all">All Types</option>
      <option className="bg-black" value="deposit_credit">Deposits</option>
      <option className="bg-black" value="withdrawal">Withdrawals</option>
    </select>

    <select
      value={sortBy}
      onChange={(event) =>
        setSortBy(event.target.value as "newest" | "oldest" | "amount_high" | "amount_low")
      }
      className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400/50"
    >
      <option className="bg-black" value="newest">Newest First</option>
      <option className="bg-black" value="oldest">Oldest First</option>
      <option className="bg-black" value="amount_high">Amount High</option>
      <option className="bg-black" value="amount_low">Amount Low</option>
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
      <p className="text-sm text-yellow-200/80">Request Ledger</p>
      <h2 className="text-2xl font-black">Wallet Review Queue</h2>
      <p className="mt-1 text-xs text-white/40">
        Review proof, user details, amount, balance, and action notes in a cleaner card queue.
      </p>
    </div>

    <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm font-black text-yellow-300">
      {filteredRecords.length} shown / {records.length} total
    </div>
  </div>

  {loading && (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center text-white/60">
      Loading wallet requests...
    </div>
  )}

  {!loading && filteredRecords.length === 0 && (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center">
      <Clock className="mx-auto mb-4 h-12 w-12 text-yellow-300" />
      <p className="font-black">No requests found</p>
      <p className="mt-2 text-sm text-white/50">
        Wallet requests will appear here when users submit them.
      </p>
    </div>
  )}

  {!loading && filteredRecords.length > 0 && (
    <>
      <div className="space-y-4">
        {paginatedRecords.map((item) => {
          const isDeposit = item.type === "deposit_credit";
          const isPending = item.status === "pending";

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
                        {isDeposit ? "Deposit Credit" : "Withdrawal"} Request
                      </p>
                      <StatusBadge status={item.status} />
                    </div>

                    <p className="mt-1 text-xs text-white/45">
                      {new Date(item.created_at).toLocaleString()}
                    </p>

                    <p className="mt-3 text-2xl font-black text-yellow-300">
                      ${Number(item.amount).toFixed(2)}
                    </p>

                    <p className="mt-1 text-sm text-white/55">
                      {item.method || "Manual"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-white/35">
                    User
                  </p>
                  <p className="mt-2 font-black">
                    {item.profiles?.display_name || "Unknown User"}
                  </p>
                  <p className="mt-1 truncate text-xs text-white/45">
                    {item.profiles?.email || "No email"}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-white/35">Balance</p>
                      <p className="mt-1 font-black text-white">
                        ${Number(item.profiles?.balance || 0).toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-white/35">Step</p>
                      <p className="mt-1 font-black text-white">
                        {item.profiles?.current_step || 1}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-white/35">
                    User Note / Proof
                  </p>

                  {item.note ? (
                    <p className="mt-2 max-h-24 overflow-y-auto text-xs leading-5 text-white/55">
                      {item.note}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-white/35">No user note</p>
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
                        alt="Deposit proof"
                        className="h-32 w-full object-cover"
                      />

                      <div className="border-t border-white/10 px-3 py-2 text-xs font-bold text-yellow-200">
                        Open deposit proof
                      </div>
                    </a>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-white/35">
                    Review Action
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
                        placeholder="Optional review note..."
                        className="mt-3 min-h-24 w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
                      />

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleReject(item.id)}
                          disabled={actionId === item.id}
                          className="flex items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-3 text-xs font-black text-red-300 hover:bg-red-500/15 disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>

                        <button
                          onClick={() => handleApprove(item.id)}
                          disabled={actionId === item.id}
                          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-3 py-3 text-xs font-black text-black disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-xs text-white/35">Reviewed Note</p>
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
          Showing{" "}
          <span className="font-black text-white">{firstResult}</span>
          {" - "}
          <span className="font-black text-white">{lastResult}</span>
          {" of "}
          <span className="font-black text-yellow-300">
            {filteredRecords.length}
          </span>{" "}
          requests
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white/70 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>

          <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black text-yellow-300">
            Page {currentPage} / {totalPages}
          </div>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white/70 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-1 truncate text-xl font-black text-yellow-300">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "approved"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
      : status === "rejected"
      ? "border-red-400/30 bg-red-500/10 text-red-300"
      : "border-yellow-400/30 bg-yellow-500/10 text-yellow-300";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black ${styles}`}>
      {status}
    </span>
  );
}