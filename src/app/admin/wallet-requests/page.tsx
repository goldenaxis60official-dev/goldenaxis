"use client";

import { useEffect, useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import AdminNav from "../AdminNav";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
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
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");

  const isAdmin = profile.role === "admin";

  async function loadRecords() {
    setLoading(true);
    setErrorText("");

    let query = supabase
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

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;

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
  }, [isAdmin, filter]);

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
  const totalAmount = records.reduce(
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

        <div className="mb-6 grid grid-cols-4 gap-4">
          <StatCard label="Showing" value={String(records.length)} />
          <StatCard label="Pending" value={String(pendingCount)} />
          <StatCard label="Deposits" value={String(depositCount)} />
          <StatCard label="Total Amount" value={`$${totalAmount.toFixed(2)}`} />
        </div>

        <div className="mb-6 flex items-center justify-between gap-4 rounded-[2rem] border border-white/10 bg-white/[0.035] p-4">
          <div>
            <p className="text-sm text-yellow-200/80">Filter Requests</p>
            <h2 className="text-xl font-black capitalize">{filter}</h2>
          </div>

          <div className="grid grid-cols-4 gap-2">
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
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-200/80">Request Ledger</p>
              <h2 className="text-2xl font-black">Wallet Review Queue</h2>
            </div>

            <div className="rounded-2xl bg-black/30 px-4 py-3 text-sm text-white/50">
              Withdrawals:{" "}
              <span className="font-black text-yellow-300">
                {withdrawalCount}
              </span>
            </div>
          </div>

          {loading && (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center text-white/60">
              Loading wallet requests...
            </div>
          )}

          {!loading && records.length === 0 && (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center">
              <Clock className="mx-auto mb-4 h-12 w-12 text-yellow-300" />
              <p className="font-black">No requests found</p>
              <p className="mt-2 text-sm text-white/50">
                Wallet requests will appear here when users submit them.
              </p>
            </div>
          )}

          {!loading && records.length > 0 && (
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.06] text-xs uppercase tracking-wide text-white/45">
                  <tr>
                    <th className="px-4 py-3">Request</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Balance</th>
                    <th className="px-4 py-3">Step</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Admin Note</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {records.map((item) => {
                    const isDeposit = item.type === "deposit_credit";
                    const isPending = item.status === "pending";

                    return (
                      <tr key={item.id} className="bg-black/20 align-top">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
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
                              <p className="font-black">
                                {isDeposit
                                  ? "Deposit Credit"
                                  : "Withdrawal"}{" "}
                                Request
                              </p>
                              <p className="mt-1 text-xs text-white/45">
                                {new Date(item.created_at).toLocaleString()}
                              </p>
                              {item.note && (
                                <p className="mt-2 max-w-[260px] text-xs leading-5 text-white/50">
                                  User note: {item.note}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-bold">
                            {item.profiles?.display_name || "Unknown User"}
                          </p>
                          <p className="mt-1 text-xs text-white/45">
                            {item.profiles?.email || "No email"}
                          </p>
                        </td>

                        <td className="px-4 py-4 font-black text-yellow-300">
                          ${Number(item.amount).toFixed(2)}
                        </td>

                        <td className="px-4 py-4 text-white/70">
                          {item.method || "Manual"}
                        </td>

                        <td className="px-4 py-4 font-bold text-white">
                          ${Number(item.profiles?.balance || 0).toFixed(2)}
                        </td>

                        <td className="px-4 py-4 text-white/70">
                          {item.profiles?.current_step || 1}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge status={item.status} />
                        </td>

                        <td className="px-4 py-4">
                          {isPending ? (
                            <textarea
                              value={adminNotes[item.id] || ""}
                              onChange={(event) =>
                                setAdminNotes({
                                  ...adminNotes,
                                  [item.id]: event.target.value,
                                })
                              }
                              placeholder="Optional note..."
                              className="min-h-20 w-52 rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
                            />
                          ) : (
                            <p className="max-w-[220px] text-xs leading-5 text-white/50">
                              {item.admin_note || "-"}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          {isPending ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleReject(item.id)}
                                disabled={actionId === item.id}
                                className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-black text-red-300 disabled:opacity-50"
                              >
                                <XCircle className="h-4 w-4" />
                                Reject
                              </button>

                              <button
                                onClick={() => handleApprove(item.id)}
                                disabled={actionId === item.id}
                                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-3 py-2 text-xs font-black text-black disabled:opacity-50"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Approve
                              </button>
                            </div>
                          ) : (
                            <p className="text-right text-xs text-white/35">
                              Reviewed
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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