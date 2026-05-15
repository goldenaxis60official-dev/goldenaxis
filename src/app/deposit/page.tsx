//src>app>deposit>page.tsx

"use client";

import LuxuryCard from "@/components/ui/LuxuryCard";
import { getLanguage, messages } from "@/i18n";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import {
  Wallet,
  AlertCircle,
  CheckCircle,
  BadgeDollarSign,
  ClipboardList,
  ShieldCheck,
  Copy,
  MessageCircle,
  QrCode,
  ArrowDownToLine,
  ImagePlus,
  X,
} from "lucide-react";

type WalletAsset = "USDT" | "USDC" | "BTC";
type WalletNetwork = "TRC20" | "ERC20" | "BTC";

type WalletAddress = {
  id: string;
  asset: WalletAsset;
  network: WalletNetwork;
  address: string;
  memo: string | null;
  qr_image_url: string | null;
  active: boolean;
};

const amounts = [100, 300, 500, 1000, 1500, 3000];

const assets: WalletAsset[] = ["USDT", "USDC", "BTC"];

const networkOptionsByAsset: Record<WalletAsset, WalletNetwork[]> = {
  USDT: ["TRC20", "ERC20"],
  USDC: ["TRC20", "ERC20"],
  BTC: ["BTC"],
};

function getDefaultNetworkForAsset(asset: WalletAsset): WalletNetwork {
  return asset === "BTC" ? "BTC" : "TRC20";
}

function getWalletLabel(asset: WalletAsset, network: WalletNetwork) {
  if (asset === "BTC" && network === "BTC") {
    return "BTC Bitcoin";
  }

  return `${asset} ${network}`;
}

function getNetworkLabel(asset: WalletAsset, network: WalletNetwork) {
  if (asset === "BTC" && network === "BTC") {
    return "Bitcoin";
  }

  return network;
}

function getDepositInstruction(asset: WalletAsset, network: WalletNetwork) {
  if (asset === "BTC" && network === "BTC") {
    return "Only send BTC using the native Bitcoin network. Wrong asset or network may lose funds.";
  }

  return `Only send ${asset} using ${network}. Wrong network may lose funds.`;
}

export default function DepositPage() {
  return (
    <RequireAuth>
      {(profile) => <DepositContent profile={profile} />}
    </RequireAuth>
  );
}

