"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import {
  Users,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Search,
  Wallet,
  Crown,
  Pencil,
  X,
  Save,
} from "lucide-react";

export default function AdminUsersPage() {
  return (
    <RequireAuth>
      {(profile) => <AdminUsersContent profile={profile} />}
    </RequireAuth>
  );
}

function AdminUsersContent({ profile }: { profile: Profile }) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  const [adjustAmount, setAdjustAmount] = useState(100);
  const [adjustNote, setAdjustNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");

  const isAdmin = profile.role === "admin";

  async function loadUsers() {
    setLoading(true);
    setErrorText("");

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorText(error.message);
      setLoading(false);
      return;
    }

    setUsers((data || []) as Profile[]);
    setLoading(false);
  }

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const filteredUsers = useMemo(() => {
    const keyword = searchText.toLowerCase().trim();

    if (!keyword) return users;

    return users.filter((user) => {
      return (
        user.display_name?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        user.referral_code?.toLowerCase().includes(keyword) ||
        user.id.toLowerCase().includes(keyword)
      );
    });
  }, [users, searchText]);

  async function handleAdjustBalance() {
    if (!selectedUser) return;

    setActionLoading(true);
    setSuccessText("");
    setErrorText("");

    const { error } = await supabase.rpc("admin_adjust_user_balance", {
      input_user_id: selectedUser.id,
      input_amount: adjustAmount,
      input_note: adjustNote || "Admin balance adjustment",
    });

    if (error) {
      setErrorText(error.message);
      setActionLoading(false);
      return;
    }

    setSuccessText("User balance adjusted successfully.");
    setSelectedUser(null);
    setAdjustAmount(100);
    setAdjustNote("");
    setActionLoading(false);
    loadUsers();
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

  const adminCount = users.filter((user) => user.role === "admin").length;
  const activeCount = users.filter((user) => user.status === "active").length;

  return (
    <AppShell>
      <section className="px-5 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">Admin Control</p>
            <h1 className="text-2xl font-black">User Manager</h1>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <Users className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3">
          <StatBox label="Users" value={String(users.length)} />
          <StatBox label="Active" value={String(activeCount)} />
          <StatBox label="Admins" value={String(adminCount)} />
        </div>

        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
          <Search className="h-5 w-5 text-white/40" />
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search name, email, invite code..."
            className="w-full bg-transparent text-white outline-none placeholder:text-white/35"
          />
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
            Loading users...
          </div>
        )}

        {!loading && filteredUsers.length === 0 && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center">
            <Users className="mx-auto mb-3 h-9 w-9 text-yellow-300" />
            <p className="font-bold">No users found</p>
            <p className="mt-2 text-sm text-white/50">
              Try another search keyword.
            </p>
          </div>
        )}

        <div className="space-y-4 pb-6">
          {filteredUsers.map((user) => {
            const isUserAdmin = user.role === "admin";

            return (
              <div
                key={user.id}
                className="rounded-[1.7rem] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                        isUserAdmin
                          ? "bg-yellow-400/10 text-yellow-300"
                          : "bg-blue-400/10 text-blue-300"
                      }`}
                    >
                      {isUserAdmin ? (
                        <Crown className="h-6 w-6" />
                      ) : (
                        <Users className="h-6 w-6" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black">
                          {user.display_name || "Gold Member"}
                        </h3>

                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                            isUserAdmin
                              ? "bg-yellow-300 text-black"
                              : "bg-white/10 text-white/60"
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-white/45">
                        {user.email || "No email"}
                      </p>

                      <p className="mt-1 text-xs text-yellow-300">
                        Invite: {user.referral_code}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      user.status === "active"
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-red-400/10 text-red-300"
                    }`}
                  >
                    {user.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <MiniBox
                    label="Balance"
                    value={`$${Number(user.balance).toFixed(2)}`}
                    color="gold"
                  />
                  <MiniBox
                    label="Today"
                    value={`$${Number(user.today_earnings).toFixed(2)}`}
                  />
                  <MiniBox
                    label="Step"
                    value={`${Math.min(user.current_step - 1, 80)}/80`}
                  />
                </div>

                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setAdjustAmount(100);
                    setAdjustNote("");
                  }}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-3 text-sm font-black text-yellow-300"
                >
                  <Pencil className="h-4 w-4" />
                  Adjust Balance
                </button>
              </div>
            );
          })}
        </div>

        {selectedUser && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 px-4 pb-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[2rem] border border-yellow-400/20 bg-[#090909] p-5 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-200/80">Admin Action</p>
                  <h2 className="text-2xl font-black">Adjust Balance</h2>
                </div>

                <button
                  onClick={() => setSelectedUser(null)}
                  className="rounded-2xl bg-white/10 p-3 text-white/70"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <p className="font-bold">
                  {selectedUser.display_name || "Gold Member"}
                </p>
                <p className="mt-1 text-sm text-white/45">
                  Current balance: ${Number(selectedUser.balance).toFixed(2)}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-bold text-white/80">
                    Adjustment Amount
                  </p>
                  <input
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(Number(e.target.value))}
                    type="number"
                    step="0.01"
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-400/50"
                  />
                  <p className="mt-2 text-xs text-white/45">
                    Use positive amount to add balance. Use negative amount to
                    deduct balance.
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-sm font-bold text-white/80">
                    Admin Note
                  </p>
                  <textarea
                    value={adjustNote}
                    onChange={(e) => setAdjustNote(e.target.value)}
                    placeholder="Example: Manual test credit"
                    className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
                  />
                </div>

                <button
                  onClick={handleAdjustBalance}
                  disabled={actionLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:opacity-60"
                >
                  <Save className="h-5 w-5" />
                  {actionLoading ? "Saving..." : "Save Adjustment"}
                </button>
              </div>
            </div>
          </div>
        )}
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