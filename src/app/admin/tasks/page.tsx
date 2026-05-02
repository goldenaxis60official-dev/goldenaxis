//src>app>admin>tasks>page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RequireAuth from "@/components/auth/RequireAuth";
import AdminNav from "../AdminNav";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import type { Task } from "@/types/task";
import type { Product } from "@/types/product";
import {
  AlertCircle,
  CheckCircle,
  Gem,
  Pencil,
  Save,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";

export default function AdminTasksPage() {
  return (
    <RequireAuth>
      {(profile) => <AdminTasksContent profile={profile} />}
    </RequireAuth>
  );
}

function AdminTasksContent({ profile }: { profile: Profile }) {
  const isAdmin = profile.role === "admin";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const activeTasks = useMemo(
    () => tasks.filter((task) => task.is_active).length,
    [tasks]
  );

  const luckyTasks = useMemo(
    () => tasks.filter((task) => task.task_type === "lucky_bonus").length,
    [tasks]
  );

  const connectedTasks = useMemo(
  () => tasks.filter((task) => task.products && task.products.is_active).length,
  [tasks]
);

  const selectedEditingProduct =
    editingTask?.product_id
      ? products.find((product) => product.id === editingTask.product_id) ||
        editingTask.products ||
        null
      : null;

  async function loadData() {
    setLoading(true);
    setErrorText("");

    const [tasksResult, productsResult] = await Promise.all([
      supabase
        .from("tasks")
        .select(
          `
          *,
          products (*)
        `
        )
        .order("step_number", { ascending: true }),

      supabase
  .from("products")
  .select("*")
  .eq("is_active", true)
  .order("created_at", { ascending: false }),
    ]);

    if (tasksResult.error) {
      setErrorText(tasksResult.error.message);
      setLoading(false);
      return;
    }

    if (productsResult.error) {
      setErrorText(productsResult.error.message);
      setLoading(false);
      return;
    }

    setTasks((tasksResult.data || []) as Task[]);
    setProducts((productsResult.data || []) as Product[]);
    setLoading(false);
  }

  useEffect(() => {
    if (isAdmin) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  function handleProductSelect(productId: string) {
    if (!editingTask) return;

    if (!productId) {
      setEditingTask({
        ...editingTask,
        product_id: null,
        products: null,
      });
      return;
    }

    const selectedProduct = products.find((product) => product.id === productId);

    if (!selectedProduct) return;

    setEditingTask({
      ...editingTask,
      product_id: selectedProduct.id,
      products: selectedProduct,

      // Keep task value synced because complete_current_task still uses tasks.price
      title: selectedProduct.name,
      category: selectedProduct.category,
      price: Number(selectedProduct.price),
      image_url: selectedProduct.main_image,
      description: selectedProduct.description,
    });
  }

  async function handleSaveTask() {
  if (!editingTask) return;

  setSaving(true);
  setErrorText("");
  setSuccessText("");

  if (editingTask.product_id && !syncedProduct) {
  setErrorText(
    "This task is connected to a deleted or missing product. Select an active product from Product Catalog first."
  );
  setSaving(false);
  return;
}

  const { error } = await supabase
    .from("tasks")
    .update({
      product_id: editingTask.product_id || null,

      // Product details come from Product Catalog only
      title: syncedProduct?.name || editingTask.title,
      category: syncedProduct?.category || editingTask.category,
      price: Number(syncedProduct?.price || editingTask.price),
      image_url: syncedProduct?.main_image || editingTask.image_url || null,
      description: syncedProduct?.description || editingTask.description,

      // Task Library controls campaign logic only
      commission_rate: Number(editingTask.commission_rate),
      task_type: editingTask.task_type,
      multiplier: Number(editingTask.multiplier),
      video_url: editingTask.video_url || null,
      rating_label_1: editingTask.rating_label_1,
      rating_label_2: editingTask.rating_label_2,
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
  loadData();
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
    Task Library
  </h1>

  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
    Connect each mission step to an active catalog product and control campaign
    reward logic. Product name, price, photos, rating, and description come from
    Product Catalog.
  </p>
</div>

        <div className="mb-6 grid grid-cols-4 gap-4">
          <StatCard label="Total Tasks" value={String(tasks.length)} />
          <StatCard label="Active" value={String(activeTasks)} />
          <StatCard label="Lucky Bonus" value={String(luckyTasks)} />
          <StatCard label="Connected" value={`${connectedTasks}/${tasks.length}`} />
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
            Loading tasks...
          </div>
        )}

        {!loading && (
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-200/80">Mission Sequence</p>
                <h2 className="text-2xl font-black">Campaign Steps</h2>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.06] text-xs uppercase tracking-wide text-white/45">
                  <tr>
                    <th className="px-4 py-3">Step</th>
                    <th className="px-4 py-3">Product / Task</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Reward</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {tasks.map((task) => {
                    const lucky = task.task_type === "lucky_bonus";
                    const product = task.products;
                    const reward =
                      Number(task.price) *
                      Number(task.commission_rate) *
                      Number(task.multiplier);

                    return (
                      <tr key={task.id} className="bg-black/20">
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/70">
                            {task.step_number}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06]">
                              {product?.main_image || task.image_url ? (
                                <img
                                  src={product?.main_image || task.image_url || ""}
                                  alt={product?.name || task.title}
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
                                {product?.name || task.title}
                              </p>
                              <p className="mt-1 text-xs text-white/45">
                                {product
                                  ? `${product.category} • Catalog connected`
                                  : `${task.category} • No catalog product`}
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
                          ${Number(task.price).toFixed(2)}
                        </td>

                        <td className="px-4 py-4 font-bold text-yellow-300">
                          ${reward.toFixed(2)}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              task.is_active
                                ? "bg-emerald-400/15 text-emerald-300"
                                : "bg-red-500/15 text-red-300"
                            }`}
                          >
                            {task.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end">
                            <button
                              onClick={() => setEditingTask(task)}
                              className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-2 text-yellow-300"
                              title="Edit"
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
          </section>
        )}

        {editingTask && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
            <div className="grid max-h-[90vh] w-full max-w-5xl grid-cols-[1fr_360px] overflow-hidden rounded-[2rem] border border-yellow-400/20 bg-[#090909] shadow-[0_0_60px_rgba(212,175,55,0.16)]">
              <div className="max-h-[90vh] overflow-y-auto p-6">
                <div className="mb-6 flex items-center justify-between">
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

                <div className="space-y-5">
  <div>
    <p className="mb-2 text-sm font-bold text-white/80">
      Connect Product
    </p>

    <select
      value={editingTask.product_id || ""}
      onChange={(event) => handleProductSelect(event.target.value)}
      className="w-full rounded-2xl border border-yellow-400/20 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-400/50"
    >
      <option value="">No product selected</option>

      {products.map((product) => (
        <option key={product.id} value={product.id}>
          {product.name} — {product.currency}{" "}
          {Number(product.price).toFixed(2)}
        </option>
      ))}
    </select>

    <p className="mt-2 text-xs text-white/40">
      Product name, price, photo, rating, reviews, and description are edited
      only in Product Catalog.
    </p>
  </div>

  {selectedEditingProduct ? (
    <div className="rounded-[1.5rem] border border-yellow-400/20 bg-yellow-400/10 p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-yellow-100/60">Connected Product</p>
          <h3 className="mt-1 text-lg font-black">
            {selectedEditingProduct.name}
          </h3>
          <p className="mt-1 text-sm text-yellow-100/65">
            {selectedEditingProduct.category}
          </p>
        </div>

        <Link
          href="/admin/products"
          className="rounded-xl border border-yellow-400/30 bg-black/30 px-3 py-2 text-xs font-black text-yellow-300 hover:bg-yellow-400/10"
        >
          Edit Product Details
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-black/30 p-3">
          <p className="text-xs text-white/45">Product Price</p>
          <p className="mt-1 font-black text-yellow-300">
            {selectedEditingProduct.currency}{" "}
            {Number(selectedEditingProduct.price).toFixed(2)}
          </p>
        </div>

        <div className="rounded-2xl bg-black/30 p-3">
          <p className="text-xs text-white/45">Rating</p>
          <p className="mt-1 font-black text-yellow-300">
            {Number(selectedEditingProduct.rating).toFixed(1)}
          </p>
        </div>

        <div className="rounded-2xl bg-black/30 p-3">
          <p className="text-xs text-white/45">Reviews</p>
          <p className="mt-1 font-black text-yellow-300">
            {selectedEditingProduct.reviews_count}
          </p>
        </div>
      </div>
    </div>
  ) : (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <p className="font-black text-white/80">No product connected</p>
      <p className="mt-2 text-sm text-white/45">
        Select a product from Product Catalog before using this task in a user
        campaign list.
      </p>
    </div>
  )}

  <div className="grid grid-cols-3 gap-4">
    <div>
      <p className="mb-2 text-sm font-bold text-white/80">Task Type</p>
      <select
        value={editingTask.task_type}
        onChange={(event) =>
          setEditingTask({
            ...editingTask,
            task_type: event.target.value as "standard" | "lucky_bonus",
          })
        }
        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-400/50"
      >
        <option value="standard">standard</option>
        <option value="lucky_bonus">lucky_bonus</option>
      </select>
    </div>

    <NumberInput
      label="Commission Rate"
      value={Number(editingTask.commission_rate)}
      step="0.0001"
      onChange={(value) =>
        setEditingTask({
          ...editingTask,
          commission_rate: value,
        })
      }
    />

    <NumberInput
      label="Multiplier"
      value={Number(editingTask.multiplier)}
      step="0.1"
      onChange={(value) =>
        setEditingTask({ ...editingTask, multiplier: value })
      }
    />
  </div>

  <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-4">
    <p className="text-sm font-black text-white/80">Campaign Reward Preview</p>

    <div className="mt-3 grid grid-cols-3 gap-3">
      <div className="rounded-2xl bg-white/[0.05] p-3">
        <p className="text-xs text-white/45">Task Value</p>
        <p className="mt-1 font-black text-white">
          ${Number(selectedEditingProduct?.price || editingTask.price).toFixed(2)}
        </p>
      </div>

      <div className="rounded-2xl bg-white/[0.05] p-3">
        <p className="text-xs text-white/45">Multiplier</p>
        <p className="mt-1 font-black text-blue-300">
          {Number(editingTask.multiplier).toFixed(1)}x
        </p>
      </div>

      <div className="rounded-2xl bg-white/[0.05] p-3">
        <p className="text-xs text-white/45">Reward</p>
        <p className="mt-1 font-black text-yellow-300">
          $
          {(
            Number(selectedEditingProduct?.price || editingTask.price) *
            Number(editingTask.commission_rate) *
            Number(editingTask.multiplier)
          ).toFixed(2)}
        </p>
      </div>
    </div>
  </div>

  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
    <input
      type="checkbox"
      checked={editingTask.is_active}
      onChange={(event) =>
        setEditingTask({
          ...editingTask,
          is_active: event.target.checked,
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
    {saving ? "Saving..." : "Save Task Logic"}
  </button>
</div>
              </div>

              <aside className="border-l border-white/10 bg-white/[0.035] p-6">
                <p className="text-sm text-yellow-200/80">Preview</p>
                <h3 className="mt-1 text-xl font-black">Connected Product</h3>

                <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/30">
                  {selectedEditingProduct?.main_image ||
                  editingTask.image_url ? (
                    <img
                      src={
                        selectedEditingProduct?.main_image ||
                        editingTask.image_url ||
                        ""
                      }
                      alt={selectedEditingProduct?.name || editingTask.title}
                      className="h-56 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-56 w-full items-center justify-center">
                      <Gem className="h-14 w-14 text-yellow-300" />
                    </div>
                  )}

                  <div className="p-4">
                    <p className="text-lg font-black">
                      {selectedEditingProduct?.name || editingTask.title}
                    </p>

                    <p className="mt-1 text-sm text-white/45">
                      {selectedEditingProduct?.category || editingTask.category}
                    </p>

                    {selectedEditingProduct && (
                      <div className="mt-3 flex items-center gap-1 text-yellow-300">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-bold">
                          {Number(selectedEditingProduct.rating).toFixed(1)}
                        </span>
                        <span className="text-sm text-white/40">
                          ({selectedEditingProduct.reviews_count} reviews)
                        </span>
                      </div>
                    )}

                    <div className="mt-4 rounded-2xl bg-black/40 p-3">
                      <p className="text-xs text-white/45">Task Price</p>
                      <p className="mt-1 text-xl font-black text-yellow-300">
                        ${Number(editingTask.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
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
      <p className="mt-1 text-xl font-black text-yellow-300">{value}</p>
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
        onChange={(event) => onChange(event.target.value)}
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
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
        step={step}
        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
      />
    </div>
  );
}