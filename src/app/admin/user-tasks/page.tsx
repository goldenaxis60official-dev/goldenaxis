//src>app>admin>user-tasks>page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { en } from "@/i18n/en";
import { zh } from "@/i18n/zh";
import RequireAuth from "@/components/auth/RequireAuth";
import AdminNav from "../AdminNav";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import type { Task } from "@/types/task";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Crown,
  Gem,
  ListChecks,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  Users,
} from "lucide-react";

type UserTaskAssignment = {
  id: string;
  user_id: string;
  task_id: string;
  assigned_step: number;
  is_active: boolean;
  created_at: string;
  tasks: Task | null;
};

type AdminUserTasksText = typeof en.adminUserTasks;

export default function AdminUserTasksPage() {
  return (
    <RequireAuth>
      {(profile) => <AdminUserTasksContent profile={profile} />}
    </RequireAuth>
  );
}

function AdminUserTasksContent({ profile }: { profile: Profile }) {
  const searchParams = useSearchParams();
  const queryUserId = searchParams.get("user");

  const isAdmin = profile.role === "admin";
  const currentLanguage = profile.language === "zh" ? "zh" : "en";

  const t: AdminUserTasksText =
    currentLanguage === "zh"
      ? (zh.adminUserTasks as unknown as AdminUserTasksText)
      : en.adminUserTasks;

  const [users, setUsers] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignments, setAssignments] = useState<UserTaskAssignment[]>([]);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [assignedStep, setAssignedStep] = useState(1);

  const [searchText, setSearchText] = useState("");
  const [userCurrentPage, setUserCurrentPage] = useState(1);

const [assignmentSearchText, setAssignmentSearchText] = useState("");
const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<
  "all" | "active" | "inactive"
>("all");
const [assignmentTypeFilter, setAssignmentTypeFilter] = useState<
  "all" | "standard" | "lucky_bonus"
>("all");
const [assignmentSortBy, setAssignmentSortBy] = useState<
  "step_asc" | "step_desc" | "reward_high" | "price_high"
>("step_asc");
const [assignmentCurrentPage, setAssignmentCurrentPage] = useState(1);
const [assignmentPageSize, setAssignmentPageSize] = useState(10);

  const [loading, setLoading] = useState(true);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");

  const selectedUser =
    users.find((user) => user.id === selectedUserId) || null;

  const activeAssignments = assignments.filter(
    (assignment) => assignment.is_active
  );

  const nextAvailableStep = useMemo(() => {
    for (let step = 1; step <= 80; step++) {
      const exists = assignments.some(
        (assignment) => assignment.assigned_step === step
      );

      if (!exists) return step;
    }

    return 80;
  }, [assignments]);

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

  const userPageSize = 8;

const userTotalPages = Math.max(
  1,
  Math.ceil(filteredUsers.length / userPageSize)
);

const paginatedUsers = useMemo(() => {
  const start = (userCurrentPage - 1) * userPageSize;
  return filteredUsers.slice(start, start + userPageSize);
}, [filteredUsers, userCurrentPage]);

const userFirstResult =
  filteredUsers.length === 0 ? 0 : (userCurrentPage - 1) * userPageSize + 1;

const userLastResult = Math.min(
  userCurrentPage * userPageSize,
  filteredUsers.length
);

function getAssignmentReward(assignment: UserTaskAssignment) {
  const task = assignment.tasks;

  if (!task) return 0;

  return (
    Number(task.price) *
    Number(task.commission_rate) *
    Number(task.multiplier)
  );
}

