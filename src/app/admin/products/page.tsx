"use client";

import { useEffect, useMemo, useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import AdminNav from "../AdminNav";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import type { Product } from "@/types/product";
import {
  AlertCircle,
  CheckCircle,
  Gem,
  ImagePlus,
  Pencil,
  Save,
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
};

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
};

export default function AdminProductsPage() {
  return (
    <RequireAuth>
      {(profile) => <AdminProductsContent profile={profile} />}
    </RequireAuth>
  );
}

function AdminProductsContent({ profile }: { profile: Profile }) {
  const isAdmin = profile.role === "admin";

  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [errorText, setErrorText] = useState("");
const [successText, setSuccessText] = useState("");

const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
const [deleting, setDeleting] = useState(false);

  const activeProducts = useMemo(
    () => products.filter((product) => product.is_active).length,
    [products]
  );

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
    if (isAdmin) {
      loadProducts();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

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

    setSuccessText(`${uploadedUrls.length} image uploaded.`);
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

  async function handleSaveProduct() {
    setSaving(true);
    setErrorText("");
    setSuccessText("");

    if (!form.name.trim()) {
      setErrorText("Product name is required.");
      setSaving(false);
      return;
    }

    if (Number(form.price) <= 0) {
      setErrorText("Product price must be greater than 0.");
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
      is_active: form.is_active,
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

      setSuccessText("Product updated successfully.");
    } else {
      const { error } = await supabase.from("products").insert(payload);

      if (error) {
        setErrorText(error.message);
        setSaving(false);
        return;
      }

      setSuccessText("Product created successfully.");
    }

    setSaving(false);
    resetForm();
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
      product.is_active ? "Product hidden successfully." : "Product activated."
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
      `This product is connected to Task Step ${linkedTasks[0].step_number}. Hide it instead, or remove the product connection from Task Library first.`
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
  setSuccessText("Product deleted successfully.");
  loadProducts();
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
    Product Customization
  </h1>

  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
    Manage gold and jewel campaign products, gallery photos, product value,
    rating stars, reviews, descriptions, and product visibility.
  </p>
</div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Products" value={String(products.length)} />
          <StatCard label="Active" value={String(activeProducts)} />
          <StatCard
            label="Hidden"
            value={String(products.length - activeProducts)}
          />
          <StatCard label="Storage" value="Gallery Ready" />
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
          <section className="rounded-[2rem] border border-yellow-400/20 bg-white/[0.045] p-5 shadow-[0_0_45px_rgba(212,175,55,0.08)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-200/80">
                  {form.id ? "Edit Product" : "Create Product"}
                </p>
                <h2 className="text-2xl font-black">
                  {form.id ? "Product Settings" : "New Product"}
                </h2>
              </div>

              <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
                <Gem className="h-6 w-6 text-yellow-300" />
              </div>
            </div>

            <div className="space-y-4">
              <TextInput
                label="Product Name"
                value={form.name}
                placeholder="18K Royal Gold Bracelet"
                onChange={(value) => setForm({ ...form, name: value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  label="Category"
                  value={form.category}
                  placeholder="Gold Jewelry"
                  onChange={(value) => setForm({ ...form, category: value })}
                />

                <TextInput
                  label="Currency"
                  value={form.currency}
                  placeholder="USD"
                  onChange={(value) => setForm({ ...form, currency: value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <NumberInput
                  label="Price"
                  value={form.price}
                  step="0.01"
                  onChange={(value) => setForm({ ...form, price: value })}
                />

                <NumberInput
                  label="Rating"
                  value={form.rating}
                  step="0.1"
                  onChange={(value) => setForm({ ...form, rating: value })}
                />

                <NumberInput
                  label="Reviews"
                  value={form.reviews_count}
                  onChange={(value) =>
                    setForm({ ...form, reviews_count: value })
                  }
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-bold text-white/80">
                  Description
                </p>
                <textarea
                  value={form.description}
                  placeholder="Premium polished jewel item prepared for campaign promotion."
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-bold text-white/80">
                  Product Gallery
                </p>

                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-yellow-400/30 bg-yellow-400/10 px-4 py-5 text-sm font-black text-yellow-300 hover:bg-yellow-400/15">
                  <ImagePlus className="h-5 w-5" />
                  {uploading ? "Uploading..." : "Upload Images"}
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
                          onClick={() =>
                            setForm({ ...form, main_image: image })
                          }
                          className="absolute bottom-1 left-1 rounded-full bg-black/75 px-2 py-1 text-[10px] font-bold text-white"
                        >
                          Main
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

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    setForm({ ...form, is_active: event.target.checked })
                  }
                />
                <span className="font-bold text-white/80">Active Product</span>
              </label>

              <button
                onClick={handleSaveProduct}
                disabled={saving || uploading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:opacity-60"
              >
                <Save className="h-5 w-5" />
                {saving ? "Saving..." : form.id ? "Update Product" : "Create Product"}
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-200/80">Catalog</p>
                <h2 className="text-2xl font-black">Product List</h2>
              </div>
            </div>

            {loading && (
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center text-white/60">
                Loading products...
              </div>
            )}

            {!loading && products.length === 0 && (
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center">
                <Gem className="mx-auto mb-4 h-12 w-12 text-yellow-300" />
                <p className="font-black">No products yet</p>
                <p className="mt-2 text-sm text-white/50">
                  Create your first gold or jewel product.
                </p>
              </div>
            )}

            {!loading && products.length > 0 && (
              <div className="overflow-x-auto rounded-[1.5rem] border border-white/10">
  <table className="min-w-[820px] w-full text-left text-sm">
                  <thead className="bg-white/[0.06] text-xs uppercase tracking-wide text-white/45">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Rating</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/10">
                    {products.map((product) => (
                      <tr key={product.id} className="bg-black/20">
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
                                {Array.isArray(product.images)
                                  ? product.images.length
                                  : 0}{" "}
                                photos
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-white/70">
                          {product.category}
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
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              product.is_active
                                ? "bg-emerald-400/15 text-emerald-300"
                                : "bg-red-500/15 text-red-300"
                            }`}
                          >
                            {product.is_active ? "Active" : "Hidden"}
                          </span>
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
    Edit
  </button>

  <button
    type="button"
    onClick={() => toggleProductStatus(product)}
    className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/[0.1]"
  >
    {product.is_active ? "Hide" : "Activate"}
  </button>

  <button
    type="button"
    onClick={() => setDeleteTarget(product)}
    className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-black text-red-300 hover:bg-red-500/15"
    title="Delete product"
  >
    <Trash2 className="h-4 w-4" />
    Delete
  </button>
</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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