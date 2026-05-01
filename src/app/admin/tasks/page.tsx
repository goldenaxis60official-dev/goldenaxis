"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import type { Task } from "@/types/task";
import {
  Gem,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  Pencil,
  X,
  Save,
} from "lucide-react";

export default function AdminTasksPage() {
  return (
    <RequireAuth>
      {(profile) => <AdminTasksContent profile={profile} />}
    </RequireAuth>
  );
}

function AdminTasksContent({ profile }: { profile: Profile }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const isAdmin = profile.role === "admin";

  async function loadTasks() {
    setLoading(true);
    setErrorText("");

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("step_number", { ascending: true });

    if (error) {
      setErrorText(error.message);
      setLoading(false);
      return;
    }

    setTasks((data || []) as Task[]);
    setLoading(false);
  }

  useEffect(() => {
    if (isAdmin) {
      loadTasks();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  async function handleSaveTask() {
    if (!editingTask) return;

    setSaving(true);
    setErrorText("");
    setSuccessText("");

    const { error } = await supabase
      .from("tasks")
      .update({
        title: editingTask.title,
        category: editingTask.category,
        price: Number(editingTask.price),
        commission_rate: Number(editingTask.commission_rate),
        task_type: editingTask.task_type,
        multiplier: Number(editingTask.multiplier),
        image_url: editingTask.image_url || null,
        video_url: editingTask.video_url || null,
        rating_label_1: editingTask.rating_label_1,
        rating_label_2: editingTask.rating_label_2,
        description: editingTask.description,
        is_active: editingTask.is_active,
      })
      .eq("id", editingTask.id);

    if (error) {
      setErrorText(error.message);
      setSaving(false);
      return;
    }

    setSuccessText(`Step ${editingTask.step_number} updated successfully.`);
    setEditingTask(null);
    setSaving(false);
    loadTasks();
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

  return (
    <AppShell>
      <section className="px-5 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">Admin Control</p>
            <h1 className="text-2xl font-black">Task Manager</h1>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <Gem className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3">
          <StatBox label="Tasks" value={String(tasks.length)} />
          <StatBox
            label="Lucky"
            value={String(
              tasks.filter((task) => task.task_type === "lucky_bonus").length
            )}
          />
          <StatBox
            label="Active"
            value={String(tasks.filter((task) => task.is_active).length)}
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
            Loading tasks...
          </div>
        )}

        {!loading && (
          <div className="space-y-4 pb-6">
            {tasks.map((task) => {
              const lucky = task.task_type === "lucky_bonus";
              const reward =
                Number(task.price) *
                Number(task.commission_rate) *
                Number(task.multiplier);

              return (
                <div
                  key={task.id}
                  className={`rounded-[1.7rem] border p-4 backdrop-blur-xl ${
                    lucky
                      ? "border-yellow-400/50 bg-yellow-400/10 shadow-[0_0_35px_rgba(212,175,55,0.18)]"
                      : "border-white/10 bg-white/[0.05]"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                          lucky
                            ? "bg-yellow-300 text-black"
                            : "bg-white/10 text-white/70"
                        }`}
                      >
                        {lucky ? "Lucky Bonus" : "Standard"}
                      </span>

                      {!task.is_active && (
                        <span className="rounded-full bg-red-500/15 px-3 py-1 text-[11px] font-bold text-red-300">
                          Inactive
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-white/50">
                      Step {task.step_number}
                    </p>
                  </div>

                  <h3 className="text-lg font-black">{task.title}</h3>
                  <p className="mt-1 text-sm text-white/45">
                    {task.category} Campaign
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <MiniBox label="Price" value={`$${Number(task.price).toFixed(2)}`} />
                    <MiniBox label="Reward" value={`$${reward.toFixed(2)}`} />
                    <MiniBox label="Multi" value={`${task.multiplier}x`} />
                  </div>

                  <button
                    onClick={() => setEditingTask(task)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-3 text-sm font-black text-yellow-300"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Task
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {editingTask && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 px-4 pb-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[2rem] border border-yellow-400/20 bg-[#090909] p-5 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-200/80">
                    Edit Step {editingTask.step_number}
                  </p>
                  <h2 className="text-2xl font-black">Task Settings</h2>
                </div>

                <button
                  onClick={() => setEditingTask(null)}
                  className="rounded-2xl bg-white/10 p-3 text-white/70"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <TextInput
                  label="Task Title"
                  value={editingTask.title}
                  onChange={(value) =>
                    setEditingTask({ ...editingTask, title: value })
                  }
                />

                <TextInput
                  label="Category"
                  value={editingTask.category}
                  onChange={(value) =>
                    setEditingTask({ ...editingTask, category: value })
                  }
                />

                <NumberInput
                  label="Price"
                  value={Number(editingTask.price)}
                  onChange={(value) =>
                    setEditingTask({ ...editingTask, price: value })
                  }
                />

                <NumberInput
                  label="Commission Rate"
                  value={Number(editingTask.commission_rate)}
                  step="0.0001"
                  onChange={(value) =>
                    setEditingTask({ ...editingTask, commission_rate: value })
                  }
                />

                <div>
                  <p className="mb-2 text-sm font-bold text-white/80">
                    Task Type
                  </p>
                  <select
                    value={editingTask.task_type}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        task_type: e.target.value as "standard" | "lucky_bonus",
                      })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-400/50"
                  >
                    <option value="standard">standard</option>
                    <option value="lucky_bonus">lucky_bonus</option>
                  </select>
                </div>

                <NumberInput
                  label="Multiplier"
                  value={Number(editingTask.multiplier)}
                  step="0.1"
                  onChange={(value) =>
                    setEditingTask({ ...editingTask, multiplier: value })
                  }
                />

                <TextInput
                  label="Image URL Optional"
                  value={editingTask.image_url || ""}
                  onChange={(value) =>
                    setEditingTask({ ...editingTask, image_url: value })
                  }
                />

                <TextInput
                  label="Video URL Optional"
                  value={editingTask.video_url || ""}
                  onChange={(value) =>
                    setEditingTask({ ...editingTask, video_url: value })
                  }
                />

                <TextInput
                  label="Rating Label 1"
                  value={editingTask.rating_label_1 || ""}
                  onChange={(value) =>
                    setEditingTask({ ...editingTask, rating_label_1: value })
                  }
                />

                <TextInput
                  label="Rating Label 2"
                  value={editingTask.rating_label_2 || ""}
                  onChange={(value) =>
                    setEditingTask({ ...editingTask, rating_label_2: value })
                  }
                />

                <div>
                  <p className="mb-2 text-sm font-bold text-white/80">
                    Description
                  </p>
                  <textarea
                    value={editingTask.description || ""}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        description: e.target.value,
                      })
                    }
                    className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
                  />
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                  <input
                    type="checkbox"
                    checked={editingTask.is_active}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        is_active: e.target.checked,
                      })
                    }
                  />
                  <span className="font-bold text-white/80">Active Task</span>
                </label>

                <button
                  onClick={handleSaveTask}
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:opacity-60"
                >
                  <Save className="h-5 w-5" />
                  {saving ? "Saving..." : "Save Task"}
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
      <p className="mt-1 font-bold text-yellow-300">{value}</p>
    </div>
  );
}

function MiniBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/30 p-3">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-1 font-bold text-white">{value}</p>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-white/80">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
      />
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  step = "1",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: string;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-white/80">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        type="number"
        step={step}
        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
      />
    </div>
  );
}