const filteredAssignments = useMemo(() => {
  const keyword = assignmentSearchText.toLowerCase().trim();

  const result = assignments.filter((assignment) => {
    const task = assignment.tasks;
    const product = task?.products;

    const matchesSearch =
      !keyword ||
      String(assignment.assigned_step).includes(keyword) ||
      task?.title?.toLowerCase().includes(keyword) ||
      task?.category?.toLowerCase().includes(keyword) ||
      task?.task_type?.toLowerCase().includes(keyword) ||
      product?.name?.toLowerCase().includes(keyword) ||
      product?.category?.toLowerCase().includes(keyword);

    const matchesStatus =
      assignmentStatusFilter === "all" ||
      (assignmentStatusFilter === "active" && assignment.is_active) ||
      (assignmentStatusFilter === "inactive" && !assignment.is_active);

    const matchesType =
      assignmentTypeFilter === "all" ||
      task?.task_type === assignmentTypeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return [...result].sort((a, b) => {
    if (assignmentSortBy === "step_desc") {
      return Number(b.assigned_step) - Number(a.assigned_step);
    }

    if (assignmentSortBy === "reward_high") {
      return getAssignmentReward(b) - getAssignmentReward(a);
    }

    if (assignmentSortBy === "price_high") {
      return Number(b.tasks?.price || 0) - Number(a.tasks?.price || 0);
    }

    return Number(a.assigned_step) - Number(b.assigned_step);
  });
}, [
  assignments,
  assignmentSearchText,
  assignmentStatusFilter,
  assignmentTypeFilter,
  assignmentSortBy,
]);

const assignmentTotalPages = Math.max(
  1,
  Math.ceil(filteredAssignments.length / assignmentPageSize)
);

const paginatedAssignments = useMemo(() => {
  const start = (assignmentCurrentPage - 1) * assignmentPageSize;
  return filteredAssignments.slice(start, start + assignmentPageSize);
}, [filteredAssignments, assignmentCurrentPage, assignmentPageSize]);

const assignmentFirstResult =
  filteredAssignments.length === 0
    ? 0
    : (assignmentCurrentPage - 1) * assignmentPageSize + 1;

const assignmentLastResult = Math.min(
  assignmentCurrentPage * assignmentPageSize,
  filteredAssignments.length
);

useEffect(() => {
  setUserCurrentPage(1);
}, [searchText]);

useEffect(() => {
  if (userCurrentPage > userTotalPages) {
    setUserCurrentPage(userTotalPages);
  }
}, [userCurrentPage, userTotalPages]);

useEffect(() => {
  setAssignmentCurrentPage(1);
}, [
  assignmentSearchText,
  assignmentStatusFilter,
  assignmentTypeFilter,
  assignmentSortBy,
  assignmentPageSize,
  selectedUserId,
]);

useEffect(() => {
  if (assignmentCurrentPage > assignmentTotalPages) {
    setAssignmentCurrentPage(assignmentTotalPages);
  }
}, [assignmentCurrentPage, assignmentTotalPages]);

  async function loadBaseData() {
    setLoading(true);
    setErrorText("");

    const [usersResult, tasksResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
  .from("tasks")
  .select(
    `
    *,
    products!inner (*)
  `
  )
  .eq("is_active", true)
  .eq("products.is_active", true)
  .order("step_number", { ascending: true }),
    ]);

    if (usersResult.error) {
      setErrorText(usersResult.error.message);
      setLoading(false);
      return;
    }

    if (tasksResult.error) {
      setErrorText(tasksResult.error.message);
      setLoading(false);
      return;
    }

    const loadedUsers = (usersResult.data || []) as Profile[];
    const loadedTasks = (tasksResult.data || []) as Task[];

    setUsers(loadedUsers);
setTasks(loadedTasks);
setSelectedTaskId(loadedTasks[0]?.id || "");

    if (queryUserId) {
      const foundUser = loadedUsers.find((user) => user.id === queryUserId);
      if (foundUser) {
        setSelectedUserId(foundUser.id);
      }
    }

    if (!queryUserId && loadedUsers.length > 0) {
      const firstMember =
        loadedUsers.find((user) => user.role !== "admin") || loadedUsers[0];

      setSelectedUserId(firstMember.id);
    }

    setLoading(false);
  }

  async function loadAssignments(userId: string) {
    if (!userId) return;

    setAssignmentLoading(true);
    setErrorText("");

    const { data, error } = await supabase
      .from("user_task_assignments")
      .select(
        `
        id,
        user_id,
        task_id,
        assigned_step,
        is_active,
        created_at,
        tasks (
          *,
          products (*)
        )
      `
      )
      .eq("user_id", userId)
      .order("assigned_step", { ascending: true });

    if (error) {
      setErrorText(error.message);
      setAssignmentLoading(false);
      return;
    }

    const rows = (data || []) as unknown as UserTaskAssignment[];

    setAssignments(rows);
    setAssignedStep(getNextStep(rows));
    setAssignmentLoading(false);
  }

  useEffect(() => {
    if (isAdmin) {
      loadBaseData();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedUserId) {
      loadAssignments(selectedUserId);
    }
  }, [selectedUserId]);

  function getNextStep(rows: UserTaskAssignment[]) {
    for (let step = 1; step <= 80; step++) {
      const exists = rows.some((assignment) => assignment.assigned_step === step);
      if (!exists) return step;
    }

    return 80;
  }

  async function handleAddAssignment() {
    if (!selectedUser) {
      setErrorText(t.messages.selectUserFirst);
      return;
    }

    if (!selectedTaskId) {
      setErrorText(t.messages.selectTaskFirst);
      return;
    }

    if (assignments.length >= 80) {
      setErrorText(t.messages.maxTasks);
      return;
    }

    if (assignedStep < 1 || assignedStep > 80) {
      setErrorText(t.messages.stepRange);
      return;
    }

    const stepExists = assignments.some(
      (assignment) => assignment.assigned_step === assignedStep
    );

    if (stepExists) {
      setErrorText(
  t.messages.stepExists.replace("{step}", String(assignedStep))
);
      return;
    }

    setSaving(true);
    setSuccessText("");
    setErrorText("");

    const { error } = await supabase.from("user_task_assignments").insert({
      user_id: selectedUser.id,
      task_id: selectedTaskId,
      assigned_step: assignedStep,
      assigned_by: profile.id,
      is_active: true,
    });

    if (error) {
      setErrorText(error.message);
      setSaving(false);
      return;
    }

    setSuccessText(
  t.messages.taskAssigned.replace("{step}", String(assignedStep))
);
    setSaving(false);
    await loadAssignments(selectedUser.id);
  }

  async function handleDeleteAssignment(assignment: UserTaskAssignment) {
    setSaving(true);
    setSuccessText("");
    setErrorText("");

    const { error } = await supabase
      .from("user_task_assignments")
      .delete()
      .eq("id", assignment.id);

    if (error) {
      setErrorText(error.message);
      setSaving(false);
      return;
    }

    setSuccessText(
  t.messages.stepRemoved.replace("{step}", String(assignment.assigned_step))
);
    setSaving(false);

    if (selectedUser) {
      await loadAssignments(selectedUser.id);
    }
  }

  async function handleToggleAssignment(assignment: UserTaskAssignment) {
    setSaving(true);
    setSuccessText("");
    setErrorText("");

    const { error } = await supabase
      .from("user_task_assignments")
      .update({
        is_active: !assignment.is_active,
      })
      .eq("id", assignment.id);

    if (error) {
      setErrorText(error.message);
      setSaving(false);
      return;
    }

    setSuccessText(
  assignment.is_active
    ? t.messages.stepDeactivated.replace(
        "{step}",
        String(assignment.assigned_step)
      )
    : t.messages.stepActivated.replace(
        "{step}",
        String(assignment.assigned_step)
      )
);

    setSaving(false);

    if (selectedUser) {
      await loadAssignments(selectedUser.id);
    }
  }

  if (!isAdmin) {
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
      <AdminNav language={currentLanguage} />

      <div className="mb-8 max-w-3xl">
  <p className="text-sm font-bold uppercase tracking-[0.24em] text-yellow-300/75">
  {t.pageTag}
</p>

<h1 className="mt-2 text-4xl font-black tracking-tight text-white">
  {t.title}
</h1>

<p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
  {t.description}
</p>
</div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label={t.stats.users} value={String(users.length)} />
<StatCard label={t.stats.taskLibrary} value={String(tasks.length)} />
<StatCard
  label={t.stats.assigned}
  value={selectedUser ? String(assignments.length) : "-"}
/>
<StatCard
  label={t.stats.activeSteps}
  value={selectedUser ? String(activeAssignments.length) : "-"}
/>
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

        {loading && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center text-white/60">
            {t.loading.assignmentCenter}
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 xl:sticky xl:top-8 xl:self-start">
              <div className="mb-5">
                <p className="text-sm text-yellow-200/80">{t.usersPanel.members}</p>
<h2 className="text-2xl font-black">{t.usersPanel.selectUser}</h2>
              </div>

              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                <Search className="h-5 w-5 text-white/40" />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder={t.usersPanel.searchPlaceholder}
                  className="w-full bg-transparent text-white outline-none placeholder:text-white/35"
                />
              </div>

              <div className="max-h-[590px] space-y-3 overflow-y-auto pr-1">
  {paginatedUsers.map((user) => {
    const selected = user.id === selectedUserId;
    const isUserAdmin = user.role === "admin";

    return (
      <button
        key={user.id}
        onClick={() => setSelectedUserId(user.id)}
        className={`w-full rounded-2xl border p-4 text-left transition ${
          selected
            ? "border-yellow-400/50 bg-yellow-400/10"
            : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              isUserAdmin
                ? "bg-yellow-400/10 text-yellow-300"
                : "bg-blue-400/10 text-blue-300"
            }`}
          >
            {isUserAdmin ? (
              <Crown className="h-5 w-5" />
            ) : (
              <Users className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-black">
                {user.display_name || t.usersPanel.fallbackName}
              </p>

              <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold text-white/50">
                {user.role}
              </span>
            </div>

            <p className="mt-1 truncate text-xs text-white/45">
              {user.email || t.usersPanel.noEmail}
            </p>

            <p className="mt-1 text-xs text-yellow-300">
              {t.usersPanel.step} {user.current_step}
            </p>
          </div>
        </div>
      </button>
    );
  })}
</div>

{filteredUsers.length === 0 && (
  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
    <Search className="mx-auto mb-3 h-8 w-8 text-yellow-300" />
    <p className="font-black">{t.usersPanel.noMatchingUsers}</p>
<p className="mt-1 text-sm text-white/45">
  {t.usersPanel.noMatchingUsersDescription}
</p>
  </div>
)}

{filteredUsers.length > 0 && (
  <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3">
    <p className="mb-3 text-center text-xs text-white/45">
      {t.usersPanel.showing}{" "}
<span className="font-black text-white">{userFirstResult}</span>
{" - "}
<span className="font-black text-white">{userLastResult}</span>
{" "}
{t.usersPanel.of}{" "}
<span className="font-black text-yellow-300">
  {filteredUsers.length}
</span>{" "}
{t.usersPanel.users}
    </p>

    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        disabled={userCurrentPage === 1}
        onClick={() => setUserCurrentPage((page) => Math.max(1, page - 1))}
        className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white/70 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black text-yellow-300">
        {userCurrentPage} / {userTotalPages}
      </div>

      <button
        type="button"
        disabled={userCurrentPage === userTotalPages}
        onClick={() =>
          setUserCurrentPage((page) => Math.min(userTotalPages, page + 1))
        }
        className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white/70 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  </div>
)}
            </section>

            <section className="space-y-6">
              <div className="rounded-[2rem] border border-yellow-400/20 bg-white/[0.045] p-5 shadow-[0_0_45px_rgba(212,175,55,0.08)]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-200/80">
                      {t.builder.title}
                    </p>
                    <h2 className="text-2xl font-black">
                      {selectedUser
  ? selectedUser.display_name || t.usersPanel.fallbackName
  : t.builder.noUserSelected}
                    </h2>
                    {selectedUser && (
                      <p className="mt-1 text-sm text-white/45">
                        {selectedUser.email || selectedUser.id}
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
                    <ListChecks className="h-6 w-6 text-yellow-300" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_130px_160px]">
                  <div>
                    <p className="mb-2 text-sm font-bold text-white/80">
                      {t.builder.selectTaskTemplate}
                    </p>
                    <select
                      value={selectedTaskId}
                      onChange={(event) => setSelectedTaskId(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-400/50"
                    >
                      {tasks.length === 0 ? (
  <option value="">{t.builder.noActiveTemplates}</option>
) : (
  tasks.map((task) => (
    <option key={task.id} value={task.id}>
      {t.usersPanel.step} {task.step_number} — {task.products?.name || t.builder.connectedProduct} — $
      {Number(task.products?.price || task.price).toFixed(2)}
    </option>
  ))
)}
                    </select>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-bold text-white/80">
                      {t.builder.userStep}
                    </p>
                    <input
                      value={assignedStep}
                      onChange={(event) =>
                        setAssignedStep(Number(event.target.value))
                      }
                      type="number"
                      min={1}
                      max={80}
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-400/50"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={handleAddAssignment}
                      disabled={saving || !selectedUser || !selectedTaskId || tasks.length === 0}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-3 font-black text-black disabled:opacity-60"
                    >
                      <Plus className="h-5 w-5" />
                      {t.builder.assign}
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/50">
                  {t.builder.nextAvailableStep}{" "}
<span className="font-black text-yellow-300">
  {nextAvailableStep}
</span>
. {t.builder.reuseStepNote}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5">
                <div className="mb-5 flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
  <div>
    <p className="text-sm text-yellow-200/80">
  {t.assignments.titleTag}
</p>
<h2 className="text-2xl font-black">{t.assignments.title}</h2>
<p className="mt-1 text-xs text-white/40">
  {t.assignments.description}
</p>
  </div>

  <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm font-black text-yellow-300">
    {filteredAssignments.length} {t.assignments.shown} / {assignments.length} {t.assignments.total}
  </div>
</div>

{assignments.length > 0 && (
  <div className="mb-5 grid grid-cols-1 gap-3 xl:grid-cols-[1.4fr_0.8fr_0.8fr_0.9fr_0.6fr]">
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
      <input
        value={assignmentSearchText}
        onChange={(event) => setAssignmentSearchText(event.target.value)}
        placeholder={t.assignments.searchPlaceholder}
        className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-yellow-400/50"
      />
    </div>

    <select
      value={assignmentStatusFilter}
      onChange={(event) =>
        setAssignmentStatusFilter(
          event.target.value as "all" | "active" | "inactive"
        )
      }
      className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400/50"
    >
      <option className="bg-black" value="all">{t.assignments.allStatus}</option>
<option className="bg-black" value="active">{t.assignments.active}</option>
<option className="bg-black" value="inactive">{t.assignments.inactive}</option>
    </select>

    <select
      value={assignmentTypeFilter}
      onChange={(event) =>
        setAssignmentTypeFilter(
          event.target.value as "all" | "standard" | "lucky_bonus"
        )
      }
      className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400/50"
    >
      <option className="bg-black" value="all">{t.assignments.allTypes}</option>
<option className="bg-black" value="standard">{t.assignments.standard}</option>
<option className="bg-black" value="lucky_bonus">{t.assignments.luckyBonus}</option>
    </select>

    <select
      value={assignmentSortBy}
      onChange={(event) =>
        setAssignmentSortBy(
          event.target.value as
            | "step_asc"
            | "step_desc"
            | "reward_high"
            | "price_high"
        )
      }
      className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400/50"
    >
      <option className="bg-black" value="step_asc">{t.assignments.stepAsc}</option>
<option className="bg-black" value="step_desc">{t.assignments.stepDesc}</option>
<option className="bg-black" value="reward_high">{t.assignments.rewardHigh}</option>
<option className="bg-black" value="price_high">{t.assignments.priceHigh}</option>
    </select>

    <select
      value={assignmentPageSize}
      onChange={(event) => setAssignmentPageSize(Number(event.target.value))}
      className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400/50"
    >
      <option className="bg-black" value={10}>10</option>
      <option className="bg-black" value={25}>25</option>
      <option className="bg-black" value={50}>50</option>
      <option className="bg-black" value={80}>80</option>
    </select>
  </div>
)}

                {assignmentLoading && (
                  <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center text-white/60">
                    {t.loading.assignedTasks}
                  </div>
                )}

                {!assignmentLoading && selectedUser && assignments.length === 0 && (
                  <div className="rounded-[2rem] border border-yellow-400/20 bg-yellow-400/10 p-8 text-center">
                    <Gem className="mx-auto mb-4 h-12 w-12 text-yellow-300" />
                    <p className="font-black">{t.assignments.noTasksAssigned}</p>
<p className="mt-2 text-sm text-yellow-100/65">
  {t.assignments.noTasksAssignedDescription}
</p>
                  </div>
                )}

                {!assignmentLoading && assignments.length > 0 && filteredAssignments.length === 0 && (
  <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center">
    <Search className="mx-auto mb-4 h-12 w-12 text-yellow-300" />
    <p className="font-black">{t.assignments.noMatchingAssigned}</p>
<p className="mt-2 text-sm text-white/50">
  {t.assignments.noMatchingAssignedDescription}
</p>
  </div>
)}

{!assignmentLoading && filteredAssignments.length > 0 && (
  <>
    <div className="max-h-[620px] overflow-auto rounded-[1.5rem] border border-white/10">
  <table className="w-full min-w-[980px] text-left text-sm">
                      <thead className="sticky top-0 z-10 bg-[#151515] text-xs uppercase tracking-wide text-white/45">
                        <tr>
                          <th className="px-4 py-3">{t.assignments.userStep}</th>
<th className="px-4 py-3">{t.assignments.taskProduct}</th>
<th className="px-4 py-3">{t.assignments.type}</th>
<th className="px-4 py-3">{t.assignments.price}</th>
<th className="px-4 py-3">{t.assignments.reward}</th>
<th className="px-4 py-3">{t.assignments.status}</th>
<th className="px-4 py-3 text-right">{t.assignments.actions}</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-white/10">
                        {paginatedAssignments.map((assignment) => {
                          const task = assignment.tasks;
                          const product = task?.products;
                          const lucky = task?.task_type === "lucky_bonus";

                          const reward = task
                            ? Number(task.price) *
                              Number(task.commission_rate) *
                              Number(task.multiplier)
                            : 0;

                          return (
                            <tr key={assignment.id} className="bg-black/20 transition hover:bg-white/[0.04]">
                              <td className="px-4 py-4">
                                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/70">
                                  {assignment.assigned_step}
                                </span>
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06]">
                                    {product?.main_image || task?.image_url ? (
                                      <img
                                        src={
                                          product?.main_image ||
                                          task?.image_url ||
                                          ""
                                        }
                                        alt={product?.name || task?.title || t.assignments.taskProduct}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center">
                                        <Gem className="h-6 w-6 text-yellow-300" />
                                      </div>
                                    )}
                                  </div>

                                  <div>
                                    <p className="font-black">
                                      {product?.name || task?.title || t.assignments.missingTask}
                                    </p>

                                    <p className="mt-1 text-xs text-white/45">
                                      {product?.category ||
  task?.category ||
  t.assignments.noCategory}
                                    </p>

                                    {product && (
                                      <div className="mt-1 flex items-center gap-1 text-xs text-yellow-300">
                                        <Star className="h-3 w-3 fill-current" />
                                        {Number(product.rating).toFixed(1)}
                                        <span className="text-white/40">
                                          ({product.reviews_count})
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-black ${
                                    lucky
                                      ? "bg-yellow-300 text-black"
                                      : "bg-white/10 text-white/70"
                                  }`}
                                >
                                  {lucky ? t.assignments.luckyBonus : t.assignments.standard}
                                </span>
                              </td>

                              <td className="px-4 py-4 font-bold text-white">
                                ${Number(task?.price || 0).toFixed(2)}
                              </td>

                              <td className="px-4 py-4 font-bold text-yellow-300">
                                ${reward.toFixed(2)}
                              </td>

                              <td className="px-4 py-4">
                                <button
                                  onClick={() =>
                                    handleToggleAssignment(assignment)
                                  }
                                  disabled={saving}
                                  className={`rounded-full px-3 py-1 text-xs font-black ${
                                    assignment.is_active
                                      ? "bg-emerald-400/15 text-emerald-300"
                                      : "bg-red-500/15 text-red-300"
                                  }`}
                                >
                                  {assignment.is_active ? t.assignments.active : t.assignments.inactive}
                                </button>
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex justify-end">
                                  <button
                                    onClick={() =>
                                      handleDeleteAssignment(assignment)
                                    }
                                    disabled={saving}
                                    className="rounded-xl border border-red-400/30 bg-red-500/10 p-2 text-red-300"
                                    title={t.assignments.deleteAssignment}
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
  {t.assignments.showing}{" "}
  <span className="font-black text-white">
    {assignmentFirstResult}
  </span>
  {" - "}
  <span className="font-black text-white">
    {assignmentLastResult}
  </span>
  {" "}
  {t.assignments.of}{" "}
  <span className="font-black text-yellow-300">
    {filteredAssignments.length}
  </span>{" "}
  {t.assignments.assignedTasks}
</p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={assignmentCurrentPage === 1}
                        onClick={() =>
                          setAssignmentCurrentPage((page) =>
                            Math.max(1, page - 1)
                          )
                        }
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white/70 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        {t.assignments.prev}
                      </button>

                      <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black text-yellow-300">
                        {t.assignments.page} {assignmentCurrentPage} / {assignmentTotalPages}
                      </div>

                      <button
                        type="button"
                        disabled={
                          assignmentCurrentPage === assignmentTotalPages
                        }
                        onClick={() =>
                          setAssignmentCurrentPage((page) =>
                            Math.min(assignmentTotalPages, page + 1)
                          )
                        }
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white/70 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {t.assignments.next}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                                    </div>
  </>
)}
              </div>
            </section>
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
      <p className="mt-1 text-xl font-black text-yellow-300">{value}</p>
    </div>
  );
}