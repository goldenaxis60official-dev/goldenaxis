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

type WalletAsset = "USDT" | "USDC";
type WalletNetwork = "TRC20" | "ERC20";

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
const assets: WalletAsset[] = ["USDT", "USDC"];
const networks: WalletNetwork[] = ["TRC20", "ERC20"];

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

  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState("");

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

  const finalAmount = customAmount ? Number(customAmount) : Number(amount);

  const separatedBalance =
  Number(profile.deposited_balance || 0) +
  Number(profile.referral_bonus_balance || 0) +
  Number(profile.task_profit_balance || 0);

const displayBalance =
  separatedBalance > 0 ? separatedBalance : Number(profile.balance || 0);

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

  if (urlAsset === "USDT" || urlAsset === "USDC") {
    setAsset(urlAsset);
  }

  if (urlNetwork === "TRC20" || urlNetwork === "ERC20") {
    setNetwork(urlNetwork);
  }

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
      `Network: ${network}`,
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
  method: `${asset} ${network}`,
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
setCustomAmount("");
setProofFile(null);
setProofPreview("");
setLoading(false);
  }

  return (
    <AppShell>
      <section className="px-5 pb-32 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">{t.deposit.walletCenter}</p>
            <h1 className="text-2xl font-black">{t.deposit.depositCredits}</h1>
            <p className="mt-1 text-xs text-white/45">
              {t.deposit.subtitle}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <Wallet className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <LuxuryCard goldGlow className="mb-5 p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-white/50">{t.deposit.currentBalance}</p>
              <h2 className="mt-2 text-4xl font-black">
                ${displayBalance.toFixed(2)}
              </h2>

              <div className="mt-4 grid grid-cols-3 gap-2">
  <div className="rounded-2xl bg-black/30 p-3">
    <p className="text-[10px] text-white/40">Deposited</p>
    <p className="mt-1 text-sm font-black text-white">
      ${Number(profile.deposited_balance || 0).toFixed(2)}
    </p>
  </div>

  <div className="rounded-2xl bg-black/30 p-3">
    <p className="text-[10px] text-white/40">Referral</p>
    <p className="mt-1 text-sm font-black text-yellow-300">
      ${Number(profile.referral_bonus_balance || 0).toFixed(2)}
    </p>
  </div>

  <div className="rounded-2xl bg-black/30 p-3">
    <p className="text-[10px] text-white/40">Profit</p>
    <p className="mt-1 text-sm font-black text-emerald-300">
      ${Number(profile.task_profit_balance || 0).toFixed(2)}
    </p>
  </div>
</div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-yellow-300 to-yellow-600 p-3 text-black">
              <BadgeDollarSign className="h-7 w-7" />
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" />
            <p className="text-sm leading-6 text-yellow-100/80">
              {t.deposit.adminConfirmNote}
            </p>
          </div>
        </LuxuryCard>

        <LuxuryCard className="p-4">
  <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-bold">{t.deposit.selectAmount}</p>
              <p className="text-xs text-yellow-300">
                ${finalAmount > 0 ? finalAmount.toFixed(2) : "0.00"}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {amounts.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setAmount(value);
                    setCustomAmount("");
                  }}
                  className={`rounded-2xl border px-3 py-4 font-black ${
                    !customAmount && amount === value
                      ? "border-yellow-400 bg-yellow-400 text-black"
                      : "border-white/10 bg-black/30 text-white/75"
                  }`}
                >
                  ${value}
                </button>
              ))}
            </div>

            <input
              value={customAmount}
              onChange={(event) => setCustomAmount(event.target.value)}
              type="number"
              min="1"
              step="0.01"
              placeholder={t.deposit.customAmountPlaceholder}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
            />
          </div>

          <div className="mb-6">
            <p className="mb-3 font-bold">{t.deposit.selectAsset}</p>

            <div className="grid grid-cols-2 gap-3">
              {assets.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setAsset(item)}
                  className={`rounded-2xl border px-4 py-4 font-black ${
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

          <div className="mb-6">
            <p className="mb-3 font-bold">{t.deposit.selectNetwork}</p>

            <div className="grid grid-cols-2 gap-3">
              {networks.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setNetwork(item)}
                  className={`rounded-2xl border px-4 py-4 font-black ${
                    network === item
                      ? "border-yellow-400 bg-yellow-400 text-black"
                      : "border-white/10 bg-black/30 text-white/70"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6 rounded-[1.7rem] border border-yellow-400/20 bg-yellow-400/[0.06] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-yellow-300" />
                <p className="font-black">{t.deposit.sendPayment}</p>
              </div>

              {depositAddress && (
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-bold text-white/70"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? t.deposit.copied : t.deposit.copy}
                </button>
              )}
            </div>

            {addressLoading ? (
              <div className="rounded-2xl bg-black/30 p-4 text-center text-sm text-white/50">
                {t.deposit.loadingWallet}
              </div>
            ) : (
              <>
                {selectedWalletAddress?.qr_image_url && (
                  <div className="mb-4 flex justify-center">
                    <div className="rounded-[1.5rem] border border-yellow-400/20 bg-white p-3 shadow-[0_0_30px_rgba(234,179,8,0.15)]">
                      <img
                        src={selectedWalletAddress.qr_image_url}
                        alt={`${asset} ${network} deposit QR`}
                        className="h-44 w-44 rounded-2xl object-cover"
                      />
                    </div>
                  </div>
                )}

                <div className="rounded-2xl bg-black/30 p-4">
                  <p className="text-xs text-white/45">{t.deposit.assetNetwork}</p>
                  <p className="mt-1 font-black text-white">
                    {asset} • {network}
                  </p>

                  <p className="mt-4 text-xs text-white/45">{t.deposit.depositAddress}</p>

                  {depositAddress ? (
                    <p className="mt-1 break-all text-sm leading-6 text-yellow-100">
                      {depositAddress}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm leading-6 text-red-200">
                      {t.deposit.addressUnavailable}
                    </p>
                  )}

                  <p className="mt-4 text-xs text-white/45">{t.deposit.instruction}</p>
                  <p className="mt-1 text-sm leading-6 text-white/65">
                    {selectedWalletAddress?.memo ||
                      t.deposit.defaultInstruction
  .replace("{asset}", asset)
  .replace("{network}", network)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openWalletSupport}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-yellow-400/20 bg-black/30 px-5 py-4 font-bold text-yellow-100"
                >
                  <MessageCircle className="h-5 w-5" />
                  {t.deposit.walletSupport}
                </button>
              </>
            )}
          </div>

          <div className="mb-5">
            <p className="mb-3 font-bold">{t.deposit.submitReview}</p>

            <input
              value={txHash}
              onChange={(event) => setTxHash(event.target.value)}
              placeholder={t.deposit.txHashPlaceholder}
              className="mb-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
            />

            <div className="mb-3 rounded-[1.5rem] border border-white/10 bg-black/30 p-4">
  <div className="mb-3 flex items-center justify-between gap-3">
    <div>
      <p className="font-bold text-white">{t.deposit.proofTitle}</p>
      <p className="mt-1 text-xs text-white/45">
        {t.deposit.proofNote}
      </p>
    </div>

    <ImagePlus className="h-5 w-5 text-yellow-300" />
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
        {t.deposit.removeScreenshot}
      </button>
    </div>
  ) : (
    <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-yellow-400/25 bg-yellow-400/10 px-4 py-5 text-center text-sm font-bold text-yellow-100">
      <input
        type="file"
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0] || null;
          handleProofChange(file);
        }}
        className="hidden"
      />
      {t.deposit.uploadScreenshot}
    </label>
  )}
