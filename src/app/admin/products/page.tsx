//src>app>admin>products>page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { en } from "@/i18n/en";
import { zh } from "@/i18n/zh";
import RequireAuth from "@/components/auth/RequireAuth";
import AdminNav from "../AdminNav";
import { supabase } from "@/lib/supabaseClient";
import { canAccessAdminPath } from "@/lib/adminPermissions";
import type { Profile } from "@/types/profile";
import type { Product } from "@/types/product";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Gem,
  ImagePlus,
  Pencil,
  Save,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  X,
} from "lucide-react";

type ProductForm = {
  id?: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  rating: number;
  reviews_count: number;
  description: string;
  images: string[];
  main_image: string;
  is_active: boolean;
  product_type: "normal" | "lucky";
};

type AdminProductsText = typeof en.adminProducts;

const emptyForm: ProductForm = {
  name: "",
  category: "Gold Jewelry",
  price: 0,
  currency: "USD",
  rating: 4.8,
  reviews_count: 0,
  description: "",
  images: [],
  main_image: "",
  is_active: true,
  product_type: "normal",
};

type ProductTier = "tier1" | "tier2" | "tier3" | "out";

const productTierPlan = [
  {
    id: "tier1" as ProductTier,
    label: "Tier 1",
    range: "$100–$1,000",
    target: 60,
    min: 100,
    max: 1000,
    helper: "Basic gold, small jewelry, simple gem pieces",
  },
  {
    id: "tier2" as ProductTier,
    label: "Tier 2",
    range: "$1,001–$5,000",
    target: 40,
    min: 1001,
    max: 5000,
    helper: "Premium rings, bracelets, necklaces, polished gems",
  },
  {
    id: "tier3" as ProductTier,
    label: "Tier 3",
    range: "$5,001–$10,000",
    target: 20,
    min: 5001,
    max: 10000,
    helper: "Luxury diamond, rare gem, high-value jewel sets",
  },
];

const quickCategories = [
  "Gold Jewelry",
  "Diamond Ring",
  "Gem Pendant",
  "Luxury Necklace",
  "Gold Bracelet",
  "Rare Gem Set",
];

function getProductTier(price: number): ProductTier {
  if (price >= 100 && price <= 1000) return "tier1";
  if (price >= 1001 && price <= 5000) return "tier2";
  if (price >= 5001 && price <= 10000) return "tier3";
  return "out";
}

function getTierLabel(price: number) {
  const tier = getProductTier(price);

  if (tier === "tier1") return "Tier 1";
  if (tier === "tier2") return "Tier 2";
  if (tier === "tier3") return "Tier 3";

  return "Check Price";
}

function getTierRange(price: number) {
  const tier = productTierPlan.find((item) => item.id === getProductTier(price));
  return tier?.range || "Use $100–$10,000";
}

function buildDefaultDescription(name: string, category: string, price: number) {
  const tier = getTierLabel(price);

  return `${name || "Premium jewel item"} is prepared for Golden Axis 60 campaign promotion. Category: ${
    category || "Gold Jewelry"
  }. ${tier} product detail, and gallery-ready product display.`;
}

export default function AdminProductsPage() {
  return (
    <RequireAuth>
      {(profile) => <AdminProductsContent profile={profile} />}
    </RequireAuth>
  );
}

