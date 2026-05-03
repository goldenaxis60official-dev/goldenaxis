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

type AssignmentRow = {
  assigned_step: number;
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

  const [amount, setAmount] = useState(Number(profile.balance || 0));
  const [asset, setAsset] = useState<WalletAsset>("USDT");
  const [network, setNetwork] = useState<WalletNetwork>("TRC20");
  const [receivingAddress, setReceivingAddress] = useState("");
  const [note, setNote] = useState("");

  const [assignedTotal, setAssignedTotal] = useState(0);
  const [maxAssignedStep, setMaxAssignedStep] = useState(0);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  const [loading, setLoading] = useState(false);
  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    async function loadAssignedProgress() {
      setLoadingAssignments(true);

      const { data, error } = await supabase
        .from("user_task_assignments")
        .select("assigned_step")
        .eq("user_id", profile.id)
        .eq("is_active", true)
        .order("assigned_step", { ascending: true });

      if (error) {
        setErrorText(error.message);
        setLoadingAssignments(false);
        return;
      }

      const rows = (data || []) as AssignmentRow[];
      const highestStep = rows.reduce(
        (max, row) => Math.max(max, Number(row.assigned_step)),
        0
      );

      setAssignedTotal(rows.length);
      setMaxAssignedStep(highestStep);
      setLoadingAssignments(false);
    }

    loadAssignedProgress();
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

  const completedCount = Math.max(profile.current_step - 1, 0);

  const completedAllAssignedMissions =
    assignedTotal > 0 && Number(profile.current_step) > maxAssignedStep;

  const hasNoAssignedTasks = !loadingAssignments && assignedTotal === 0;

  function openWalletSupport() {
    router.push(
      `/support?topic=wallet&action=withdraw&asset=${asset}&network=${network}`
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSuccessText("");
    setErrorText("");

    if (loadingAssignments) {
      setErrorText(t.withdraw.checkingProgressError);
      return;
    }

    if (hasNoAssignedTasks) {
      setErrorText(t.withdraw.noAssignedError);
      return;
    }

    if (!completedAllAssignedMissions) {
      setErrorText(t.withdraw.lockedError);
      return;
    }

    if (!amount || amount <= 0) {
      setErrorText(t.withdraw.validAmountError);
      return;
    }

    if (amount > Number(profile.balance)) {
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
      note.trim() ? `User Note: ${note.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const { error } = await supabase.from("wallet_requests").insert({
      user_id: profile.id,
      type: "withdrawal",
      amount,
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
    setReceivingAddress("");
    setNote("");
    setLoading(false);
  }

  return (
    <AppShell>
      <section className="px-5 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">{t.withdraw.walletCenter}</p>
            <h1 className="text-2xl font-black">{t.withdraw.withdrawRequest}</h1>
            <p className="mt-1 text-xs text-white/45">
  {t.withdraw.subtitle}
</p>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <Download className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <LuxuryCard goldGlow className="mb-5 p-5">
          <p className="text-sm text-white/50">{t.withdraw.availableBalance}</p>
          <h2 className="mt-2 text-4xl font-black">
            ${Number(profile.balance).toFixed(2)}
          </h2>

         <div className="mt-4 grid grid-cols-2 gap-3">
  <StatCard
    label={t.withdraw.missionProgress}
    value={
      loadingAssignments
        ? "..."
        : `${Math.min(completedCount, assignedTotal)} / ${
            assignedTotal || "-"
          }`
    }
    color="gold"
  />

  <StatCard
    label={t.withdraw.withdrawStatus}
    value={completedAllAssignedMissions ? t.withdraw.ready : t.withdraw.inProgress}
    color={completedAllAssignedMissions ? "green" : "gold"}
  />
</div>

          {hasNoAssignedTasks && (
            <div className="mt-4 flex gap-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-100/80">
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" />
              <p>
                {t.withdraw.noAssignedNote}
              </p>
            </div>
          )}

          {!hasNoAssignedTasks && !completedAllAssignedMissions && (
  <div className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-100/80">
    <div className="flex gap-3">
      <Lock className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" />
      <p>
        {t.withdraw.lockedNote}
      </p>
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

          {completedAllAssignedMissions && (
            <div className="mt-4 flex gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100/80">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              <p>
                {t.withdraw.readyNote}
              </p>
            </div>
          )}
        </LuxuryCard>

        <LuxuryCard className="p-5">
  <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <p className="mb-3 font-bold">{t.withdraw.requestAmount}</p>

            <input
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
              type="number"
              min="1"
              step="0.01"
              disabled={!completedAllAssignedMissions}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50 disabled:cursor-not-allowed"
            />
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
              disabled={!completedAllAssignedMissions}
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
              disabled={!completedAllAssignedMissions}
              placeholder={t.withdraw.notePlaceholder}
              className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="mb-5 rounded-[1.5rem] border border-white/10 bg-black/30 p-4">
            <p className="text-xs text-white/45">{t.withdraw.requestSummary}</p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-white/40">{t.withdraw.amount}</p>
                <p className="mt-1 font-black text-yellow-300">
                  ${Number(amount || 0).toFixed(2)}
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
                <p className="mt-1 font-black text-blue-300">{t.withdraw.pending}</p>
              </div>

              <div>
                <p className="text-xs text-white/40">{t.withdraw.balanceDeduct}</p>
                <p className="mt-1 font-black text-white">{t.withdraw.afterWithdraw}</p>
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
            disabled={loading || !completedAllAssignedMissions}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 px-5 py-4 font-black text-black shadow-[0_12px_32px_rgba(234,179,8,0.28)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-5 w-5" />
            {loading ? t.withdraw.submitting : t.withdraw.submitWithdrawalRequest}
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