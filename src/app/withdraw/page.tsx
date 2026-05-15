//app>withdraw>page.tsx

"use client";

import LuxuryCard from "@/components/ui/LuxuryCard";
import { getLanguage, messages } from "@/i18n";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import {
  Download,
  Lock,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  ClipboardList,
  Wallet,
  MessageCircle,
} from "lucide-react";

type WalletAsset = "USDT" | "USDC";
type WalletNetwork = "TRC20" | "ERC20";

type GeneratedOrderProgressRow = {
  step_number: number;
  status: "pending" | "completed" | "cancelled";
};

const assets: WalletAsset[] = ["USDT", "USDC"];
const networks: WalletNetwork[] = ["TRC20", "ERC20"];

export default function WithdrawPage() {
  return (
    <RequireAuth>
      {(profile) => <WithdrawContent profile={profile} />}
    </RequireAuth>
  );
}

function WithdrawContent({ profile }: { profile: Profile }) {
  const router = useRouter();

  const lang = getLanguage(profile.language);
  const t = messages[lang];

  const [amount, setAmount] = useState("");
  const [asset, setAsset] = useState<WalletAsset>("USDT");
  const [network, setNetwork] = useState<WalletNetwork>("TRC20");
  const [receivingAddress, setReceivingAddress] = useState("");
  const [note, setNote] = useState("");

  const [generatedTotal, setGeneratedTotal] = useState(0);
  const [completedGeneratedCount, setCompletedGeneratedCount] = useState(0);
  const [maxGeneratedStep, setMaxGeneratedStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(true);

  const [loading, setLoading] = useState(false);
  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    async function loadGeneratedProgress() {
      setLoadingProgress(true);
      setErrorText("");

      const { data, error } = await supabase
        .from("user_generated_orders")
        .select("step_number, status")
        .eq("user_id", profile.id)
        .in("status", ["pending", "completed"])
        .order("step_number", { ascending: true });

      if (error) {
        setErrorText(error.message);
        setLoadingProgress(false);
        return;
      }

      const rows = (data || []) as GeneratedOrderProgressRow[];

      const highestStep = rows.reduce(
        (max, row) => Math.max(max, Number(row.step_number)),
        0
      );

      const completedCount = rows.filter(
        (row) => row.status === "completed"
      ).length;

      setGeneratedTotal(rows.length);
      setCompletedGeneratedCount(completedCount);
      setMaxGeneratedStep(highestStep);
      setLoadingProgress(false);
    }

    loadGeneratedProgress();
  }, [profile.id]);

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
  }, []);

  const completedAllGeneratedOrders =
    generatedTotal > 0 && completedGeneratedCount >= generatedTotal;

  const hasNoGeneratedOrders = !loadingProgress && generatedTotal === 0;

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
const availableBalance = hasSplitBalances ? splitBalance : rawMainBalance;

