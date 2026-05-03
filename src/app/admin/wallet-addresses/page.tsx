//app>admin>wallet-addresses>page.tsx

"use client";

import { useEffect, useState } from "react";
import { en } from "@/i18n/en";
import { zh } from "@/i18n/zh";
import RequireAuth from "@/components/auth/RequireAuth";
import AdminNav from "../AdminNav";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import {
  AlertCircle,
  CheckCircle,
  Landmark,
  Save,
  ShieldCheck,
} from "lucide-react";

type WalletAsset = "USDT" | "USDC";
type WalletNetwork = "TRC20" | "ERC20";

type WalletAddressRow = {
  id?: string;
  asset: WalletAsset;
  network: WalletNetwork;
  address: string;
  memo: string | null;
  qr_image_url: string | null;
  active: boolean;
};
type AdminWalletAddressesText = typeof en.adminWalletAddresses;

const walletOptions: Array<{ asset: WalletAsset; network: WalletNetwork }> = [
  { asset: "USDT", network: "TRC20" },
  { asset: "USDT", network: "ERC20" },
  { asset: "USDC", network: "TRC20" },
  { asset: "USDC", network: "ERC20" },
];

function getKey(asset: WalletAsset, network: WalletNetwork) {
  return `${asset}-${network}`;
}

export default function AdminWalletAddressesPage() {
  return (
    <RequireAuth>
      {(profile) => <AdminWalletAddressesContent profile={profile} />}
    </RequireAuth>
  );
}