function DepositContent({ profile }: { profile: Profile }) {
  const router = useRouter();

  const lang = getLanguage(profile.language);
  const t = messages[lang];

const [depositAmount, setDepositAmount] = useState("");

  const [asset, setAsset] = useState<WalletAsset>("USDT");
  const [network, setNetwork] = useState<WalletNetwork>("TRC20");
  const [walletAddresses, setWalletAddresses] = useState<WalletAddress[]>([]);

  const [txHash, setTxHash] = useState("");
  const [note, setNote] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState("");

  const [addressLoading, setAddressLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");

  const finalAmount = Number(depositAmount || 0);

const rawMainBalance = Number(profile.balance || 0);
const depositReserve = Number(profile.deposited_balance || 0);
const referralBalance = Number(profile.referral_bonus_balance || 0);
const taskProfitBalance = Number(profile.task_profit_balance || 0);

const hasSplitBalances =
  profile.deposited_balance !== undefined ||
  profile.referral_bonus_balance !== undefined ||
  profile.task_profit_balance !== undefined;

const splitBalance = Number(
  (depositReserve + referralBalance + taskProfitBalance).toFixed(2)
);

// After split-balance SQL fix, profile.balance already represents the total.
// Do not add deposited_balance again.
const displayBalance = hasSplitBalances ? splitBalance : rawMainBalance;

const availableNetworks = networkOptionsByAsset[asset];

  async function loadWalletAddresses() {
    setAddressLoading(true);

    const { data, error } = await supabase
      .from("support_wallet_addresses")
      .select("*")
      .eq("active", true)
      .order("asset", { ascending: true })
      .order("network", { ascending: true });

    if (!error) {
      setWalletAddresses((data || []) as WalletAddress[]);
    }

    setAddressLoading(false);
  }

  useEffect(() => {
  const params = new URLSearchParams(window.location.search);

  const urlAsset = params.get("asset")?.toUpperCase();
  const urlNetwork = params.get("network")?.toUpperCase();

let nextAsset: WalletAsset = "USDT";

if (urlAsset === "USDT" || urlAsset === "USDC" || urlAsset === "BTC") {
  nextAsset = urlAsset;
}

const allowedNetworks = networkOptionsByAsset[nextAsset];
let nextNetwork: WalletNetwork = getDefaultNetworkForAsset(nextAsset);

if (
  (urlNetwork === "TRC20" || urlNetwork === "ERC20" || urlNetwork === "BTC") &&
  allowedNetworks.includes(urlNetwork)
) {
  nextNetwork = urlNetwork;
}

setAsset(nextAsset);
setNetwork(nextNetwork);

  loadWalletAddresses();
}, []);

  const selectedWalletAddress = useMemo(() => {
    return (
      walletAddresses.find(
        (item) =>
          item.asset === asset &&
          item.network === network &&
          item.active
      ) || null
    );
  }, [walletAddresses, asset, network]);

  const depositAddress = selectedWalletAddress?.address?.trim() || "";

  async function handleCopyAddress() {
    if (!depositAddress) return;

    await navigator.clipboard.writeText(depositAddress);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1600);
  }

  function openWalletSupport() {
    router.push(
      `/support?topic=wallet&action=deposit&asset=${asset}&network=${network}`
    );
  }

  async function uploadProofImage() {
  if (!proofFile) return "";

  const fileExt = proofFile.name.split(".").pop() || "jpg";
  const safeFileName = proofFile.name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9.-]/g, "");

  const filePath = `deposits/${profile.id}/${Date.now()}-${safeFileName || `proof.${fileExt}`}`;

  const { error: uploadError } = await supabase.storage
    .from("wallet-request-proofs")
    .upload(filePath, proofFile, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from("wallet-request-proofs")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

function handleProofChange(file: File | null) {
  setProofFile(file);

  if (!file) {
    setProofPreview("");
    return;
  }

  setProofPreview(URL.createObjectURL(file));
}

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSuccessText("");
    setErrorText("");

    if (!finalAmount || finalAmount <= 0) {
      setErrorText(t.deposit.validAmountError);
      return;
    }

    if (!depositAddress) {
  setErrorText(t.deposit.addressMissingError);
  return;
}

if (!txHash.trim() && !proofFile) {
  setErrorText(t.deposit.proofRequiredError);
  return;
}

setLoading(true);

let proofImageUrl = "";

try {
  proofImageUrl = await uploadProofImage();
} catch (uploadError) {
  setErrorText(
    uploadError instanceof Error
      ? uploadError.message
      : t.deposit.proofUploadFailed
  );
  setLoading(false);
  return;
}

const finalNote = [
      `Asset: ${asset}`,
      `Network: ${getNetworkLabel(asset, network)}`,
      `Deposit Address Used: ${depositAddress}`,
      txHash.trim() ? `Transaction Hash: ${txHash.trim()}` : null,
      note.trim() ? `User Note: ${note.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const { error } = await supabase.from("wallet_requests").insert({
  user_id: profile.id,
  type: "deposit_credit",
  amount: finalAmount,
  method: getWalletLabel(asset, network),
  note: finalNote,
  proof_image_url: proofImageUrl || null,
  status: "pending",
});

    if (error) {
      setErrorText(error.message);
      setLoading(false);
      return;
    }

    setSuccessText(t.deposit.successSubmitted);
    setTxHash("");
setNote("");
setDepositAmount("");
setProofFile(null);
setProofPreview("");
setLoading(false);
  }

return (
  <AppShell>
    <section className="px-5 pb-32 pt-7">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-yellow-200/70">
            Wallet Center
          </p>
          <h1 className="text-2xl font-black">Add Deposit</h1>
          <p className="mt-1 text-xs text-white/45">
            Choose amount, send payment, upload screenshot.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/wallet-records?type=deposit_credit")}
          className="rounded-2xl border border-yellow-400/25 bg-yellow-400/10 p-3 text-yellow-300 active:scale-95"
        >
          <ClipboardList className="h-6 w-6" />
        </button>
      </div>

      <LuxuryCard goldGlow className="mb-5 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-white/50">Current Balance</p>
            <h2 className="mt-1 text-4xl font-black">
              ${displayBalance.toFixed(2)}
            </h2>
            <p className="mt-2 text-xs text-white/45">
              Deposit will be added after review.
            </p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-yellow-300 to-yellow-600 p-3 text-black">
            <BadgeDollarSign className="h-7 w-7" />
          </div>
        </div>
      </LuxuryCard>

      <LuxuryCard className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="mb-5 rounded-[1.5rem] border border-yellow-400/20 bg-yellow-400/[0.06] p-4">
  <div className="mb-4 flex items-center gap-2">
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-sm font-black text-black">
      1
    </span>
    <div>
      <p className="font-black">Enter Deposit Amount</p>
      <p className="mt-0.5 text-xs text-white/40">
        Fill the amount you sent for review.
      </p>
    </div>
  </div>

  <div className="rounded-[1.4rem] border border-yellow-400/20 bg-black/35 p-3 shadow-[inset_0_0_24px_rgba(250,204,21,0.05)]">
    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-yellow-200/60">
      Amount
    </label>

    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-4 focus-within:border-yellow-400/55">
      <span className="text-2xl font-black text-yellow-300">$</span>

      <input
        value={depositAmount}
        onChange={(event) => setDepositAmount(event.target.value)}
        type="number"
        min="1"
        step="0.01"
        placeholder="Enter amount"
        className="w-full bg-transparent text-2xl font-black text-white outline-none placeholder:text-white/25"
      />
    </div>

    <p className="mt-3 text-xs leading-5 text-white/40">
      Your deposit will be added after payment proof is reviewed.
    </p>
  </div>
</div>

          <div className="mb-5 rounded-[1.5rem] border border-yellow-400/20 bg-yellow-400/[0.06] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-sm font-black text-black">
                2
              </span>
              <p className="font-black">Send Payment</p>
            </div>

<div className="mb-3 space-y-3">
  <div>
    <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-white/45">
      Asset
    </p>

    <div className="grid grid-cols-3 gap-2">
      {assets.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => {
            const nextNetwork = networkOptionsByAsset[item].includes(network)
              ? network
              : getDefaultNetworkForAsset(item);

            setAsset(item);
            setNetwork(nextNetwork);
          }}
          className={`rounded-2xl border px-4 py-3 text-sm font-black ${
            asset === item
              ? "border-yellow-400 bg-yellow-400 text-black"
              : "border-white/10 bg-black/30 text-white/70"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  </div>

  <div>
    <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-white/45">
      Network
    </p>

    <div
      className={`grid gap-2 ${
        availableNetworks.length === 1 ? "grid-cols-1" : "grid-cols-2"
      }`}
    >
      {availableNetworks.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setNetwork(item)}
          className={`rounded-2xl border px-4 py-3 text-sm font-black ${
            network === item
              ? "border-yellow-400 bg-yellow-400 text-black"
              : "border-white/10 bg-black/30 text-white/70"
          }`}
        >
          {getNetworkLabel(asset, item)}
        </button>
      ))}
    </div>
  </div>