function AdminProductsContent({ profile }: { profile: Profile }) {
  const hasPageAccess = canAccessAdminPath(profile.role, "/admin/products");
  const currentLanguage = profile.language === "zh" ? "zh" : "en";

const t: AdminProductsText =
  currentLanguage === "zh"
    ? (zh.adminProducts as unknown as AdminProductsText)
    : en.adminProducts;

  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [errorText, setErrorText] = useState("");
const [successText, setSuccessText] = useState("");

const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
const [deleting, setDeleting] = useState(false);
const [searchQuery, setSearchQuery] = useState("");
const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden">("all");
const [categoryFilter, setCategoryFilter] = useState("all");
const [sortBy, setSortBy] = useState<
  "newest" | "name" | "price_high" | "price_low" | "rating"
>("newest");
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(10);

  const activeProducts = useMemo(
    () => products.filter((product) => product.is_active).length,
    [products]
  );

  const tierCounts = useMemo(() => {
  return {
    tier1: products.filter(
      (product) => getProductTier(Number(product.price)) === "tier1"
    ).length,
    tier2: products.filter(
      (product) => getProductTier(Number(product.price)) === "tier2"
    ).length,
    tier3: products.filter(
      (product) => getProductTier(Number(product.price)) === "tier3"
    ).length,
    out: products.filter(
      (product) => getProductTier(Number(product.price)) === "out"
    ).length,
  };
}, [products]);

const productTypeCounts = useMemo(() => {
  return {
    normal: products.filter((product) => product.product_type !== "lucky").length,
    lucky: products.filter((product) => product.product_type === "lucky").length,
  };
}, [products]);

  const categories = useMemo(() => {
  return Array.from(
    new Set(
      products
        .map((product) => product.category)
        .filter(Boolean)
    )
  );
}, [products]);

const filteredProducts = useMemo(() => {
  const term = searchQuery.trim().toLowerCase();

  const result = products.filter((product) => {
    const matchesSearch =
      !term ||
      product.name.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term) ||
      product.currency.toLowerCase().includes(term) ||
      (product.description || "").toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && product.is_active) ||
      (statusFilter === "hidden" && !product.is_active);

    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return [...result].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }

    if (sortBy === "price_high") {
      return Number(b.price) - Number(a.price);
    }

    if (sortBy === "price_low") {
      return Number(a.price) - Number(b.price);
    }

    if (sortBy === "rating") {
      return Number(b.rating) - Number(a.rating);
    }

    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
}, [products, searchQuery, statusFilter, categoryFilter, sortBy]);

const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));

const paginatedProducts = useMemo(() => {
  const start = (currentPage - 1) * pageSize;
  return filteredProducts.slice(start, start + pageSize);
}, [filteredProducts, currentPage, pageSize]);

const firstResult =
  filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;

const lastResult = Math.min(currentPage * pageSize, filteredProducts.length);

useEffect(() => {
  setCurrentPage(1);
}, [searchQuery, statusFilter, categoryFilter, sortBy, pageSize]);

