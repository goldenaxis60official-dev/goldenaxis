//app>withdraw>page.tsx

"use client";

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
      setErrorText("Checking campaign progress. Please wait.");
      return;
    }

    if (hasNoAssignedTasks) {
      setErrorText(
        "Your campaign task list has not been assigned yet. Withdrawal is not available."
      );
      return;
    }

    if (!completedAllAssignedMissions) {
      setErrorText(
        "Complete all assigned campaign missions to unlock withdrawal request."
      );
      return;
    }

    if (!amount || amount <= 0) {
      setErrorText("Please enter a valid withdrawal amount.");
      return;
    }

    if (amount > Number(profile.balance)) {
      setErrorText("Request amount cannot exceed your campaign balance.");
      return;
    }

    if (!receivingAddress.trim()) {
      setErrorText(`Please enter your ${asset} ${network} receiving address.`);
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

    setSuccessText("Withdrawal request submitted for admin review.");
    setReceivingAddress("");
    setNote("");
    setLoading(false);
  }

  return (
    <AppShell>
      <section className="px-5 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">Wallet Center</p>
            <h1 className="text-2xl font-black">Withdraw Request</h1>
            <p className="mt-1 text-xs text-white/45">
  Withdrawal review opens after your campaign sequence is complete. Support is always available.
</p>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <Download className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <div className="mb-5 rounded-[2rem] border border-yellow-400/20 bg-white/[0.06] p-5 backdrop-blur-xl">
          <p className="text-sm text-white/50">Available Campaign Balance</p>
          <h2 className="mt-2 text-4xl font-black">
            ${Number(profile.balance).toFixed(2)}
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-black/30 p-3">
              <p className="text-xs text-white/45">Mission Progress</p>
              <p className="mt-1 font-bold text-yellow-300">
                {loadingAssignments
                  ? "..."
                  : `${Math.min(completedCount, assignedTotal)} / ${
                      assignedTotal || "-"
                    }`}
              </p>
            </div>

            <div className="rounded-2xl bg-black/30 p-3">
              <p className="text-xs text-white/45">Withdraw Status</p>
              <p
  className={`mt-1 font-bold ${
    completedAllAssignedMissions
      ? "text-emerald-300"
      : "text-yellow-300"
  }`}
>
  {completedAllAssignedMissions ? "Ready" : "In Progress"}
</p>
            </div>
          </div>

          {hasNoAssignedTasks && (
            <div className="mt-4 flex gap-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-100/80">
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" />
              <p>
                Your campaign task list is still preparing. Withdrawal becomes
                available after admin assigns and you complete your missions.
              </p>
            </div>
          )}

          {!hasNoAssignedTasks && !completedAllAssignedMissions && (
  <div className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-100/80">
    <div className="flex gap-3">
      <Lock className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" />
      <p>
        Your withdrawal review is preparing. It becomes available after your
        assigned campaign missions are completed.
      </p>
    </div>

    <button
      type="button"
      onClick={openWalletSupport}
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-yellow-400/25 bg-black/25 px-4 py-3 text-sm font-black text-yellow-100"
    >
      <MessageCircle className="h-4 w-4" />
      Contact Withdrawal Support
    </button>
  </div>
)}

          {completedAllAssignedMissions && (
            <div className="mt-4 flex gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100/80">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              <p>
                Your assigned campaign sequence is complete. You can submit a
                withdrawal request for admin review.
              </p>
            </div>
          )}
        </div>

        <form
  onSubmit={handleSubmit}
  className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl"
>
          <div className="mb-5">
            <p className="mb-3 font-bold">1. Request Amount</p>

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
            <p className="mb-3 font-bold">2. Select Withdraw Asset</p>

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

          <div className="mb-5 rounded-[1.7rem] border border-yellow-400/20 bg-yellow-400/[0.06] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-yellow-300" />
              <p className="font-black">4. Receiving Wallet</p>
            </div>

            <p className="mb-3 text-sm leading-6 text-white/55">
              Enter your personal receiving address. Make sure this address
              supports {asset} on {network}. Wrong network/address may cause
              loss.
            </p>

            <input
              value={receivingAddress}
              onChange={(event) => setReceivingAddress(event.target.value)}
              disabled={!completedAllAssignedMissions}
              placeholder={`Enter your ${asset} ${network} receiving address`}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50 disabled:cursor-not-allowed"
            />

            <button
              type="button"
              onClick={openWalletSupport}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-yellow-400/20 bg-black/30 px-5 py-4 font-bold text-yellow-100"
            >
              <MessageCircle className="h-5 w-5" />
              Need help? Open Wallet Support
            </button>
          </div>

          <div className="mb-5">
            <p className="mb-3 font-bold">5. Note Optional</p>

            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={!completedAllAssignedMissions}
              placeholder="Write note for admin..."
              className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="mb-5 rounded-[1.5rem] border border-white/10 bg-black/30 p-4">
            <p className="text-xs text-white/45">Request Summary</p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-white/40">Amount</p>
                <p className="mt-1 font-black text-yellow-300">
                  ${Number(amount || 0).toFixed(2)}
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
                <p className="mt-1 font-black text-blue-300">Pending</p>
              </div>

              <div>
                <p className="text-xs text-white/40">Balance Deduct</p>
                <p className="mt-1 font-black text-white">After withdraw</p>
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
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-5 w-5" />
            {loading ? "Submitting..." : "Submit Withdrawal Request"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/wallet-records?type=withdrawal")}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 font-bold text-white/75"
          >
            <ClipboardList className="h-5 w-5" />
            View Withdrawal Records
          </button>
        </form>
      </section>
    </AppShell>
  );
}