function AdminWalletAddressesContent({ profile }: { profile: Profile }) {
  const isAdmin = profile.role === "admin";
  const currentLanguage = profile.language === "zh" ? "zh" : "en";

  const t: AdminWalletAddressesText =
    currentLanguage === "zh"
      ? (zh.adminWalletAddresses as unknown as AdminWalletAddressesText)
      : en.adminWalletAddresses;

  const [rows, setRows] = useState<Record<string, WalletAddressRow>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");

  async function loadAddresses() {
    setLoading(true);
    setErrorText("");

    const { data, error } = await supabase
      .from("support_wallet_addresses")
      .select("*")
      .order("asset", { ascending: true })
      .order("network", { ascending: true });

    if (error) {
      setErrorText(error.message);
      setLoading(false);
      return;
    }

    const nextRows: Record<string, WalletAddressRow> = {};

    walletOptions.forEach((item) => {
      const existing = (data || []).find(
        (row) => row.asset === item.asset && row.network === item.network
      ) as WalletAddressRow | undefined;

      nextRows[getKey(item.asset, item.network)] = existing || {
  asset: item.asset,
  network: item.network,
  address: "",
  memo: "",
  qr_image_url: null,
  active: true,
};
    });

    setRows(nextRows);
    setLoading(false);
  }

  useEffect(() => {
    if (isAdmin) {
      loadAddresses();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  function updateRow(
    asset: WalletAsset,
    network: WalletNetwork,
    changes: Partial<WalletAddressRow>
  ) {
    const key = getKey(asset, network);

    setRows((current) => ({
      ...current,
      [key]: {
        ...current[key],
        asset,
        network,
        ...changes,
      },
    }));
  }

  async function handleQrUpload(
  asset: WalletAsset,
  network: WalletNetwork,
  file: File
) {
  const key = getKey(asset, network);

  setSavingKey(key);
  setSuccessText("");
  setErrorText("");

  const fileExt = file.name.split(".").pop() || "png";
  const filePath = `${asset}-${network}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("support-wallet-qrs")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    setErrorText(uploadError.message);
    setSavingKey(null);
    return;
  }

  const { data } = supabase.storage
    .from("support-wallet-qrs")
    .getPublicUrl(filePath);

  updateRow(asset, network, {
    qr_image_url: data.publicUrl,
  });

  setSuccessText(
  t.messages.qrUploaded
    .replace("{asset}", asset)
    .replace("{network}", network)
);
  setSavingKey(null);
}

  async function handleSave(asset: WalletAsset, network: WalletNetwork) {
    const key = getKey(asset, network);
    const row = rows[key];

    setSavingKey(key);
    setSuccessText("");
    setErrorText("");

    const { error } = await supabase.from("support_wallet_addresses").upsert(
      {
  asset,
  network,
  address: row?.address?.trim() || "",
  memo: row?.memo?.trim() || null,
  qr_image_url: row?.qr_image_url || null,
  active: row?.active ?? true,
  updated_at: new Date().toISOString(),
},
      { onConflict: "asset,network" }
    );

    if (error) {
      setErrorText(error.message);
      setSavingKey(null);
      return;
    }

    setSuccessText(
  t.messages.addressSaved
    .replace("{asset}", asset)
    .replace("{network}", network)
);
    setSavingKey(null);
    loadAddresses();
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

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4">
            <Landmark className="h-7 w-7 text-yellow-300" />
          </div>
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
          <div className="mb-5">
            <p className="text-sm text-yellow-200/80">{t.section.tag}</p>
<h2 className="text-2xl font-black">{t.section.title}</h2>
          </div>

          {loading ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center text-white/60">
              {t.section.loading}
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {walletOptions.map((item) => {
                const key = getKey(item.asset, item.network);
                const row = rows[key];

                return (
                  <div
                    key={key}
                    className="rounded-[1.7rem] border border-white/10 bg-black/25 p-5"
                  >
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-300">
                          {item.asset}
                        </p>
                        <h3 className="mt-1 text-xl font-black">
                          {t.form.addressTitle.replace("{network}", item.network)}
                        </h3>
                      </div>

                      <label className="flex items-center gap-2 text-sm text-white/60">
                        <input
                          type="checkbox"
                          checked={row?.active ?? true}
                          onChange={(event) =>
                            updateRow(item.asset, item.network, {
                              active: event.target.checked,
                            })
                          }
                        />
                        {t.form.active}
                      </label>
                    </div>

                    <div className="mb-4">
                      <p className="mb-2 text-sm font-bold text-white/80">
                        {t.form.depositAddress}
                      </p>
                      <textarea
                        value={row?.address || ""}
                        onChange={(event) =>
                          updateRow(item.asset, item.network, {
                            address: event.target.value,
                          })
                        }
                        placeholder={t.form.depositAddressPlaceholder
  .replace("{asset}", item.asset)
  .replace("{network}", item.network)}
                        className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
                      />
                    </div>

                    <div className="mb-4">
  <p className="mb-2 text-sm font-bold text-white/80">
    {t.form.qrImage}
  </p>

  {row?.qr_image_url ? (
    <div className="mb-3 flex items-center gap-4 rounded-2xl border border-white/10 bg-black/35 p-3">
      <img
        src={row.qr_image_url}
        alt={`${item.asset} ${item.network} QR`}
        className="h-24 w-24 rounded-2xl border border-white/10 bg-white object-cover p-1"
      />

      <div className="min-w-0">
        <p className="text-sm font-bold text-white">
          {t.form.qrImageUploaded}
        </p>
        <p className="mt-1 truncate text-xs text-white/45">
          {row.qr_image_url}
        </p>

        <button
          type="button"
          onClick={() =>
            updateRow(item.asset, item.network, {
              qr_image_url: null,
            })
          }
          className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200"
        >
          {t.form.removeQr}
        </button>
      </div>
    </div>
  ) : (
    <div className="mb-3 rounded-2xl border border-dashed border-white/10 bg-black/25 p-4 text-center text-sm text-white/45">
      {t.form.noQrImage}
    </div>
  )}

  <input
    type="file"
    accept="image/*"
    onChange={(event) => {
      const file = event.target.files?.[0];
      if (file) {
        handleQrUpload(item.asset, item.network, file);
      }
    }}
    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-yellow-400 file:px-4 file:py-2 file:font-black file:text-black"
  />
</div>

                    <div className="mb-5">
                      <p className="mb-2 text-sm font-bold text-white/80">
                        {t.form.note}
                      </p>
                      <input
                        value={row?.memo || ""}
                        onChange={(event) =>
                          updateRow(item.asset, item.network, {
                            memo: event.target.value,
                          })
                        }
                        placeholder={t.form.notePlaceholder}
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
                      />
                    </div>

                    <button
                      onClick={() => handleSave(item.asset, item.network)}
                      disabled={savingKey === key}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:opacity-60"
                    >
                      <Save className="h-5 w-5" />
                      {savingKey === key ? t.form.saving : t.form.saveAddress}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}