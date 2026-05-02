//src>app>deposit>page.tsx

"use client";

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

  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState("");

  const [asset, setAsset] = useState<WalletAsset>("USDT");
  const [network, setNetwork] = useState<WalletNetwork>("TRC20");
  const [walletAddresses, setWalletAddresses] = useState<WalletAddress[]>([]);

  const [txHash, setTxHash] = useState("");
  const [note, setNote] = useState("");

  const [addressLoading, setAddressLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");

  const finalAmount = customAmount ? Number(customAmount) : Number(amount);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSuccessText("");
    setErrorText("");

    if (!finalAmount || finalAmount <= 0) {
      setErrorText("Please enter a valid credit amount.");
      return;
    }

    if (!depositAddress) {
      setErrorText(
        "Deposit address is not available. Please contact wallet support before sending."
      );
      return;
    }

    setLoading(true);

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
      status: "pending",
    });

    if (error) {
      setErrorText(error.message);
      setLoading(false);
      return;
    }

    setSuccessText("Deposit review request submitted.");
    setTxHash("");
    setNote("");
    setCustomAmount("");
    setLoading(false);
  }

  return (
    <AppShell>
      <section className="px-5 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">Wallet Center</p>
            <h1 className="text-2xl font-black">Deposit Credits</h1>
            <p className="mt-1 text-xs text-white/45">
              Send payment first, then submit for admin review.
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <Wallet className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <div className="mb-5 rounded-[2rem] border border-yellow-400/20 bg-white/[0.06] p-5 backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-white/50">Current Balance</p>
              <h2 className="mt-2 text-4xl font-black">
                ${Number(profile.balance).toFixed(2)}
              </h2>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-yellow-300 to-yellow-600 p-3 text-black">
              <BadgeDollarSign className="h-7 w-7" />
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" />
            <p className="text-sm leading-6 text-yellow-100/80">
              Deposit credits are added after admin confirms your payment.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl"
        >
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-bold">1. Select Amount</p>
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
              placeholder="Or enter custom amount"
              className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
            />
          </div>

          <div className="mb-6">
            <p className="mb-3 font-bold">2. Select Deposit Asset</p>

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
            <p className="mb-3 font-bold">3. Select Network</p>

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
                <p className="font-black">4. Send Payment</p>
              </div>

              {depositAddress && (
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-bold text-white/70"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
            </div>

            {addressLoading ? (
              <div className="rounded-2xl bg-black/30 p-4 text-center text-sm text-white/50">
                Loading deposit wallet...
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
                  <p className="text-xs text-white/45">Asset / Network</p>
                  <p className="mt-1 font-black text-white">
                    {asset} • {network}
                  </p>

                  <p className="mt-4 text-xs text-white/45">Deposit Address</p>

                  {depositAddress ? (
                    <p className="mt-1 break-all text-sm leading-6 text-yellow-100">
                      {depositAddress}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm leading-6 text-red-200">
                      Address is not available. Contact wallet support before
                      sending.
                    </p>
                  )}

                  <p className="mt-4 text-xs text-white/45">Instruction</p>
                  <p className="mt-1 text-sm leading-6 text-white/65">
                    {selectedWalletAddress?.memo ||
                      `Only send ${asset} using ${network} network.`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openWalletSupport}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-yellow-400/20 bg-black/30 px-5 py-4 font-bold text-yellow-100"
                >
                  <MessageCircle className="h-5 w-5" />
                  Need help? Open Wallet Support
                </button>
              </>
            )}
          </div>

          <div className="mb-5">
            <p className="mb-3 font-bold">5. Submit Review</p>

            <input
              value={txHash}
              onChange={(event) => setTxHash(event.target.value)}
              placeholder="Transaction hash / proof note optional"
              className="mb-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
            />

            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Write note for admin..."
              className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
            />
          </div>

          <div className="mb-5 rounded-[1.5rem] border border-white/10 bg-black/30 p-4">
            <p className="text-xs text-white/45">Request Summary</p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-white/40">Amount</p>
                <p className="mt-1 font-black text-yellow-300">
                  ${finalAmount > 0 ? finalAmount.toFixed(2) : "0.00"}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">Method</p>
                <p className="mt-1 font-black text-white">
                  {asset} {network}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">Status</p>
                <p className="mt-1 font-black text-blue-300">Pending Review</p>
              </div>

              <div>
                <p className="text-xs text-white/40">Balance Update</p>
                <p className="mt-1 font-black text-white">After Approval</p>
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
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:opacity-60"
          >
            <ArrowDownToLine className="h-5 w-5" />
            {loading ? "Submitting..." : "Submit Deposit Review"}
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
      </section>
    </AppShell>
  );
}