useEffect(() => {
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }
}, [currentPage, totalPages]);

  async function loadProducts() {
    setLoading(true);
    setErrorText("");

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorText(error.message);
      setLoading(false);
      return;
    }

    setProducts((data || []) as Product[]);
    setLoading(false);
  }

  useEffect(() => {
  if (hasPageAccess) {
    loadProducts();
  } else {
    setLoading(false);
  }
}, [hasPageAccess]);

  function resetForm() {
    setForm(emptyForm);
    setErrorText("");
    setSuccessText("");
  }

  function editProduct(product: Product) {
    setForm({
      id: product.id,
      name: product.name,
      category: product.category,
      price: Number(product.price),
      currency: product.currency,
      rating: Number(product.rating),
      reviews_count: Number(product.reviews_count),
      description: product.description || "",
      images: Array.isArray(product.images) ? product.images : [],
      main_image: product.main_image || "",
      is_active: product.is_active,
product_type: product.product_type || "normal",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);
    setErrorText("");
    setSuccessText("");

    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop();
      const cleanExt = fileExt || "jpg";
      const fileName = `${crypto.randomUUID()}.${cleanExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setErrorText(uploadError.message);
        setUploading(false);
        return;
      }

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      uploadedUrls.push(data.publicUrl);
    }

    setForm((current) => {
      const nextImages = [...current.images, ...uploadedUrls];

      return {
        ...current,
        images: nextImages,
        main_image: current.main_image || nextImages[0] || "",
      };
    });

    setSuccessText(
  `${uploadedUrls.length} ${
    uploadedUrls.length > 1 ? t.messages.imagesUploaded : t.messages.imageUploaded
  }`
);
    setUploading(false);
  }

  function removeImage(url: string) {
    setForm((current) => {
      const nextImages = current.images.filter((image) => image !== url);
      const nextMain =
        current.main_image === url ? nextImages[0] || "" : current.main_image;

      return {
        ...current,
        images: nextImages,
        main_image: nextMain,
      };
    });
  }

  async function handleSaveProduct(mode: "normal" | "addAnother" = "normal") {
    setSaving(true);
    setErrorText("");
    setSuccessText("");

    if (!form.name.trim()) {
      setErrorText(t.validation.productNameRequired);
      setSaving(false);
      return;
    }

    if (Number(form.price) < 100 || Number(form.price) > 10000) {
  setErrorText("Product price must be between $100 and $10,000.");
  setSaving(false);
  return;
}

if (Number(form.rating) < 0 || Number(form.rating) > 5) {
  setErrorText("Rating must be between 0 and 5.");
  setSaving(false);
  return;
}

    const payload = {
      name: form.name.trim(),
      category: form.category.trim() || "Gold Jewelry",
      price: Number(form.price),
      currency: form.currency.trim() || "USD",
      rating: Number(form.rating),
      reviews_count: Number(form.reviews_count),
      description: form.description.trim() || null,
      images: form.images,
      main_image: form.main_image || form.images[0] || null,
      is_active: true,
product_type: form.product_type,
    };

    if (form.id) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", form.id);

      if (error) {
        setErrorText(error.message);
        setSaving(false);
        return;
      }

      setSuccessText(t.messages.productUpdated);
    } else {
      const { error } = await supabase.from("products").insert(payload);

      if (error) {
        setErrorText(error.message);
        setSaving(false);
        return;
      }

      setSuccessText(t.messages.productCreated);
    }

    setSaving(false);

if (mode === "addAnother") {
  setForm({
    ...emptyForm,
    category: form.category,
    currency: form.currency,
    rating: form.rating,
    reviews_count: form.reviews_count,
  });
} else {
  resetForm();
}

loadProducts();
  }

  async function toggleProductStatus(product: Product) {
    setErrorText("");
    setSuccessText("");

    const { error } = await supabase
      .from("products")
      .update({ is_active: !product.is_active })
      .eq("id", product.id);

    if (error) {
      setErrorText(error.message);
      return;
    }

    setSuccessText(
      product.is_active ? t.messages.productHidden : t.messages.productActivated
    );

    loadProducts();
  }

  async function confirmDeleteProduct() {
  if (!deleteTarget) return;

  const product = deleteTarget;

  setDeleting(true);
  setErrorText("");
  setSuccessText("");

  const { data: linkedTasks, error: linkedError } = await supabase
    .from("tasks")
    .select("id, step_number, title")
    .eq("product_id", product.id)
    .limit(1);

  if (linkedError) {
    setErrorText(linkedError.message);
    setDeleting(false);
    return;
  }

  if (linkedTasks && linkedTasks.length > 0) {
    setErrorText(
  t.messages.linkedTaskBlock.replace(
    "{step}",
    String(linkedTasks[0].step_number)
  )
);
    setDeleting(false);
    setDeleteTarget(null);
    return;
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", product.id);

  if (error) {
    setErrorText(error.message);
    setDeleting(false);
    return;
  }

  if (form.id === product.id) {
    resetForm();
  }

  setDeleteTarget(null);
  setDeleting(false);
  setSuccessText(t.messages.productDeleted);
  loadProducts();
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

<div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
  <StatCard label="Normal Products" value={`${productTypeCounts.normal} / 120`} />
  <StatCard label="Lucky Products" value={`${productTypeCounts.lucky} / 10`} />
  <StatCard label="Total Products" value={String(products.length)} />
  <StatCard label="Gallery Status" value={t.stats.galleryReady} />
</div>

<div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
  {productTierPlan.map((tier) => {
    const count = tierCounts[tier.id];

    return (
      <div
        key={tier.id}
        className="rounded-2xl border border-yellow-400/15 bg-yellow-400/[0.06] p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-yellow-300">
              {tier.label} Product Pool
            </p>
            <p className="mt-1 text-xs text-white/45">{tier.range}</p>
          </div>

          <span className="rounded-full border border-yellow-400/25 bg-black/30 px-3 py-1 text-xs font-black text-yellow-300">
            {count} / {tier.target}
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/50">
          <div
            className="h-full rounded-full bg-yellow-400"
            style={{
              width: `${Math.min(100, (count / tier.target) * 100)}%`,
            }}
          />
        </div>

        <p className="mt-3 text-xs leading-5 text-white/45">{tier.helper}</p>
      </div>
    );
  })}
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

        {deleteTarget && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-md"
    onClick={() => {
      if (!deleting) setDeleteTarget(null);
    }}
  >
    <div
      className="w-full max-w-md overflow-hidden rounded-[2rem] border border-red-400/25 bg-[#090909] shadow-[0_0_90px_rgba(239,68,68,0.18)]"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="border-b border-white/10 bg-gradient-to-br from-red-500/15 via-white/[0.04] to-yellow-400/10 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-400/30 bg-red-500/15">
              <Trash2 className="h-7 w-7 text-red-300" />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300/80">
                Confirm Delete
              </p>
              <h3 className="mt-1 text-xl font-black text-white">
                Delete Product?
              </h3>
            </div>
          </div>

          <button
            type="button"
            disabled={deleting}
            onClick={() => setDeleteTarget(null)}
            className="rounded-full border border-white/10 bg-white/[0.06] p-2 text-white/60 hover:bg-white/[0.1] hover:text-white disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-white/40">
            Product Name
          </p>
          <p className="mt-1 text-lg font-black text-yellow-300">
            {deleteTarget.name}
          </p>
        </div>

        <div className="flex gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm leading-6 text-red-100/80">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
          <p>
            This will permanently remove the product from the catalog. If this
            product is connected to a task, deletion will be blocked for safety.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={deleting}
            onClick={() => setDeleteTarget(null)}
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white/70 hover:bg-white/[0.1] disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={deleting}
            onClick={confirmDeleteProduct}
            className="rounded-2xl border border-red-400/40 bg-red-500/20 px-5 py-3 text-sm font-black text-red-200 hover:bg-red-500/30 disabled:opacity-40"
          >
            {deleting ? "Deleting..." : "Delete Permanently"}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
          <section className="rounded-[2rem] border border-yellow-400/20 bg-white/[0.045] p-5 shadow-[0_0_45px_rgba(212,175,55,0.08)] xl:sticky xl:top-8 xl:self-start">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-200/80">
                  {form.id ? t.form.editProduct : t.form.createProduct}
                </p>
                <h2 className="text-2xl font-black">
                  {form.id ? t.form.productSettings : t.form.newProduct}
                </h2>
              </div>

              <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
                <Gem className="h-6 w-6 text-yellow-300" />
              </div>
            </div>

            <div className="space-y-4">
  <TextInput
    label={t.form.productName}
    value={form.name}
    placeholder={t.form.productNamePlaceholder}
    onChange={(value) => setForm({ ...form, name: value })}
  />

  <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/[0.06] p-4">
  <div className="mb-3">
    <p className="text-sm font-black text-yellow-300">Product Type</p>
    <p className="mt-1 text-xs text-white/45">
      Normal products are used for auto orders. Lucky products are used only for lucky order injection.
    </p>
  </div>

  <div className="grid grid-cols-2 gap-2">
    <button
      type="button"
      onClick={() =>
        setForm({
          ...form,
          product_type: "normal",
          category: form.category || "Gold Jewelry",
        })
      }
      className={`rounded-xl border px-3 py-3 text-left text-xs font-black transition ${
        form.product_type === "normal"
          ? "border-yellow-400/60 bg-yellow-400/15 text-yellow-300"
          : "border-white/10 bg-black/30 text-white/55 hover:bg-white/[0.06]"
      }`}
    >
      Normal Product
      <span className="mt-1 block text-[11px] font-medium text-white/35">
        Auto order pool
      </span>
    </button>

    <button
      type="button"
      onClick={() =>
        setForm({
          ...form,
          product_type: "lucky",
          category: "Lucky Order",
        })
      }
      className={`rounded-xl border px-3 py-3 text-left text-xs font-black transition ${
        form.product_type === "lucky"
          ? "border-yellow-400/60 bg-yellow-400/15 text-yellow-300"
          : "border-white/10 bg-black/30 text-white/55 hover:bg-white/[0.06]"
      }`}
    >
      Lucky Product
      <span className="mt-1 block text-[11px] font-medium text-white/35">
        Lucky task only
      </span>
    </button>
  </div>
</div>

  <div>
  <div className="mb-2 flex items-center justify-between gap-3">
    <p className="text-sm font-bold text-white/80">Category</p>
    <p className="text-xs text-white/35">Choose or type manually</p>
  </div>

  <div className="mb-3 grid grid-cols-2 gap-2">
    {quickCategories.map((category) => (
      <button
        key={category}
        type="button"
        onClick={() => setForm({ ...form, category })}
        className={`rounded-xl border px-3 py-2 text-left text-xs font-black transition ${
          form.category === category
            ? "border-yellow-400/60 bg-yellow-400/15 text-yellow-300"
            : "border-white/10 bg-black/30 text-white/55 hover:bg-white/[0.06]"
        }`}
      >
        {category}
      </button>
    ))}
  </div>

  <TextInput
    label="Custom Category"
    value={form.category}
    placeholder="Example: Gold Bracelet"
    onChange={(value) => setForm({ ...form, category: value })}
  />
</div>

<div className="grid grid-cols-2 gap-3">
  <TextInput
    label="Currency"
    value={form.currency}
    placeholder="USD"
    onChange={(value) => setForm({ ...form, currency: value })}
  />

  <NumberInput
    label="Reviews"
    value={form.reviews_count}
    onChange={(value) => setForm({ ...form, reviews_count: value })}
  />
</div>

<div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/[0.06] p-4">
  <div className="mb-3 flex items-start justify-between gap-3">
    <div>
      <p className="text-sm font-black text-yellow-300">
        Product Price Tier Guide
      </p>
      <p className="mt-1 text-xs text-white/45">
        Price controls which pool this product belongs to.
      </p>
    </div>

    <span className="rounded-full border border-yellow-400/25 bg-black/40 px-3 py-1 text-xs font-black text-yellow-300">
      {getTierLabel(form.price)}
    </span>
  </div>

  <div className="grid grid-cols-1 gap-2">
    {productTierPlan.map((tier) => (
      <button
        key={tier.id}
        type="button"
        onClick={() =>
          setForm({
            ...form,
            price: tier.min,
          })
        }
        className={`rounded-xl border px-3 py-2 text-left text-xs transition ${
          getProductTier(form.price) === tier.id
            ? "border-yellow-400/60 bg-yellow-400/15 text-yellow-200"
            : "border-white/10 bg-black/30 text-white/50 hover:bg-white/[0.06]"
        }`}
      >
        <span className="font-black">{tier.label}</span>{" "}
        <span className="text-white/45">{tier.range}</span>
        <br />
        <span className="text-[11px] text-white/35">{tier.helper}</span>
      </button>
    ))}
  </div>
</div>

<div className="grid grid-cols-2 gap-3">
  <NumberInput
    label={`Price (${getTierRange(form.price)})`}
    value={form.price}
    step="0.01"
    onChange={(value) => setForm({ ...form, price: value })}
  />

  <NumberInput
    label="Rating (Max 5)"
    value={form.rating}
    step="0.1"
    min={0}
    max={5}
    onChange={(value) =>
      setForm({
        ...form,
        rating: Math.min(5, Math.max(0, value)),
      })
    }
  />
</div>

  <div>
    <p className="mb-2 text-sm font-bold text-white/80">
      {t.form.description}
    </p>

    <textarea
  value={form.description}
  placeholder={t.form.descriptionPlaceholder}
  onChange={(event) =>
    setForm({ ...form, description: event.target.value })
  }
  className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
/>

<button
  type="button"
  onClick={() =>
    setForm({
      ...form,
      description: buildDefaultDescription(
        form.name,
        form.category,
        form.price
      ),
    })
  }
  className="mt-2 w-full rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-2 text-xs font-black text-yellow-300 hover:bg-yellow-400/15"
>
  Auto-fill Premium Description
</button>
  </div>

  <div>
    <p className="mb-2 text-sm font-bold text-white/80">
      {t.form.productGallery}
    </p>

    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-yellow-400/30 bg-yellow-400/10 px-4 py-5 text-sm font-black text-yellow-300 hover:bg-yellow-400/15">
      <ImagePlus className="h-5 w-5" />
      {uploading ? t.form.uploading : t.form.uploadImages}

      <input
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(event) => handleUpload(event.target.files)}
      />
    </label>

    {form.images.length > 0 && (
      <div className="mt-3 grid grid-cols-3 gap-3">
        {form.images.map((image) => (
          <div
            key={image}
            className={`relative overflow-hidden rounded-2xl border ${
              form.main_image === image
                ? "border-yellow-400"
                : "border-white/10"
            }`}
          >
            <img
              src={image}
              alt="Product"
              className="h-24 w-full object-cover"
            />

            <button
              type="button"
              onClick={() => setForm({ ...form, main_image: image })}
              className="absolute bottom-1 left-1 rounded-full bg-black/75 px-2 py-1 text-[10px] font-bold text-white"
            >
              {t.form.main}
            </button>

            <button
              type="button"
              onClick={() => removeImage(image)}
              className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    )}
  </div>

  <div className="grid grid-cols-1 gap-3">
  <button
    onClick={() => handleSaveProduct("normal")}
    disabled={saving || uploading}
    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:opacity-60"
  >
    <Save className="h-5 w-5" />
    {saving
      ? t.form.saving
      : form.id
        ? t.form.updateProduct
        : t.form.createProductButton}
  </button>

  {!form.id && (
    <button
      type="button"
      onClick={() => handleSaveProduct("addAnother")}
      disabled={saving || uploading}
      className="rounded-2xl border border-yellow-400/25 bg-yellow-400/10 px-5 py-3 text-sm font-black text-yellow-300 hover:bg-yellow-400/15 disabled:opacity-60"
    >
      Save & Add Another
    </button>
  )}

  <button
    type="button"
    onClick={resetForm}
    disabled={saving || uploading}
    className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white/65 hover:bg-white/[0.1] disabled:opacity-60"
  >
    Clear Form
  </button>
</div>
</div>

          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5">
  <div className="mb-5 flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
    <div>
      <p className="text-sm text-yellow-200/80">{t.list.catalog}</p>
<h2 className="text-2xl font-black">{t.list.title}</h2>
<p className="mt-1 text-xs text-white/40">
  {t.list.description}
</p>
    </div>

    <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm font-black text-yellow-300">
      {filteredProducts.length} {t.list.shown} / {products.length} {t.list.total}
    </div>
  </div>

  <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_0.8fr_0.9fr_0.9fr_0.6fr]">
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
        setStatusFilter(event.target.value as "all" | "active" | "hidden")
      }
      className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400/50"
    >
      <option className="bg-black" value="all">{t.list.allStatus}</option>
<option className="bg-black" value="active">{t.list.activeOnly}</option>
<option className="bg-black" value="hidden">{t.list.hiddenOnly}</option>
    </select>

    <select
      value={categoryFilter}
      onChange={(event) => setCategoryFilter(event.target.value)}
      className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400/50"
    >
      <option className="bg-black" value="all">{t.list.allCategories}</option>

      {categories.map((category) => (
        <option key={category} className="bg-black" value={category}>
          {category}
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
            | "price_high"
            | "price_low"
            | "rating"
        )
      }
      className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400/50"
    >
      <option className="bg-black" value="newest">{t.list.newestFirst}</option>
<option className="bg-black" value="name">{t.list.nameAZ}</option>
<option className="bg-black" value="price_high">{t.list.priceHigh}</option>
<option className="bg-black" value="price_low">{t.list.priceLow}</option>
<option className="bg-black" value="rating">{t.list.topRating}</option>
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
    </select>
  </div>

  {loading && (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center text-white/60">
      {t.list.loading}
    </div>
  )}

  {!loading && products.length === 0 && (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center">
      <Gem className="mx-auto mb-4 h-12 w-12 text-yellow-300" />
      <p className="font-black">{t.list.noProducts}</p>
<p className="mt-2 text-sm text-white/50">
  {t.list.noProductsDescription}
</p>
    </div>
  )}

  {!loading && products.length > 0 && filteredProducts.length === 0 && (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center">
      <Search className="mx-auto mb-4 h-12 w-12 text-yellow-300" />
      <p className="font-black">{t.list.noMatching}</p>
<p className="mt-2 text-sm text-white/50">
  {t.list.noMatchingDescription}
</p>
    </div>
  )}

  {!loading && filteredProducts.length > 0 && (
    <>
      <div className="max-h-[640px] overflow-auto rounded-[1.5rem] border border-white/10">
        <table className="w-full min-w-[1060px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[#151515] text-xs uppercase tracking-wide text-white/45">
            <tr>
              <th className="px-4 py-3">{t.list.product}</th>
<th className="px-4 py-3">{t.list.category}</th>
<th className="px-4 py-3">Type</th>
<th className="px-4 py-3">Tier</th>
<th className="px-4 py-3">{t.list.price}</th>
<th className="px-4 py-3">{t.list.rating}</th>
<th className="px-4 py-3 text-right">{t.list.actions}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {paginatedProducts.map((product) => (
              <tr
                key={product.id}
                className="bg-black/20 transition hover:bg-white/[0.04]"
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06]">
                      {product.main_image ? (
                        <img
                          src={product.main_image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Gem className="h-6 w-6 text-yellow-300" />
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="font-black">{product.name}</p>
                      <p className="mt-1 text-xs text-white/45">
                        {Array.isArray(product.images) ? product.images.length : 0} {t.list.photos}
                      </p>
                    </div>
                  </div>
                </td>

<td className="px-4 py-4 text-white/70">
  {product.category}
</td>

<td className="px-4 py-4">
  <span
    className={`rounded-full border px-3 py-1 text-xs font-black ${
      product.product_type === "lucky"
        ? "border-purple-400/30 bg-purple-500/10 text-purple-200"
        : "border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
    }`}
  >
    {product.product_type === "lucky" ? "Lucky" : "Normal"}
  </span>
</td>

<td className="px-4 py-4">
  <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-black text-yellow-300">
    {product.product_type === "lucky"
      ? "Lucky"
      : getTierLabel(Number(product.price))}
  </span>
</td>

<td className="px-4 py-4 font-bold text-yellow-300">
  {product.currency} {Number(product.price).toFixed(2)}
</td>

                <td className="px-4 py-4">
                  <div className="flex items-center gap-1 text-yellow-300">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-bold">
                      {Number(product.rating).toFixed(1)}
                    </span>
                    <span className="text-xs text-white/40">
                      ({product.reviews_count})
                    </span>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => editProduct(product)}
                      className="flex items-center gap-2 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-3 py-2 text-xs font-black text-yellow-300 hover:bg-yellow-400/15"
                      title="Edit product"
                    >
                      <Pencil className="h-4 w-4" />
                      {t.list.edit}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(product)}
                      className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-black text-red-300 hover:bg-red-500/15"
                      title="Delete product"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t.list.delete}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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
  {filteredProducts.length}
</span>{" "}
{t.list.products}
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
        </div>
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
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-white/80">{label}</p>
      <input
        value={value}
        placeholder={placeholder}
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
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-white/80">{label}</p>
      <input
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
step={step}
min={min}
max={max}
        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
      />
    </div>
  );
}