</div>

            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t.deposit.adminNotePlaceholder}
              className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
            />
          </div>

          <div className="mb-5 rounded-[1.5rem] border border-white/10 bg-black/30 p-4">
            <p className="text-xs text-white/45">{t.deposit.requestSummary}</p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-white/40">{t.deposit.amount}</p>
                <p className="mt-1 font-black text-yellow-300">
                  ${finalAmount > 0 ? finalAmount.toFixed(2) : "0.00"}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">{t.deposit.method}</p>
                <p className="mt-1 font-black text-white">
                  {asset} {network}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">{t.deposit.status}</p>
                <p className="mt-1 font-black text-blue-300">{t.deposit.pendingReview}</p>
              </div>

              <div>
                <p className="text-xs text-white/40">{t.deposit.balanceUpdate}</p>
                <p className="mt-1 font-black text-white">{t.deposit.afterApproval}</p>
              </div>
            </div>
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
            {loading ? t.deposit.submitting : t.deposit.submitDepositReview}
          </button>

          <button
            type="button"
            onClick={() => router.push("/wallet-records?type=deposit_credit")}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 font-bold text-white/75"
          >
            <ClipboardList className="h-5 w-5" />
            {t.deposit.viewDepositRecords}
          </button>
          </form>
</LuxuryCard>
      </section>
    </AppShell>
  );
}