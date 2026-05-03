//src>app>admin>tasks>page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { en } from "@/i18n/en";
import { zh } from "@/i18n/zh";
import RequireAuth from "@/components/auth/RequireAuth";
import AdminNav from "../AdminNav";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import type { Task } from "@/types/task";
import type { Product } from "@/types/product";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Gem,
  Pencil,
  Save,
  Search,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";

type AdminTasksText = typeof en.adminTasks;

export default function AdminTasksPage() {
  return (
    <RequireAuth>
      {(profile) => <AdminTasksContent profile={profile} />}
    </RequireAuth>
  );
}

function AdminTasksContent({ profile }: { profile: Profile }) {
  const isAdmin = profile.role === "admin";
  const currentLanguage = profile.language === "zh" ? "zh" : "en";

  const t: AdminTasksText =
    currentLanguage === "zh"
      ? (zh.adminTasks as unknown as AdminTasksText)
      : en.adminTasks;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
const [typeFilter, setTypeFilter] = useState<"all" | "standard" | "lucky_bonus">("all");
const [connectionFilter, setConnectionFilter] = useState<"all" | "connected" | "unconnected">("all");
const [sortBy, setSortBy] = useState<"step_asc" | "step_desc" | "reward_high" | "price_high">("step_asc");
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(10);

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

function getTaskReward(task: Task) {
  return (
    Number(task.price) *
    Number(task.commission_rate) *
    Number(task.multiplier)
  );
}

const filteredTasks = useMemo(() => {
  const term = searchQuery.trim().toLowerCase();

  const result = tasks.filter((task) => {
    const product = task.products;

    const matchesSearch =
      !term ||
      String(task.step_number).includes(term) ||
      task.title.toLowerCase().includes(term) ||
      task.category.toLowerCase().includes(term) ||
      task.task_type.toLowerCase().includes(term) ||
      product?.name?.toLowerCase().includes(term) ||
      product?.category?.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && task.is_active) ||
      (statusFilter === "inactive" && !task.is_active);

    const matchesType =
      typeFilter === "all" || task.task_type === typeFilter;

    const isConnected = Boolean(task.products && task.products.is_active);

    const matchesConnection =
      connectionFilter === "all" ||
      (connectionFilter === "connected" && isConnected) ||
      (connectionFilter === "unconnected" && !isConnected);

    return matchesSearch && matchesStatus && matchesType && matchesConnection;
  });

  return [...result].sort((a, b) => {
    if (sortBy === "step_desc") {
      return Number(b.step_number) - Number(a.step_number);
    }

    if (sortBy === "reward_high") {
      return getTaskReward(b) - getTaskReward(a);
    }

    if (sortBy === "price_high") {
      return Number(b.price) - Number(a.price);
    }

    return Number(a.step_number) - Number(b.step_number);
  });
}, [tasks, searchQuery, statusFilter, typeFilter, connectionFilter, sortBy]);

const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));

const paginatedTasks = useMemo(() => {
  const start = (currentPage - 1) * pageSize;
  return filteredTasks.slice(start, start + pageSize);
}, [filteredTasks, currentPage, pageSize]);

const firstResult =
  filteredTasks.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;

const lastResult = Math.min(currentPage * pageSize, filteredTasks.length);

useEffect(() => {
  setCurrentPage(1);
}, [searchQuery, statusFilter, typeFilter, connectionFilter, sortBy, pageSize]);

