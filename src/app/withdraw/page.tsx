//app>withdraw>page.tsx

"use client";

import LuxuryCard from "@/components/ui/LuxuryCard";
import { getLanguage, messages } from "@/i18n";
import StatCard from "@/components/ui/StatCard";
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

const mainBalance = Number(profile.balance || 0);
const depositReserve = Number(profile.deposited_balance || 0);
const referralBalance = Number(profile.referral_bonus_balance || 0);
const taskProfitBalance = Number(profile.task_profit_balance || 0);

const availableBalance = mainBalance;

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
      <section className="px-5 pb-48 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">
              {t.withdraw.walletCenter}
            </p>
            <h1 className="text-2xl font-black">
              {t.withdraw.withdrawRequest}
            </h1>
            <p className="mt-1 text-xs text-white/45">{t.withdraw.subtitle}</p>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <Download className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <LuxuryCard goldGlow className="mb-5 p-5">
          <p className="text-sm text-white/50">{t.withdraw.availableBalance}</p>
          <h2 className="mt-2 text-4xl font-black">
            ${availableBalance.toFixed(2)}
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatCard
              label={t.withdraw.missionProgress}
              value={
                loadingProgress
                  ? "..."
                  : `${completedGeneratedCount} / ${generatedTotal || "-"}`
              }
              color="gold"
            />

            <StatCard
              label={t.withdraw.withdrawStatus}
              value={
                completedAllGeneratedOrders
                  ? t.withdraw.ready
                  : t.withdraw.inProgress
              }
              color={completedAllGeneratedOrders ? "green" : "gold"}
            />
          </div>

<div className="mt-4 grid grid-cols-2 gap-2">
  <div className="rounded-2xl bg-black/30 p-3">
    <p className="text-[10px] text-white/40">Main Balance</p>
    <p className="mt-1 text-sm font-black text-yellow-300">
      ${mainBalance.toFixed(2)}
    </p>
  </div>

  <div className="rounded-2xl bg-black/30 p-3">
    <p className="text-[10px] text-white/40">Deposit Reserve</p>
    <p className="mt-1 text-sm font-black text-white">
      ${depositReserve.toFixed(2)}
    </p>
  </div>

  <div className="rounded-2xl bg-black/30 p-3">
    <p className="text-[10px] text-white/40">Referral Tracker</p>
    <p className="mt-1 text-sm font-black text-yellow-300">
      ${referralBalance.toFixed(2)}
    </p>
  </div>

  <div className="rounded-2xl bg-black/30 p-3">
    <p className="text-[10px] text-white/40">Profit Tracker</p>
    <p className="mt-1 text-sm font-black text-emerald-300">
      ${taskProfitBalance.toFixed(2)}
    </p>
  </div>
</div>

          {hasNoGeneratedOrders && (
            <div className="mt-4 flex gap-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-100/80">
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" />
              <p>{t.withdraw.noAssignedNote}</p>
            </div>
          )}

          {!hasNoGeneratedOrders && !completedAllGeneratedOrders && (
            <div className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-100/80">
              <div className="flex gap-3">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" />
                <p>{t.withdraw.lockedNote}</p>
              </div>

              <button
                type="button"
                onClick={openWalletSupport}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-yellow-400/25 bg-black/25 px-4 py-3 text-sm font-black text-yellow-100"
              >
                <MessageCircle className="h-4 w-4" />
                {t.withdraw.contactSupport}
              </button>
            </div>
          )}

          {completedAllGeneratedOrders && (
            <div className="mt-4 flex gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100/80">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              <p>{t.withdraw.readyNote}</p>
            </div>
          )}

          {maxGeneratedStep > 0 && (
            <p className="mt-3 text-center text-xs text-white/35">
              Campaign step range: 1 / {maxGeneratedStep}
            </p>
          )}
        </LuxuryCard>

        <LuxuryCard className="mb-8 p-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <p className="mb-3 font-bold">{t.withdraw.requestAmount}</p>

              <div className="flex gap-3">
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  type="number"
                  min="1"
                  max={availableBalance}
                  step="0.01"
                  disabled={!completedAllGeneratedOrders}
                  placeholder="Enter custom amount"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50 disabled:cursor-not-allowed"
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
            </div>

            <div className="mb-5">
              <p className="mb-3 font-bold">{t.withdraw.selectAsset}</p>

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

            <div className="mb-5">
              <p className="mb-3 font-bold">{t.withdraw.selectNetwork}</p>

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

            <div className="mb-5 rounded-[1.7rem] border border-yellow-400/20 bg-yellow-400/[0.06] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-yellow-300" />
                <p className="font-black">{t.withdraw.receivingWallet}</p>
              </div>

              <p className="mb-3 text-sm leading-6 text-white/55">
                {t.withdraw.receivingWalletNote
                  .replace("{asset}", asset)
                  .replace("{network}", network)}
              </p>

              <input
                value={receivingAddress}
                onChange={(event) => setReceivingAddress(event.target.value)}
                disabled={!completedAllGeneratedOrders}
                placeholder={t.withdraw.receivingAddressPlaceholder
                  .replace("{asset}", asset)
                  .replace("{network}", network)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50 disabled:cursor-not-allowed"
              />

              <button
                type="button"
                onClick={openWalletSupport}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-yellow-400/20 bg-black/30 px-5 py-4 font-bold text-yellow-100"
              >
                <MessageCircle className="h-5 w-5" />
                {t.withdraw.walletSupport}
              </button>
            </div>

            <div className="mb-5">
              <p className="mb-3 font-bold">{t.withdraw.noteOptional}</p>

              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                disabled={!completedAllGeneratedOrders}
                placeholder={t.withdraw.notePlaceholder}
                className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="mb-5 rounded-[1.5rem] border border-white/10 bg-black/30 p-4">
              <p className="text-xs text-white/45">
                {t.withdraw.requestSummary}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-white/40">{t.withdraw.amount}</p>
                  <p className="mt-1 font-black text-yellow-300">
                    ${withdrawAmount.toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-white/40">{t.withdraw.method}</p>
                  <p className="mt-1 font-black text-white">
                    {asset} {network}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-white/40">{t.withdraw.status}</p>
                  <p className="mt-1 font-black text-blue-300">
                    {t.withdraw.pending}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-white/40">
                    {t.withdraw.balanceDeduct}
                  </p>
                  <p className="mt-1 font-black text-white">
                    {t.withdraw.afterWithdraw}
                  </p>
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
              disabled={loading || !completedAllGeneratedOrders}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 px-5 py-4 font-black text-black shadow-[0_12px_32px_rgba(234,179,8,0.28)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-5 w-5" />
              {loading
                ? t.withdraw.submitting
                : t.withdraw.submitWithdrawalRequest}
            </button>

            <button
              type="button"
              onClick={() => router.push("/wallet-records?type=withdrawal")}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 font-bold text-white/75"
            >
              <ClipboardList className="h-5 w-5" />
              {t.withdraw.viewWithdrawalRecords}
            </button>
          </form>
        </LuxuryCard>
      </section>
    </AppShell>
  );
}