// Keep this for the withdraw note text below.
const mainBalance = availableBalance;

  const withdrawAmount = Number(amount || 0);

  function openWalletSupport() {
    router.push(
      `/support?topic=wallet&action=withdraw&asset=${asset}&network=${network}`
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSuccessText("");
    setErrorText("");

    if (loadingProgress) {
      setErrorText(t.withdraw.checkingProgressError);
      return;
    }

    if (hasNoGeneratedOrders) {
      setErrorText(t.withdraw.noAssignedError);
      return;
    }

    if (!completedAllGeneratedOrders) {
      setErrorText(t.withdraw.lockedError);
      return;
    }

    if (!withdrawAmount || withdrawAmount <= 0) {
      setErrorText(t.withdraw.validAmountError);
      return;
    }

    if (withdrawAmount > availableBalance) {
      setErrorText(t.withdraw.exceedBalanceError);
      return;
    }

    if (!receivingAddress.trim()) {
      setErrorText(
        t.withdraw.receivingAddressError
          .replace("{asset}", asset)
          .replace("{network}", network)
      );
      return;
    }

    setLoading(true);

    const finalNote = [
      `Asset: ${asset}`,
      `Network: ${network}`,
      `Receiving Address: ${receivingAddress.trim()}`,
      `Generated Orders Completed: ${completedGeneratedCount}/${generatedTotal}`,
`Main Balance: ${mainBalance.toFixed(2)}`,
`Deposit Reserve: ${depositReserve.toFixed(2)}`,
`Referral Bonus Tracker: ${referralBalance.toFixed(2)}`,
`Task Profit Tracker: ${taskProfitBalance.toFixed(2)}`,
      note.trim() ? `User Note: ${note.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const { error } = await supabase.from("wallet_requests").insert({
      user_id: profile.id,
      type: "withdrawal",
      amount: withdrawAmount,
      method: `${asset} ${network}`,
      note: finalNote,
      status: "pending",
    });

    if (error) {
      setErrorText(error.message);
      setLoading(false);
      return;
    }

    setSuccessText(t.withdraw.successSubmitted);
    setAmount("");
    setReceivingAddress("");
    setNote("");
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
          <h1 className="text-2xl font-black">Withdraw</h1>
          <p className="mt-1 text-xs text-white/45">
            Cash out after your campaign is completed.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/wallet-records?type=withdrawal")}
          className="rounded-2xl border border-yellow-400/25 bg-yellow-400/10 p-3 text-yellow-300 active:scale-95"
        >
          <ClipboardList className="h-6 w-6" />
        </button>
      </div>

      <LuxuryCard goldGlow className="mb-5 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-white/50">Available Balance</p>
            <h2 className="mt-1 text-4xl font-black">
              ${availableBalance.toFixed(2)}
            </h2>

            <p className="mt-2 text-xs text-white/45">
              {loadingProgress
                ? "Checking campaign progress..."
                : `Completed ${completedGeneratedCount} / ${generatedTotal || "-"}`}
            </p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-yellow-300 to-yellow-600 p-3 text-black">
            <Download className="h-7 w-7" />
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-black/30 p-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-bold text-white/55">Withdraw Status</span>
            <span
              className={`font-black ${
                completedAllGeneratedOrders
                  ? "text-emerald-300"
                  : "text-yellow-300"
              }`}
            >
              {completedAllGeneratedOrders ? "Ready" : "Locked"}
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-black/45">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-200 to-yellow-500"
              style={{
                width:
                  generatedTotal > 0
                    ? `${Math.min(
                        100,
                        Math.round(
                          (completedGeneratedCount / generatedTotal) * 100
                        )
                      )}%`
                    : "0%",
              }}
            />
          </div>

          <p className="mt-3 text-xs leading-5 text-white/45">
            Withdraw becomes available after all assigned campaign missions are
            completed.
          </p>
        </div>
      </LuxuryCard>

      {!completedAllGeneratedOrders && (
        <LuxuryCard className="mb-5 p-5">
          <div className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-300">
              <Lock className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-black text-white">Withdraw Not Ready Yet</h2>

              <p className="mt-1 text-sm leading-6 text-white/55">
                Finish your current campaign first. After completion, you can
                submit a withdraw request here.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/missions")}
                  className="rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-black text-black active:scale-95"
                >
                  Go Missions
                </button>

                <button
                  type="button"
                  onClick={openWalletSupport}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-yellow-400/20 bg-black/30 px-4 py-3 text-sm font-bold text-yellow-100 active:scale-95"
                >
                  <MessageCircle className="h-4 w-4" />
                  Support
                </button>
              </div>
            </div>
          </div>
        </LuxuryCard>
      )}

      <LuxuryCard className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="mb-5 rounded-[1.5rem] border border-yellow-400/20 bg-yellow-400/[0.06] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-sm font-black text-black">
                1
              </span>
              <p className="font-black">Withdraw Amount</p>
            </div>

            <div className="flex gap-3">
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                type="number"
                min="1"
                max={availableBalance}
                step="0.01"
                disabled={!completedAllGeneratedOrders}
                placeholder="Enter amount"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() => setAmount(availableBalance.toFixed(2))}
                disabled={!completedAllGeneratedOrders}
                className="rounded-2xl border border-yellow-400/25 bg-yellow-400/10 px-4 py-3 text-sm font-black text-yellow-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Max
              </button>
            </div>

            <p className="mt-3 text-xs text-white/40">
              Available: ${availableBalance.toFixed(2)}
            </p>
          </div>

          <div className="mb-5 rounded-[1.5rem] border border-yellow-400/20 bg-yellow-400/[0.06] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-sm font-black text-black">
                2
              </span>
              <p className="font-black">Choose Wallet Type</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {assets.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setAsset(item)}
                  disabled={!completedAllGeneratedOrders}
                  className={`rounded-2xl border px-4 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50 ${
                    asset === item
                      ? "border-yellow-400 bg-yellow-400 text-black"
                      : "border-white/10 bg-black/30 text-white/70"
                  }`}
                >
                  {item}
                </button>
              ))}

              {networks.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setNetwork(item)}
                  disabled={!completedAllGeneratedOrders}
                  className={`rounded-2xl border px-4 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50 ${
                    network === item
                      ? "border-yellow-400 bg-yellow-400 text-black"
                      : "border-white/10 bg-black/30 text-white/70"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <p className="mt-3 text-xs leading-5 text-white/40">
              You will receive {asset} through {network}.
            </p>
          </div>

          <div className="mb-5 rounded-[1.5rem] border border-yellow-400/20 bg-yellow-400/[0.06] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-sm font-black text-black">
                3
              </span>
              <p className="font-black">Receiving Wallet</p>
            </div>

            <input
              value={receivingAddress}
              onChange={(event) => setReceivingAddress(event.target.value)}
              disabled={!completedAllGeneratedOrders}
              placeholder={`Paste your ${asset} ${network} wallet address`}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={!completedAllGeneratedOrders}
              placeholder="Note optional"
              className="mt-3 min-h-20 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <button
              type="button"
              onClick={openWalletSupport}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-yellow-400/20 bg-black/30 px-4 py-3 text-sm font-bold text-yellow-100 active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              Need help? Contact Support
            </button>
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
            disabled={loading || !completedAllGeneratedOrders}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 px-5 py-4 font-black text-black shadow-[0_12px_32px_rgba(234,179,8,0.28)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-5 w-5" />
            {loading ? "Submitting..." : "Submit Withdraw"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/wallet-records?type=withdrawal")}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 font-bold text-white/75 active:scale-95"
          >
            <ClipboardList className="h-5 w-5" />
            View Withdraw Records
          </button>
        </form>
      </LuxuryCard>
    </section>
  </AppShell>
);
}