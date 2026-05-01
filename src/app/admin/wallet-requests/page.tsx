"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import {
  Wallet,
  AlertCircle,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Upload,
  Download,
  Clock,
} from "lucide-react";

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
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">(
    "pending"
  );
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
      <AppShell>
        <section className="px-5 pt-8">
          <div className="rounded-[2rem] border border-red-400/30 bg-red-500/10 p-6 text-center">
            <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-red-300" />
            <h1 className="text-2xl font-black">Admin Access Required</h1>
            <p className="mt-2 text-sm text-white/55">
              This page is only available for admin accounts.
            </p>
          </div>
        </section>
      </AppShell>
    );
  }

  const pendingCount = records.filter((item) => item.status === "pending").length;

  return (
    <AppShell>
      <section className="px-5 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">Admin Control</p>
            <h1 className="text-2xl font-black">Wallet Requests</h1>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <Wallet className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3">
          <StatBox label="Showing" value={String(records.length)} />
          <StatBox label="Pending" value={String(pendingCount)} />
          <StatBox label="Filter" value={filter} />
        </div>

        <div className="mb-5 grid grid-cols-4 gap-2">
          {["pending", "approved", "rejected", "all"].map((item) => (
            <button
              key={item}
              onClick={() =>
                setFilter(item as "pending" | "approved" | "rejected" | "all")
              }
              className={`rounded-2xl border px-2 py-3 text-xs font-bold capitalize ${
                filter === item
                  ? "border-yellow-400 bg-yellow-400 text-black"
                  : "border-white/10 bg-white/[0.06] text-white/60"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {successText && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle className="h-4 w-4" />
            {successText}
          </div>
        )}

        {errorText && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="h-4 w-4" />
            {errorText}
          </div>
        )}

        {loading && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 text-center text-white/60">
            Loading wallet requests...
          </div>
        )}

        {!loading && records.length === 0 && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center">
            <Clock className="mx-auto mb-3 h-9 w-9 text-yellow-300" />
            <p className="font-bold">No requests found</p>
            <p className="mt-2 text-sm text-white/50">
              Wallet requests will appear here when users submit them.
            </p>
          </div>
        )}

        <div className="space-y-4 pb-6">
          {records.map((item) => {
            const isDeposit = item.type === "deposit_credit";
            const isPending = item.status === "pending";

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
                      <h3 className="font-black">
                        {isDeposit ? "Deposit Credit" : "Withdrawal"} Request
                      </h3>

                      <p className="mt-1 text-xs text-white/45">
                        {new Date(item.created_at).toLocaleString()}
                      </p>

                      <p className="mt-2 text-sm text-white/60">
                        {item.profiles?.display_name || "Unknown User"} •{" "}
                        {item.profiles?.email || "No email"}
                      </p>
                    </div>
                  </div>

                  <StatusBadge status={item.status} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <MiniBox
                    label="Amount"
                    value={`$${Number(item.amount).toFixed(2)}`}
                    color="gold"
                  />
                  <MiniBox
                    label="User Balance"
                    value={`$${Number(item.profiles?.balance || 0).toFixed(2)}`}
                  />
                  <MiniBox label="Method" value={item.method || "Manual"} />
                  <MiniBox
                    label="User Step"
                    value={`${item.profiles?.current_step || 1}/80`}
                  />
                </div>

                {item.note && (
                  <div className="mt-3 rounded-2xl bg-black/30 p-3">
                    <p className="text-xs text-white/45">User Note</p>
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

                {isPending && (
                  <>
                    <textarea
                      value={adminNotes[item.id] || ""}
                      onChange={(e) =>
                        setAdminNotes({
                          ...adminNotes,
                          [item.id]: e.target.value,
                        })
                      }
                      placeholder="Admin note optional..."
                      className="mt-3 min-h-20 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
                    />

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleReject(item.id)}
                        disabled={actionId === item.id}
                        className="flex items-center justify-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 font-black text-red-300 disabled:opacity-50"
                      >
                        <XCircle className="h-5 w-5" />
                        Reject
                      </button>

                      <button
                        onClick={() => handleApprove(item.id)}
                        disabled={actionId === item.id}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-4 py-3 font-black text-black disabled:opacity-50"
                      >
                        <CheckCircle className="h-5 w-5" />
                        Approve
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-1 truncate font-bold text-yellow-300">{value}</p>
    </div>
  );
}

function MiniBox({
  label,
  value,
  color = "white",
}: {
  label: string;
  value: string;
  color?: "white" | "gold";
}) {
  return (
    <div className="rounded-2xl bg-black/30 p-3">
      <p className="text-xs text-white/45">{label}</p>
      <p
        className={`mt-1 truncate font-bold ${
          color === "gold" ? "text-yellow-300" : "text-white/75"
        }`}
      >
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
    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${styles}`}>
      {status}
    </span>
  );
}