</div>

            {addressLoading ? (
              <div className="rounded-2xl bg-black/30 p-4 text-center text-sm text-white/50">
                Loading wallet address...
              </div>
            ) : (
              <div className="rounded-2xl bg-black/35 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-white/40">Pay to</p>
<p className="font-black text-white">
  {getWalletLabel(asset, network)}
</p>
                  </div>

                  {depositAddress && (
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="flex items-center gap-1 rounded-full bg-yellow-400 px-3 py-2 text-xs font-black text-black active:scale-95"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copied ? "Copied" : "Copy"}
                    </button>
                  )}
                </div>

                {selectedWalletAddress?.qr_image_url ? (
  <div className="mb-3 flex items-center gap-3 rounded-2xl border border-yellow-400/15 bg-yellow-400/[0.06] p-3">
    <img
      src={selectedWalletAddress.qr_image_url}
      alt={`${getWalletLabel(asset, network)} QR`}
      className="h-24 w-24 rounded-2xl border border-white/10 bg-white object-contain p-1"
    />

    <div className="min-w-0">
      <div className="flex items-center gap-2 text-yellow-200">
        <QrCode className="h-4 w-4" />
        <p className="text-sm font-black">Scan QR</p>
      </div>

      <p className="mt-1 text-xs leading-5 text-white/45">
        Scan the official wallet QR or copy the address below.
      </p>
    </div>
  </div>
) : null}

                {depositAddress ? (
                  <p className="break-all rounded-xl bg-black/35 p-3 text-sm leading-6 text-yellow-100">
                    {depositAddress}
                  </p>
                ) : (
                  <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-200">
                    Address unavailable. Please contact support.
                  </p>
                )}

                <p className="mt-3 text-xs leading-5 text-white/45">
                  {getDepositInstruction(asset, network)}
                </p>
                {selectedWalletAddress?.memo ? (
  <p className="mt-2 rounded-xl border border-yellow-400/15 bg-yellow-400/[0.06] p-3 text-xs leading-5 text-yellow-100/80">
    {selectedWalletAddress.memo}
  </p>
) : null}

                <button
                  type="button"
                  onClick={openWalletSupport}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-yellow-400/20 bg-black/30 px-4 py-3 text-sm font-bold text-yellow-100"
                >
                  <MessageCircle className="h-4 w-4" />
                  Need help? Contact Support
                </button>
              </div>
            )}
          </div>

          <div className="mb-5 rounded-[1.5rem] border border-yellow-400/20 bg-yellow-400/[0.06] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-sm font-black text-black">
                3
              </span>
              <p className="font-black">Upload Screenshot</p>
            </div>

            {proofPreview ? (
              <div className="mb-3 overflow-hidden rounded-2xl border border-yellow-400/20 bg-black/40">
                <img
                  src={proofPreview}
                  alt="Deposit proof preview"
                  className="max-h-72 w-full object-cover"
                />

                <button
                  type="button"
                  onClick={() => handleProofChange(null)}
                  className="flex w-full items-center justify-center gap-2 border-t border-white/10 px-4 py-3 text-sm font-bold text-red-200"
                >
                  <X className="h-4 w-4" />
                  Remove Screenshot
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-yellow-400/30 bg-black/30 px-4 py-6 text-center active:scale-[0.99]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    handleProofChange(file);
                  }}
                  className="hidden"
                />

                <ImagePlus className="mb-2 h-7 w-7 text-yellow-300" />
                <span className="font-black text-yellow-100">
                  Tap to upload payment screenshot
                </span>
                <span className="mt-1 text-xs text-white/40">
                  Screenshot or transaction proof
                </span>
              </label>
            )}

            <input
              value={txHash}
              onChange={(event) => setTxHash(event.target.value)}
              placeholder="Transaction ID optional"
              className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
            />

            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Note optional"
              className="mt-3 min-h-20 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
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

          <button
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 px-5 py-4 font-black text-black shadow-[0_12px_32px_rgba(234,179,8,0.28)] active:scale-[0.98] disabled:opacity-60"
          >
            <ArrowDownToLine className="h-5 w-5" />
            {loading ? "Submitting..." : "Submit Deposit"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/wallet-records?type=deposit_credit")}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 font-bold text-white/75"
          >
            <ClipboardList className="h-5 w-5" />
            View Deposit Records
          </button>
        </form>
      </LuxuryCard>
    </section>
  </AppShell>
);
}