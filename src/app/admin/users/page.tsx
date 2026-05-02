//app>admin>users>page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RequireAuth from "@/components/auth/RequireAuth";
import AdminNav from "../AdminNav";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import {
  AlertCircle,
  CheckCircle,
  Crown,
  ListChecks,
  Pencil,
  Save,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

type ManagedUser = Profile & {
  admin_nickname: string | null;
};

export default function AdminUsersPage() {
  return (
    <RequireAuth>
      {(profile) => <AdminUsersContent profile={profile} />}
    </RequireAuth>
  );
}

function AdminUsersContent({ profile }: { profile: Profile }) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
const [nicknameUser, setNicknameUser] = useState<ManagedUser | null>(null);
const [nicknameValue, setNicknameValue] = useState("");

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

  const [profilesResult, notesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false }),

    supabase.from("admin_user_notes").select("user_id, nickname"),
  ]);

  if (profilesResult.error) {
    setErrorText(profilesResult.error.message);
    setLoading(false);
    return;
  }

  if (notesResult.error) {
    setErrorText(notesResult.error.message);
    setLoading(false);
    return;
  }

  const noteMap = new Map(
    ((notesResult.data || []) as { user_id: string; nickname: string | null }[]).map(
      (note) => [note.user_id, note.nickname]
    )
  );

  const mergedUsers = ((profilesResult.data || []) as Profile[]).map((user) => ({
    ...user,
    admin_nickname: noteMap.get(user.id) || null,
  }));

  setUsers(mergedUsers);
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
user.admin_nickname?.toLowerCase().includes(keyword) ||
user.referral_code?.toLowerCase().includes(keyword) ||
user.id.toLowerCase().includes(keyword)
      );
    });
  }, [users, searchText]);

  const adminCount = users.filter((user) => user.role === "admin").length;
  const activeCount = users.filter((user) => user.status === "active").length;
  const totalBalance = users.reduce(
    (sum, user) => sum + Number(user.balance || 0),
    0
  );

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

  async function handleSaveNickname() {
  if (!nicknameUser) return;

  setActionLoading(true);
  setSuccessText("");
  setErrorText("");

  const cleanNickname = nicknameValue.trim();

  const { error } = await supabase.from("admin_user_notes").upsert(
    {
      user_id: nicknameUser.id,
      nickname: cleanNickname || null,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    setErrorText(error.message);
    setActionLoading(false);
    return;
  }

  setUsers((currentUsers) =>
    currentUsers.map((user) =>
      user.id === nicknameUser.id
        ? { ...user, admin_nickname: cleanNickname || null }
        : user
    )
  );

  setSuccessText("Admin nickname saved successfully.");
  setNicknameUser(null);
  setNicknameValue("");
  setActionLoading(false);
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

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <AdminNav />

        <div className="mb-8 flex items-center justify-between gap-5">
          <div>
            <p className="text-sm font-bold text-yellow-200/80">
              Admin Control
            </p>
            <h1 className="mt-1 text-3xl font-black">User Manager</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Manage users, balances, invite codes, account status, and campaign
              progress.
            </p>
          </div>

          <Link
            href="/admin/user-tasks"
            className="flex items-center gap-2 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-3 text-sm font-black text-yellow-300 hover:bg-yellow-400/15"
          >
            <ListChecks className="h-4 w-4" />
            User Task Assignment
          </Link>
        </div>

        <div className="mb-6 grid grid-cols-4 gap-4">
          <StatCard label="Users" value={String(users.length)} />
          <StatCard label="Active" value={String(activeCount)} />
          <StatCard label="Admins" value={String(adminCount)} />
          <StatCard label="Total Balance" value={`$${totalBalance.toFixed(2)}`} />
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
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-yellow-200/80">Members</p>
              <h2 className="text-2xl font-black">Registered Users</h2>
            </div>

            <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
              <Search className="h-5 w-5 text-white/40" />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search name, email, nickname, invite code, ID..."
                className="w-full bg-transparent text-white outline-none placeholder:text-white/35"
              />
            </div>
          </div>

          {loading && (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center text-white/60">
              Loading users...
            </div>
          )}

          {!loading && filteredUsers.length === 0 && (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-yellow-300" />
              <p className="font-black">No users found</p>
              <p className="mt-2 text-sm text-white/50">
                Try another search keyword.
              </p>
            </div>
          )}

          {!loading && filteredUsers.length > 0 && (
            <div className="overflow-x-auto rounded-[1.5rem] border border-white/10">
  <table className="min-w-[1150px] w-full text-left text-sm">
                <thead className="bg-white/[0.06] text-xs uppercase tracking-wide text-white/45">
                  <tr>
                    <th className="px-4 py-3">User</th>
<th className="px-4 py-3">Admin Nickname</th>
<th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Balance</th>
                    <th className="px-4 py-3">Today</th>
                    <th className="px-4 py-3">Step</th>
                    <th className="px-4 py-3">Invite Code</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {filteredUsers.map((user) => {
                    const isUserAdmin = user.role === "admin";

                    return (
                      <tr key={user.id} className="bg-black/20">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
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
                              <p className="font-black">
                                {user.display_name || "Gold Member"}
                              </p>
                              <p className="mt-1 text-xs text-white/45">
                                {user.email || "No email"}
                              </p>
                              <p className="mt-1 max-w-[220px] truncate text-[10px] text-white/30">
                                {user.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
  <div className="min-w-[170px]">
    {user.admin_nickname ? (
      <p className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-2 text-xs font-black text-yellow-200">
        {user.admin_nickname}
      </p>
    ) : (
      <p className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/35">
        No nickname
      </p>
    )}

    <button
      onClick={() => {
        setNicknameUser(user);
        setNicknameValue(user.admin_nickname || "");
      }}
      className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-white/45 hover:text-yellow-300"
    >
      <Pencil className="h-3 w-3" />
      Edit
    </button>
  </div>
</td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              isUserAdmin
                                ? "bg-yellow-300 text-black"
                                : "bg-white/10 text-white/70"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>

                        <td className="px-4 py-4 font-black text-yellow-300">
                          ${Number(user.balance).toFixed(2)}
                        </td>

                        <td className="px-4 py-4 font-bold text-emerald-300">
                          ${Number(user.today_earnings).toFixed(2)}
                        </td>

                        <td className="px-4 py-4 font-bold text-white">
                          {user.current_step}
                        </td>

                        <td className="px-4 py-4 text-yellow-200">
                          {user.referral_code || "-"}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              user.status === "active"
                                ? "bg-emerald-400/15 text-emerald-300"
                                : "bg-red-500/15 text-red-300"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/admin/user-tasks?user=${user.id}`}
                              className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-2 text-yellow-300"
                              title="Manage user tasks"
                            >
                              <ListChecks className="h-4 w-4" />
                            </Link>

                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setAdjustAmount(100);
                                setAdjustNote("");
                              }}
                              className="rounded-xl border border-white/10 bg-white/[0.06] p-2 text-white/70"
                              title="Adjust balance"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selectedUser && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-[2rem] border border-yellow-400/20 bg-[#090909] p-6 shadow-[0_0_60px_rgba(212,175,55,0.16)]">
              <div className="mb-6 flex items-center justify-between">
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

              <div className="mb-5 grid grid-cols-3 gap-3">
                <MiniBox
                  label="User"
                  value={selectedUser.display_name || "Gold Member"}
                />
                <MiniBox
                  label="Balance"
                  value={`$${Number(selectedUser.balance).toFixed(2)}`}
                  color="gold"
                />
                <MiniBox label="Step" value={String(selectedUser.current_step)} />
              </div>

              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-bold text-white/80">
                    Adjustment Amount
                  </p>
                  <input
                    value={adjustAmount}
                    onChange={(event) =>
                      setAdjustAmount(Number(event.target.value))
                    }
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
                    onChange={(event) => setAdjustNote(event.target.value)}
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

        {nicknameUser && (
  <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
    <div className="w-full max-w-lg rounded-[2rem] border border-yellow-400/20 bg-[#090909] p-6 shadow-[0_0_60px_rgba(212,175,55,0.16)]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-yellow-200/80">Private Admin Label</p>
          <h2 className="text-2xl font-black">Edit Admin Nickname</h2>
        </div>

        <button
          onClick={() => {
            setNicknameUser(null);
            setNicknameValue("");
          }}
          className="rounded-2xl bg-white/10 p-3 text-white/70"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <MiniBox
          label="User"
          value={nicknameUser.display_name || "Gold Member"}
        />
        <MiniBox
          label="Email"
          value={nicknameUser.email || "No email"}
          color="gold"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-white/80">
          Admin Nickname
        </p>

        <input
          value={nicknameValue}
          onChange={(event) => setNicknameValue(event.target.value)}
          placeholder="Example: John's friend / VIP user / Telegram A"
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
        />

        <p className="mt-2 text-xs text-white/45">
          This nickname is private for admin control only. Normal users cannot
          see this label.
        </p>
      </div>

      <button
        onClick={handleSaveNickname}
        disabled={actionLoading}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:opacity-60"
      >
        <Save className="h-5 w-5" />
        {actionLoading ? "Saving..." : "Save Nickname"}
      </button>
    </div>
  </div>
)}
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