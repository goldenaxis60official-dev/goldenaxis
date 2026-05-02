//src>app>admin>user-tasks>page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import RequireAuth from "@/components/auth/RequireAuth";
import AdminNav from "../AdminNav";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import type { Task } from "@/types/task";
import {
  AlertCircle,
  CheckCircle,
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

  const [users, setUsers] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignments, setAssignments] = useState<UserTaskAssignment[]>([]);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [assignedStep, setAssignedStep] = useState(1);

  const [searchText, setSearchText] = useState("");

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
      setErrorText("Please select a user first.");
      return;
    }

    if (!selectedTaskId) {
      setErrorText("Please select a task first.");
      return;
    }

    if (assignments.length >= 80) {
      setErrorText("This user already has the maximum 80 assigned tasks.");
      return;
    }

    if (assignedStep < 1 || assignedStep > 80) {
      setErrorText("Assigned step must be between 1 and 80.");
      return;
    }

    const stepExists = assignments.some(
      (assignment) => assignment.assigned_step === assignedStep
    );

    if (stepExists) {
      setErrorText(
        `Step ${assignedStep} already exists for this user. Delete that step first or choose another step.`
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

    setSuccessText(`Task assigned to Step ${assignedStep}.`);
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

    setSuccessText(`Step ${assignment.assigned_step} removed.`);
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
        ? `Step ${assignment.assigned_step} deactivated.`
        : `Step ${assignment.assigned_step} activated.`
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

      <div className="mb-8 max-w-3xl">
  <p className="text-sm font-bold uppercase tracking-[0.24em] text-yellow-300/75">
    Admin Control
  </p>

  <h1 className="mt-2 text-4xl font-black tracking-tight text-white">
    User Task Assignment
  </h1>

  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
    Assign a personalized campaign task list to each user. Only active task
    templates connected to active catalog products can be assigned.
  </p>
</div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Users" value={String(users.length)} />
          <StatCard label="Task Library" value={String(tasks.length)} />
          <StatCard
            label="Assigned"
            value={selectedUser ? String(assignments.length) : "-"}
          />
          <StatCard
            label="Active Steps"
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
            Loading assignment center...
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5">
              <div className="mb-5">
                <p className="text-sm text-yellow-200/80">Members</p>
                <h2 className="text-2xl font-black">Select User</h2>
              </div>

              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                <Search className="h-5 w-5 text-white/40" />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search user..."
                  className="w-full bg-transparent text-white outline-none placeholder:text-white/35"
                />
              </div>

              <div className="max-h-[640px] space-y-3 overflow-y-auto pr-1">
                {filteredUsers.map((user) => {
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
                              {user.display_name || "Gold Member"}
                            </p>

                            <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold text-white/50">
                              {user.role}
                            </span>
                          </div>

                          <p className="mt-1 truncate text-xs text-white/45">
                            {user.email || "No email"}
                          </p>

                          <p className="mt-1 text-xs text-yellow-300">
                            Step {user.current_step}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-6">
              <div className="rounded-[2rem] border border-yellow-400/20 bg-white/[0.045] p-5 shadow-[0_0_45px_rgba(212,175,55,0.08)]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-200/80">
                      Assignment Builder
                    </p>
                    <h2 className="text-2xl font-black">
                      {selectedUser
                        ? selectedUser.display_name || "Gold Member"
                        : "No User Selected"}
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

                <div className="grid grid-cols-[1fr_130px_160px] gap-4">
                  <div>
                    <p className="mb-2 text-sm font-bold text-white/80">
                      Select Task Template
                    </p>
                    <select
                      value={selectedTaskId}
                      onChange={(event) => setSelectedTaskId(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-400/50"
                    >
                      {tasks.length === 0 ? (
  <option value="">No active connected task templates</option>
) : (
  tasks.map((task) => (
    <option key={task.id} value={task.id}>
      Step {task.step_number} — {task.products?.name || "Connected Product"} — $
      {Number(task.products?.price || task.price).toFixed(2)}
    </option>
  ))
)}
                    </select>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-bold text-white/80">
                      User Step
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
                      Assign
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/50">
                  Next available step:{" "}
                  <span className="font-black text-yellow-300">
                    {nextAvailableStep}
                  </span>
                  . Delete an existing step first if you want to reuse that step.
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-200/80">
                      Personalized Campaign
                    </p>
                    <h2 className="text-2xl font-black">Assigned Tasks</h2>
                  </div>
                </div>

                {assignmentLoading && (
                  <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center text-white/60">
                    Loading assigned tasks...
                  </div>
                )}

                {!assignmentLoading && selectedUser && assignments.length === 0 && (
                  <div className="rounded-[2rem] border border-yellow-400/20 bg-yellow-400/10 p-8 text-center">
                    <Gem className="mx-auto mb-4 h-12 w-12 text-yellow-300" />
                    <p className="font-black">No tasks assigned</p>
                    <p className="mt-2 text-sm text-yellow-100/65">
                      This user will see “Campaign List Preparing” on the
                      Missions page until you assign at least one active task.
                    </p>
                  </div>
                )}

                {!assignmentLoading && assignments.length > 0 && (
                  <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white/[0.06] text-xs uppercase tracking-wide text-white/45">
                        <tr>
                          <th className="px-4 py-3">User Step</th>
                          <th className="px-4 py-3">Task / Product</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Price</th>
                          <th className="px-4 py-3">Reward</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-white/10">
                        {assignments.map((assignment) => {
                          const task = assignment.tasks;
                          const product = task?.products;
                          const lucky = task?.task_type === "lucky_bonus";

                          const reward = task
                            ? Number(task.price) *
                              Number(task.commission_rate) *
                              Number(task.multiplier)
                            : 0;

                          return (
                            <tr key={assignment.id} className="bg-black/20">
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
                                        alt={product?.name || task?.title || "Task"}
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
                                      {product?.name || task?.title || "Missing Task"}
                                    </p>

                                    <p className="mt-1 text-xs text-white/45">
                                      {product?.category ||
                                        task?.category ||
                                        "No category"}
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
                                  {lucky ? "Lucky Bonus" : "Standard"}
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
                                  {assignment.is_active ? "Active" : "Inactive"}
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
                                    title="Delete assignment"
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