//app>admin>users>page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  Crown,
  ListChecks,
  Pencil,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";

type ManagedUser = Profile & {
  admin_nickname: string | null;
};

type AdminUsersText = typeof en.adminUsers;

export default function AdminUsersPage() {
  return (
    <RequireAuth>
      {(profile) => <AdminUsersContent profile={profile} />}
    </RequireAuth>
  );
}

function AdminUsersContent({ profile }: { profile: Profile }) {
  const currentLanguage = profile.language === "zh" ? "zh" : "en";

  const t: AdminUsersText =
    currentLanguage === "zh"
      ? (zh.adminUsers as unknown as AdminUsersText)
      : en.adminUsers;

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState<
  "all" | "user" | "admin" | "super" | "support"
>("all");
const [statusFilter, setStatusFilter] = useState("all");
const [sortBy, setSortBy] = useState<
  "newest" | "name" | "balance_high" | "today_high" | "step_high"
>("newest");
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(10);
const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
const [nicknameUser, setNicknameUser] = useState<ManagedUser | null>(null);
const [nicknameValue, setNicknameValue] = useState("");

const [referralUser, setReferralUser] = useState<ManagedUser | null>(null);
const [referralValue, setReferralValue] = useState("");

const [deleteUser, setDeleteUser] = useState<ManagedUser | null>(null);
const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [adjustAmount, setAdjustAmount] = useState(100);
  const [adjustNote, setAdjustNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");

  const hasPageAccess = canAccessAdminPath(profile.role, "/admin/users");

  async function loadUsers() {
  setLoading(true);
  setErrorText("");

  const [profilesResult, notesResult] = await Promise.all([
    supabase
  .from("profiles")
  .select("*")
  .neq("status", "deleted")
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
    if (hasPageAccess) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [hasPageAccess]);

  const userStatuses = useMemo(() => {
  return Array.from(
    new Set(users.map((user) => user.status).filter(Boolean))
  );
}, [users]);

const filteredUsers = useMemo(() => {
  const keyword = searchText.toLowerCase().trim();

  const result = users.filter((user) => {
    const matchesSearch =
      !keyword ||
      user.display_name?.toLowerCase().includes(keyword) ||
      user.email?.toLowerCase().includes(keyword) ||
      user.admin_nickname?.toLowerCase().includes(keyword) ||
      user.referral_code?.toLowerCase().includes(keyword) ||
      user.id.toLowerCase().includes(keyword);

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return [...result].sort((a, b) => {
    if (sortBy === "name") {
      return (a.display_name || "").localeCompare(b.display_name || "");
    }

    if (sortBy === "balance_high") {
      return Number(b.balance || 0) - Number(a.balance || 0);
    }

    if (sortBy === "today_high") {
      return Number(b.today_earnings || 0) - Number(a.today_earnings || 0);
    }

    if (sortBy === "step_high") {
      return Number(b.current_step || 0) - Number(a.current_step || 0);
    }

    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
}, [users, searchText, roleFilter, statusFilter, sortBy]);

const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

const paginatedUsers = useMemo(() => {
  const start = (currentPage - 1) * pageSize;
  return filteredUsers.slice(start, start + pageSize);
}, [filteredUsers, currentPage, pageSize]);

const firstResult =
  filteredUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;

const lastResult = Math.min(currentPage * pageSize, filteredUsers.length);

useEffect(() => {
  setCurrentPage(1);
}, [searchText, roleFilter, statusFilter, sortBy, pageSize]);

useEffect(() => {
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }
}, [currentPage, totalPages]);

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
      input_note: adjustNote || t.adjustModal.defaultNote,
    });

    if (error) {
      setErrorText(error.message);
      setActionLoading(false);
      return;
    }

    setSuccessText(t.messages.balanceAdjusted);
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

  setSuccessText(t.messages.nicknameSaved);
  setNicknameUser(null);
  setNicknameValue("");
  setActionLoading(false);
}

async function handleSaveReferralCode() {
  if (!referralUser) return;

  const cleanCode = referralValue
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 20);

  if (cleanCode.length < 4) {
    setErrorText(t.messages.referralCodeInvalid);
    return;
  }

  setActionLoading(true);
  setSuccessText("");
  setErrorText("");

  const { error } = await supabase
    .from("profiles")
    .update({ referral_code: cleanCode })
    .eq("id", referralUser.id);

  if (error) {
    if (
      error.code === "23505" ||
      error.message.toLowerCase().includes("duplicate") ||
      error.message.toLowerCase().includes("unique")
    ) {
      setErrorText(t.messages.referralCodeDuplicate);
    } else {
      setErrorText(error.message);
    }

    setActionLoading(false);
    return;
  }

  setUsers((currentUsers) =>
    currentUsers.map((user) =>
      user.id === referralUser.id
        ? { ...user, referral_code: cleanCode }
        : user
    )
  );

  setSuccessText(t.messages.referralCodeSaved);
  setReferralUser(null);
  setReferralValue("");
  setActionLoading(false);
}

async function handleDeleteUser() {
  if (!deleteUser) return;

  if (deleteUser.id === profile.id) {
    setErrorText(t.messages.cannotDeleteSelf);
    return;
  }

  if (deleteUser.role === "admin") {
    setErrorText(t.messages.cannotDeleteAdmin);
    return;
  }

  if (deleteConfirmText !== "DELETE") {
    setErrorText(t.messages.typeDelete);
    return;
  }

  setActionLoading(true);
  setSuccessText("");
  setErrorText("");

  const { error } = await supabase
    .from("profiles")
    .update({ status: "deleted" })
    .eq("id", deleteUser.id);

  if (error) {
    setErrorText(error.message);
    setActionLoading(false);
    return;
  }

  setUsers((currentUsers) =>
    currentUsers.filter((user) => user.id !== deleteUser.id)
  );

  setSuccessText(t.messages.userRemoved);
  setDeleteUser(null);
  setDeleteConfirmText("");
  setActionLoading(false);
}

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
          </div>

          <Link
            href="/admin/user-tasks"
            className="flex items-center gap-2 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-3 text-sm font-black text-yellow-300 hover:bg-yellow-400/15"
          >
            <ListChecks className="h-4 w-4" />
            {t.userTaskAssignment}
          </Link>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label={t.stats.users} value={String(users.length)} />
<StatCard label={t.stats.active} value={String(activeCount)} />
<StatCard label={t.stats.admins} value={String(adminCount)} />
<StatCard label={t.stats.totalBalance} value={`$${totalBalance.toFixed(2)}`} />
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
  <div className="mb-5 flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
    <div>
      <p className="text-sm text-yellow-200/80">{t.list.members}</p>
<h2 className="text-2xl font-black">{t.list.registeredUsers}</h2>
<p className="mt-1 text-xs text-white/40">
  {t.list.description}
</p>
    </div>

    <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm font-black text-yellow-300">
      {filteredUsers.length} {t.list.shown} / {users.length} {t.list.total}
    </div>
  </div>

  <div className="mb-5 grid grid-cols-1 gap-3 xl:grid-cols-[1.5fr_0.7fr_0.8fr_0.9fr_0.6fr]">
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
      <input
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
        placeholder={t.list.searchPlaceholder}
        className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-yellow-400/50"
      />
    </div>

    <select
      value={roleFilter}
      onChange={(event) =>
  setRoleFilter(
    event.target.value as "all" | "user" | "admin" | "super" | "support"
  )
}
      className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400/50"
    >
      <option className="bg-black" value="all">
        {t.list.allRoles}
      </option>
      <option className="bg-black" value="user">
        {t.list.users}
      </option>
      <option className="bg-black" value="super">
  Super
</option>
<option className="bg-black" value="support">
  Support
</option>
    </select>

    <select
      value={statusFilter}
      onChange={(event) => setStatusFilter(event.target.value)}
      className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400/50"
    >
      <option className="bg-black" value="all">
        {t.list.allStatus}
      </option>

      {userStatuses.map((status) => (
        <option key={status} className="bg-black" value={status}>
          {status}
        </option>
      ))}
    </select>

    <select
      value={sortBy}
      onChange={(event) =>
        setSortBy(
          event.target.value as
            | "newest"
            | "name"
            | "balance_high"
            | "today_high"
            | "step_high"
        )
      }
      className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400/50"
    >
      <option className="bg-black" value="newest">
        {t.list.newestFirst}
      </option>
      <option className="bg-black" value="name">
        {t.list.nameAZ}
      </option>
      <option className="bg-black" value="balance_high">
        {t.list.balanceHigh}
      </option>
      <option className="bg-black" value="today_high">
        {t.list.todayHigh}
      </option>
      <option className="bg-black" value="step_high">
        {t.list.stepHigh}
      </option>
    </select>

    <select
      value={pageSize}
      onChange={(event) => setPageSize(Number(event.target.value))}
      className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400/50"
    >
      <option className="bg-black" value={10}>
        10
      </option>
      <option className="bg-black" value={25}>
        25
      </option>
      <option className="bg-black" value={50}>
        50
      </option>
      <option className="bg-black" value={100}>
        100
      </option>
    </select>
  </div>

  {loading && (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center text-white/60">
      {t.list.loading}
    </div>
  )}

  {!loading && filteredUsers.length === 0 && (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center">
      <Users className="mx-auto mb-4 h-12 w-12 text-yellow-300" />
      <p className="font-black">{t.list.noUsersFound}</p>
<p className="mt-2 text-sm text-white/50">
  {t.list.noUsersFoundDescription}
</p>
    </div>
  )}

  {!loading && filteredUsers.length > 0 && (
    <>
      <div className="max-h-[650px] overflow-auto rounded-[1.5rem] border border-white/10">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[#151515] text-xs uppercase tracking-wide text-white/45">
            <tr>
              <th className="px-4 py-3">{t.list.user}</th>
<th className="px-4 py-3">{t.list.adminNickname}</th>
<th className="px-4 py-3">{t.list.role}</th>
<th className="px-4 py-3">{t.list.balance}</th>
<th className="px-4 py-3">{t.list.today}</th>
<th className="px-4 py-3">{t.list.step}</th>
<th className="px-4 py-3">{t.list.inviteCode}</th>
<th className="px-4 py-3">{t.list.status}</th>
<th className="px-4 py-3 text-right">{t.list.actions}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {paginatedUsers.map((user) => {
              const isUserAdmin = user.role === "admin";

              return (
                <tr
                  key={user.id}
                  className="bg-black/20 transition hover:bg-white/[0.04]"
                >
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
                          {user.display_name || t.list.fallbackName}
                        </p>
                        <p className="mt-1 text-xs text-white/45">
                          {user.email || t.list.noEmail}
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
                          {t.list.noNickname}
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
                        {t.list.edit}
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

                  <td className="px-4 py-4">
  <div className="min-w-[130px]">
    <p className="font-black text-yellow-200">
      {user.referral_code || "-"}
    </p>

    <button
      onClick={() => {
        setReferralUser(user);
        setReferralValue(user.referral_code || "");
      }}
      className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-white/45 hover:text-yellow-300"
    >
      <Pencil className="h-3 w-3" />
      {t.list.edit}
    </button>
  </div>
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
                        className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-2 text-yellow-300 hover:bg-yellow-400/15"
                        title={t.list.manageUserTasks}
                      >
                        <ListChecks className="h-4 w-4" />
                      </Link>

                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setAdjustAmount(100);
                          setAdjustNote("");
                        }}
                        className="rounded-xl border border-white/10 bg-white/[0.06] p-2 text-white/70 hover:bg-white/[0.1]"
                        title={t.list.adjustBalance}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
  onClick={() => {
    setDeleteUser(user);
    setDeleteConfirmText("");
  }}
  disabled={user.id === profile.id || user.role === "admin"}
  className="rounded-xl border border-red-400/30 bg-red-500/10 p-2 text-red-300 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-35"
  title={t.list.removeUser}
>
  <Trash2 className="h-4 w-4" />
</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
    {filteredUsers.length}
  </span>{" "}
  {t.list.users}
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

        {selectedUser && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-[2rem] border border-yellow-400/20 bg-[#090909] p-6 shadow-[0_0_60px_rgba(212,175,55,0.16)]">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-200/80">{t.adjustModal.tag}</p>
<h2 className="text-2xl font-black">{t.adjustModal.title}</h2>
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
                  label={t.adjustModal.user}
value={selectedUser.display_name || t.list.fallbackName}
                />
                <MiniBox
                  label={t.adjustModal.balance}
                  value={`$${Number(selectedUser.balance).toFixed(2)}`}
                  color="gold"
                />
                <MiniBox label={t.adjustModal.step} value={String(selectedUser.current_step)} />
              </div>

              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-bold text-white/80">
                    {t.adjustModal.amount}
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
                    {t.adjustModal.amountHelp}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-sm font-bold text-white/80">
                    {t.adjustModal.note}
                  </p>
                  <textarea
                    value={adjustNote}
                    onChange={(event) => setAdjustNote(event.target.value)}
                    placeholder={t.adjustModal.notePlaceholder}
                    className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
                  />
                </div>

                <button
                  onClick={handleAdjustBalance}
                  disabled={actionLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:opacity-60"
                >
                  <Save className="h-5 w-5" />
                  {actionLoading ? t.adjustModal.saving : t.adjustModal.saveAdjustment}
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteUser && (
  <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
    <div className="w-full max-w-lg rounded-[2rem] border border-red-400/25 bg-[#090909] p-6 shadow-[0_0_60px_rgba(239,68,68,0.16)]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-red-300/80">{t.deleteModal.tag}</p>
<h2 className="text-2xl font-black">{t.deleteModal.title}</h2>
        </div>

        <button
          onClick={() => {
            setDeleteUser(null);
            setDeleteConfirmText("");
          }}
          className="rounded-2xl bg-white/10 p-3 text-white/70"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <MiniBox
          label={t.deleteModal.user}
value={deleteUser.display_name || t.list.fallbackName}
        />
        <MiniBox
          label={t.deleteModal.email}
value={deleteUser.email || t.list.noEmail}
          color="gold"
        />
      </div>

      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm leading-6 text-red-100/75">
        {t.deleteModal.warningStart}{" "}
<span className="font-black text-red-200">DELETE</span>{" "}
{t.deleteModal.warningEnd}
      </div>

      <div className="mt-5">
        <p className="mb-2 text-sm font-bold text-white/80">
          {t.deleteModal.confirmDelete}
        </p>

        <input
          value={deleteConfirmText}
          onChange={(event) => setDeleteConfirmText(event.target.value)}
          placeholder={t.deleteModal.typeDeletePlaceholder}
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-red-400/50"
        />
      </div>

      <button
        onClick={handleDeleteUser}
        disabled={actionLoading || deleteConfirmText !== "DELETE"}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/20 px-5 py-4 font-black text-red-100 hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 className="h-5 w-5" />
        {actionLoading ? t.deleteModal.removing : t.deleteModal.removeUser}
      </button>
    </div>
  </div>
)}

        {nicknameUser && (
  <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
    <div className="w-full max-w-lg rounded-[2rem] border border-yellow-400/20 bg-[#090909] p-6 shadow-[0_0_60px_rgba(212,175,55,0.16)]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-yellow-200/80">{t.nicknameModal.tag}</p>
<h2 className="text-2xl font-black">{t.nicknameModal.title}</h2>
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
          label={t.nicknameModal.user}
value={nicknameUser.display_name || t.list.fallbackName}
        />
        <MiniBox
          label={t.nicknameModal.email}
value={nicknameUser.email || t.list.noEmail}
          color="gold"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-white/80">
          {t.nicknameModal.adminNickname}
        </p>

        <input
          value={nicknameValue}
          onChange={(event) => setNicknameValue(event.target.value)}
          placeholder={t.nicknameModal.placeholder}
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
        />

        <p className="mt-2 text-xs text-white/45">
          {t.nicknameModal.note}
        </p>
      </div>

      <button
        onClick={handleSaveNickname}
        disabled={actionLoading}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:opacity-60"
      >
        <Save className="h-5 w-5" />
        {actionLoading ? t.nicknameModal.saving : t.nicknameModal.saveNickname}
      </button>
    </div>
  </div>
)}
      </div>

      {referralUser && (
  <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
    <div className="w-full max-w-lg rounded-[2rem] border border-yellow-400/20 bg-[#090909] p-6 shadow-[0_0_60px_rgba(212,175,55,0.16)]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-yellow-200/80">
            {t.referralModal.tag}
          </p>
          <h2 className="text-2xl font-black">
            {t.referralModal.title}
          </h2>
        </div>

        <button
          onClick={() => {
            setReferralUser(null);
            setReferralValue("");
          }}
          className="rounded-2xl bg-white/10 p-3 text-white/70"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <MiniBox
          label={t.referralModal.user}
          value={referralUser.display_name || t.list.fallbackName}
        />
        <MiniBox
          label={t.referralModal.currentCode}
          value={referralUser.referral_code || "-"}
          color="gold"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-white/80">
          {t.referralModal.referralCode}
        </p>

        <input
          value={referralValue}
          onChange={(event) =>
            setReferralValue(
              event.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9_-]/g, "")
                .slice(0, 20)
            )
          }
          placeholder={t.referralModal.placeholder}
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
        />

        <p className="mt-2 text-xs text-white/45">
          {t.referralModal.note}
        </p>
      </div>

      <button
        onClick={handleSaveReferralCode}
        disabled={actionLoading}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:opacity-60"
      >
        <Save className="h-5 w-5" />
        {actionLoading
          ? t.referralModal.saving
          : t.referralModal.saveReferralCode}
      </button>
    </div>
  </div>
)}
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