useEffect(() => {
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }
}, [currentPage, totalPages]);

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

  const syncedProduct = editingTask.product_id
    ? products.find((product) => product.id === editingTask.product_id) ||
      editingTask.products ||
      null
    : null;

  if (editingTask.product_id && !syncedProduct) {
    setErrorText(t.messages.missingProduct);
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

  setSuccessText(
  t.messages.stepUpdated.replace("{step}", String(editingTask.step_number))
);
  setEditingTask(null);
  setSaving(false);
  loadData();
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
          <StatCard label={t.stats.totalTasks} value={String(tasks.length)} />
<StatCard label={t.stats.active} value={String(activeTasks)} />
<StatCard label={t.stats.luckyBonus} value={String(luckyTasks)} />
<StatCard label={t.stats.connected} value={`${connectedTasks}/${tasks.length}`} />
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
            {t.list.loading}
          </div>
        )}

        {!loading && (
  <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5">
    <div className="mb-5 flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
      <div>
        <p className="text-sm text-yellow-200/80">{t.list.missionSequence}</p>
<h2 className="text-2xl font-black">{t.list.campaignSteps}</h2>
<p className="mt-1 text-xs text-white/40">
  {t.list.description}
</p>
      </div>

      <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm font-black text-yellow-300">
        {filteredTasks.length} {t.list.shown} / {tasks.length} {t.list.total}
      </div>
    </div>

    <div className="mb-5 grid grid-cols-1 gap-3 xl:grid-cols-[1.4fr_0.7fr_0.8fr_0.9fr_0.8fr_0.6fr]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={t.list.searchPlaceholder}
          className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-yellow-400/50"
        />
      </div>

      <select
        value={statusFilter}
        onChange={(event) =>
          setStatusFilter(event.target.value as "all" | "active" | "inactive")
        }
        className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400/50"
      >
        <option className="bg-black" value="all">{t.list.allStatus}</option>
<option className="bg-black" value="active">{t.list.active}</option>
<option className="bg-black" value="inactive">{t.list.inactive}</option>
      </select>

      <select
        value={typeFilter}
        onChange={(event) =>
          setTypeFilter(event.target.value as "all" | "standard" | "lucky_bonus")
        }
        className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400/50"
      >
        <option className="bg-black" value="all">{t.list.allTypes}</option>
<option className="bg-black" value="standard">{t.list.standard}</option>
<option className="bg-black" value="lucky_bonus">{t.list.luckyBonus}</option>
      </select>

      <select
        value={connectionFilter}
        onChange={(event) =>
          setConnectionFilter(event.target.value as "all" | "connected" | "unconnected")
        }
        className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400/50"
      >
        <option className="bg-black" value="all">{t.list.allProducts}</option>
<option className="bg-black" value="connected">{t.list.connected}</option>
<option className="bg-black" value="unconnected">{t.list.unconnected}</option>
      </select>

      <select
        value={sortBy}
        onChange={(event) =>
          setSortBy(event.target.value as "step_asc" | "step_desc" | "reward_high" | "price_high")
        }
        className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400/50"
      >
        <option className="bg-black" value="step_asc">{t.list.stepAsc}</option>
<option className="bg-black" value="step_desc">{t.list.stepDesc}</option>
<option className="bg-black" value="reward_high">{t.list.rewardHigh}</option>
<option className="bg-black" value="price_high">{t.list.priceHigh}</option>
      </select>

      <select
        value={pageSize}
        onChange={(event) => setPageSize(Number(event.target.value))}
        className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400/50"
      >
        <option className="bg-black" value={10}>10</option>
        <option className="bg-black" value={25}>25</option>
        <option className="bg-black" value={50}>50</option>
        <option className="bg-black" value={80}>80</option>
      </select>
    </div>

    {filteredTasks.length === 0 && (
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center">
        <Search className="mx-auto mb-4 h-12 w-12 text-yellow-300" />
        <p className="font-black">{t.list.noMatching}</p>
<p className="mt-2 text-sm text-white/50">
  {t.list.noMatchingDescription}
</p>
      </div>
    )}

    {filteredTasks.length > 0 && (
      <>
        <div className="max-h-[660px] overflow-auto rounded-[1.5rem] border border-white/10">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[#151515] text-xs uppercase tracking-wide text-white/45">
              <tr>
                <th className="px-4 py-3">{t.list.step}</th>
<th className="px-4 py-3">{t.list.productTask}</th>
<th className="px-4 py-3">{t.list.type}</th>
<th className="px-4 py-3">{t.list.price}</th>
<th className="px-4 py-3">{t.list.reward}</th>
<th className="px-4 py-3">{t.list.status}</th>
<th className="px-4 py-3 text-right">{t.list.action}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {paginatedTasks.map((task) => {
                const lucky = task.task_type === "lucky_bonus";
                const product = task.products;
                const reward = getTaskReward(task);

                return (
                  <tr
                    key={task.id}
                    className="bg-black/20 transition hover:bg-white/[0.04]"
                  >
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
  ? `${product.category} • ${t.list.catalogConnected}`
  : `${task.category} • ${t.list.noCatalogProduct}`}
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
                        {lucky ? t.list.luckyBonus : t.list.standard}
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
                        {task.is_active ? t.list.active : t.list.inactive}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setEditingTask(task)}
                          className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-2 text-yellow-300 hover:bg-yellow-400/15"
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

        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/50 md:flex-row md:items-center md:justify-between">
          <p>
  {t.list.showing}{" "}
  <span className="font-black text-white">{firstResult}</span>
  {" - "}
  <span className="font-black text-white">{lastResult}</span>
  {" "}
  {t.list.of}{" "}
  <span className="font-black text-yellow-300">
    {filteredTasks.length}
  </span>{" "}
  {t.list.tasks}
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
)}

        {editingTask && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
            <div className="grid max-h-[90vh] w-full max-w-5xl grid-cols-[1fr_360px] overflow-hidden rounded-[2rem] border border-yellow-400/20 bg-[#090909] shadow-[0_0_60px_rgba(212,175,55,0.16)]">
              <div className="max-h-[90vh] overflow-y-auto p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-200/80">
  {t.modal.editStep} {editingTask.step_number}
</p>
<h2 className="text-2xl font-black">{t.modal.taskSettings}</h2>
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
  {t.modal.connectProduct}
</p>

    <select
      value={editingTask.product_id || ""}
      onChange={(event) => handleProductSelect(event.target.value)}
      className="w-full rounded-2xl border border-yellow-400/20 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-400/50"
    >
      <option value="">{t.modal.noProductSelected}</option>

      {products.map((product) => (
        <option key={product.id} value={product.id}>
          {product.name} — {product.currency}{" "}
          {Number(product.price).toFixed(2)}
        </option>
      ))}
    </select>

    <p className="mt-2 text-xs text-white/40">
  {t.modal.productNote}
</p>
  </div>

  {selectedEditingProduct ? (
    <div className="rounded-[1.5rem] border border-yellow-400/20 bg-yellow-400/10 p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-yellow-100/60">{t.modal.connectedProduct}</p>
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
          {t.modal.editProductDetails}
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-black/30 p-3">
          <p className="text-xs text-white/45">{t.modal.productPrice}</p>
          <p className="mt-1 font-black text-yellow-300">
            {selectedEditingProduct.currency}{" "}
            {Number(selectedEditingProduct.price).toFixed(2)}
          </p>
        </div>

        <div className="rounded-2xl bg-black/30 p-3">
          <p className="text-xs text-white/45">{t.modal.rating}</p>
          <p className="mt-1 font-black text-yellow-300">
            {Number(selectedEditingProduct.rating).toFixed(1)}
          </p>
        </div>

        <div className="rounded-2xl bg-black/30 p-3">
          <p className="text-xs text-white/45">{t.modal.reviews}</p>
          <p className="mt-1 font-black text-yellow-300">
            {selectedEditingProduct.reviews_count}
          </p>
        </div>
      </div>
    </div>
  ) : (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <p className="font-black text-white/80">{t.modal.noProductConnected}</p>
<p className="mt-2 text-sm text-white/45">
  {t.modal.noProductConnectedDescription}
</p>
    </div>
  )}

  <div className="grid grid-cols-3 gap-4">
    <div>
      <p className="mb-2 text-sm font-bold text-white/80">{t.modal.taskType}</p>
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
        <option value="standard">{t.list.standard}</option>
<option value="lucky_bonus">{t.list.luckyBonus}</option>
      </select>
    </div>

    <NumberInput
      label={t.modal.commissionRate}
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
      label={t.modal.multiplier}
      value={Number(editingTask.multiplier)}
      step="0.1"
      onChange={(value) =>
        setEditingTask({ ...editingTask, multiplier: value })
      }
    />
  </div>

  <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-4">
    <p className="text-sm font-black text-white/80">{t.modal.rewardPreview}</p>

    <div className="mt-3 grid grid-cols-3 gap-3">
      <div className="rounded-2xl bg-white/[0.05] p-3">
        <p className="text-xs text-white/45">{t.modal.taskValue}</p>
        <p className="mt-1 font-black text-white">
          ${Number(selectedEditingProduct?.price || editingTask.price).toFixed(2)}
        </p>
      </div>

      <div className="rounded-2xl bg-white/[0.05] p-3">
        <p className="text-xs text-white/45">{t.modal.multiplier}</p>
        <p className="mt-1 font-black text-blue-300">
          {Number(editingTask.multiplier).toFixed(1)}x
        </p>
      </div>

      <div className="rounded-2xl bg-white/[0.05] p-3">
        <p className="text-xs text-white/45">{t.modal.reward}</p>
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
    <span className="font-bold text-white/80">{t.modal.activeTask}</span>
  </label>

  <button
    onClick={handleSaveTask}
    disabled={saving}
    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:opacity-60"
  >
    <Save className="h-5 w-5" />
    {saving ? t.modal.saving : t.modal.saveTaskLogic}
  </button>
</div>
              </div>

              <aside className="border-l border-white/10 bg-white/[0.035] p-6">
                <p className="text-sm text-yellow-200/80">{t.modal.preview}</p>
<h3 className="mt-1 text-xl font-black">{t.modal.connectedProduct}</h3>

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
                          ({selectedEditingProduct.reviews_count} {t.modal.reviews})
                        </span>
                      </div>
                    )}

                    <div className="mt-4 rounded-2xl bg-black/40 p-3">
                      <p className="text-xs text-white/45">{t.modal.taskPrice}</p>
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