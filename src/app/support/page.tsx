//app>support>page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import {
  Headphones,
  MessageCircle,
  AlertCircle,
  CheckCircle,
  Clock,
  ShieldCheck,
  Wallet,
  Gem,
  Copy,
  ArrowDownToLine,
  ArrowUpFromLine,
  Coins,
} from "lucide-react";

type SupportMessage = {
  id: string;
  subject: string;
  message: string;
  status: "open" | "reviewing" | "closed";
  admin_reply: string | null;
  created_at: string;
  replied_at: string | null;
};

type WalletAsset = "USDT" | "USDC";
type WalletNetwork = "TRC20" | "ERC20";
type WalletAction = "deposit" | "withdraw";

type WalletAddress = {
  id: string;
  asset: WalletAsset;
  network: WalletNetwork;
  address: string;
  memo: string | null;
  active: boolean;
};

const helpTopics = [
  {
    title: "Mission Help",
    text: "Questions about campaign task progress, locked missions, or Lucky Bonus tasks.",
    icon: Gem,
  },
  {
    title: "Wallet Help",
    text: "Deposit address guide, withdrawal network help, and wallet records.",
    icon: Wallet,
  },
  {
    title: "Account Security",
    text: "Questions about login, profile access, and account safety.",
    icon: ShieldCheck,
  },
];

const assets: WalletAsset[] = ["USDT", "USDC"];
const networks: WalletNetwork[] = ["TRC20", "ERC20"];

export default function SupportPage() {
  return (
    <RequireAuth>
      {(profile) => <SupportContent profile={profile} />}
    </RequireAuth>
  );
}

function SupportContent({ profile }: { profile: Profile }) {
  const [subject, setSubject] = useState("Mission Help");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<SupportMessage[]>([]);

  const [walletAction, setWalletAction] = useState<WalletAction | null>(null);
  const [walletAsset, setWalletAsset] = useState<WalletAsset | null>(null);
  const [walletNetwork, setWalletNetwork] = useState<WalletNetwork | null>(
    null
  );
  const [walletAddresses, setWalletAddresses] = useState<WalletAddress[]>([]);
  const [copied, setCopied] = useState(false);

  const [loading, setLoading] = useState(true);
  const [addressLoading, setAddressLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");

  async function loadMessages() {
    setLoading(true);
    setErrorText("");

    const { data, error } = await supabase
      .from("support_messages")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorText(error.message);
      setLoading(false);
      return;
    }

    setMessages((data || []) as SupportMessage[]);
    setLoading(false);
  }

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
    loadMessages();
    loadWalletAddresses();
  }, [profile.id]);

  const selectedDepositAddress = useMemo(() => {
    if (!walletAsset || !walletNetwork) return null;

    return (
      walletAddresses.find(
        (item) =>
          item.asset === walletAsset &&
          item.network === walletNetwork &&
          item.active &&
          item.address?.trim()
      ) || null
    );
  }, [walletAddresses, walletAsset, walletNetwork]);

  const walletAutoMessage = useMemo(() => {
    if (subject !== "Wallet Help" || !walletAction || !walletAsset || !walletNetwork) {
      return "";
    }

    if (walletAction === "deposit") {
      if (!selectedDepositAddress) {
        return `Deposit Help Request

Asset: ${walletAsset}
Network: ${walletNetwork}

I selected ${walletAsset} deposit using ${walletNetwork}, but the deposit address is not available in support assistant right now. Please confirm the correct deposit address before I transfer.`;
      }

      return `Deposit Guide

Asset: ${walletAsset}
Network: ${walletNetwork}
Deposit Address: ${selectedDepositAddress.address}

${selectedDepositAddress.memo || "Please make sure the asset and network are correct before sending."}

After transfer, please send your transaction hash or deposit proof here for support review.`;
    }

    return `Withdrawal Help Request

Asset: ${walletAsset}
Network: ${walletNetwork}

Please help me with withdrawal using ${walletAsset} on ${walletNetwork} network.

I will provide:
1. Withdrawal amount
2. My receiving wallet address
3. Any memo/tag if required

Please review my withdrawal request.`;
  }, [
    subject,
    walletAction,
    walletAsset,
    walletNetwork,
    selectedDepositAddress,
  ]);

  useEffect(() => {
    if (walletAutoMessage) {
      setMessage(walletAutoMessage);
    }
  }, [walletAutoMessage]);

  function handleTopicSelect(nextSubject: string) {
    setSubject(nextSubject);
    setSuccessText("");
    setErrorText("");

    if (nextSubject !== "Wallet Help") {
      setWalletAction(null);
      setWalletAsset(null);
      setWalletNetwork(null);
      setCopied(false);
      setMessage("");
    }
  }

  async function handleCopyAddress() {
    if (!selectedDepositAddress?.address) return;

    await navigator.clipboard.writeText(selectedDepositAddress.address);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1600);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSubmitting(true);
    setSuccessText("");
    setErrorText("");

    if (subject === "Wallet Help") {
      if (!walletAction || !walletAsset || !walletNetwork) {
        setErrorText("Please select deposit or withdraw, asset, and network.");
        setSubmitting(false);
        return;
      }
    }

    const finalMessage = message.trim();

    if (!finalMessage) {
      setErrorText("Please write your message.");
      setSubmitting(false);
      return;
    }

    const finalSubject =
      subject === "Wallet Help" && walletAction && walletAsset && walletNetwork
        ? `Wallet Help - ${walletAction.toUpperCase()} ${walletAsset} ${walletNetwork}`
        : subject;

    const { error } = await supabase.from("support_messages").insert({
      user_id: profile.id,
      subject: finalSubject,
      message: finalMessage,
      status: "open",
    });

    if (error) {
      setErrorText(error.message);
      setSubmitting(false);
      return;
    }

    setSuccessText("Support message submitted successfully.");
    setMessage("");
    setWalletAction(null);
    setWalletAsset(null);
    setWalletNetwork(null);
    setCopied(false);
    setSubmitting(false);
    loadMessages();
  }

  const openCount = messages.filter((item) => item.status === "open").length;
  const reviewingCount = messages.filter(
    (item) => item.status === "reviewing"
  ).length;
  const closedCount = messages.filter((item) => item.status === "closed").length;

  return (
    <AppShell>
      <section className="px-5 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">Help Center</p>
            <h1 className="text-2xl font-black">Customer Support</h1>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <Headphones className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <div className="mb-5 rounded-[2rem] border border-yellow-400/20 bg-white/[0.06] p-5 backdrop-blur-xl">
          <div className="mb-3 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-yellow-300" />
            <h2 className="text-lg font-black">Support Center</h2>
          </div>

          <p className="text-sm leading-6 text-white/60">
            Get instant wallet guidance or send a support request to our review
            team.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-black/30 p-3">
              <p className="text-xs text-white/45">Open</p>
              <p className="mt-1 font-black text-blue-300">{openCount}</p>
            </div>

            <div className="rounded-2xl bg-black/30 p-3">
              <p className="text-xs text-white/45">Reviewing</p>
              <p className="mt-1 font-black text-yellow-300">
                {reviewingCount}
              </p>
            </div>

            <div className="rounded-2xl bg-black/30 p-3">
              <p className="text-xs text-white/45">Closed</p>
              <p className="mt-1 font-black text-emerald-300">{closedCount}</p>
            </div>
          </div>
        </div>

        <div className="mb-5 grid gap-3">
          {helpTopics.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.title}
                type="button"
                onClick={() => handleTopicSelect(item.title)}
                className={`rounded-[1.5rem] border p-4 text-left backdrop-blur-xl ${
                  subject === item.title
                    ? "border-yellow-400/40 bg-yellow-400/10"
                    : "border-white/10 bg-white/[0.05]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-300">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="font-black">{item.title}</h3>
                    <p className="mt-1 text-sm leading-5 text-white/50">
                      {item.text}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {subject === "Wallet Help" && (
          <div className="mb-5 rounded-[2rem] border border-yellow-400/20 bg-yellow-400/[0.07] p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-300" />
              <h2 className="text-lg font-black">Wallet Assistant</h2>
            </div>

            <p className="mb-4 text-sm leading-6 text-white/55">
              Select your wallet request type, asset, and network. The assistant
              will prepare the correct message automatically.
            </p>

            <div className="mb-4">
              <p className="mb-2 text-sm font-bold text-white/80">
                1. Select Request
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setWalletAction("deposit")}
                  className={`rounded-2xl border p-4 text-left ${
                    walletAction === "deposit"
                      ? "border-yellow-400 bg-yellow-400/15 text-yellow-100"
                      : "border-white/10 bg-black/30 text-white/60"
                  }`}
                >
                  <ArrowDownToLine className="mb-2 h-5 w-5 text-yellow-300" />
                  <p className="font-black">Deposit</p>
                  <p className="mt-1 text-xs text-white/45">
                    Get wallet address
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setWalletAction("withdraw")}
                  className={`rounded-2xl border p-4 text-left ${
                    walletAction === "withdraw"
                      ? "border-yellow-400 bg-yellow-400/15 text-yellow-100"
                      : "border-white/10 bg-black/30 text-white/60"
                  }`}
                >
                  <ArrowUpFromLine className="mb-2 h-5 w-5 text-yellow-300" />
                  <p className="font-black">Withdraw</p>
                  <p className="mt-1 text-xs text-white/45">
                    Send wallet details
                  </p>
                </button>
              </div>
            </div>

            {walletAction && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-bold text-white/80">
                  2. Select Asset
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {assets.map((asset) => (
                    <button
                      key={asset}
                      type="button"
                      onClick={() => setWalletAsset(asset)}
                      className={`rounded-2xl border px-4 py-3 font-black ${
                        walletAsset === asset
                          ? "border-yellow-400 bg-yellow-400 text-black"
                          : "border-white/10 bg-black/30 text-white/60"
                      }`}
                    >
                      {asset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {walletAction && walletAsset && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-bold text-white/80">
                  3. Select Network
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {networks.map((network) => (
                    <button
                      key={network}
                      type="button"
                      onClick={() => setWalletNetwork(network)}
                      className={`rounded-2xl border px-4 py-3 font-black ${
                        walletNetwork === network
                          ? "border-yellow-400 bg-yellow-400 text-black"
                          : "border-white/10 bg-black/30 text-white/60"
                      }`}
                    >
                      {network}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {walletAction && walletAsset && walletNetwork && (
              <div className="rounded-2xl border border-yellow-400/20 bg-black/35 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-yellow-200">
                    Auto Support Reply
                  </p>

                  {walletAction === "deposit" && selectedDepositAddress && (
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
                  <p className="text-sm text-white/50">
                    Loading wallet guide...
                  </p>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-6 text-white/75">
                    {walletAutoMessage}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl"
        >
          <div className="mb-5">
            <p className="mb-2 text-sm font-bold text-white/80">Subject</p>

            <select
              value={subject}
              onChange={(event) => handleTopicSelect(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-400/50"
            >
              <option>Mission Help</option>
              <option>Wallet Help</option>
              <option>Account Security</option>
              <option>Team Help</option>
              <option>Other Question</option>
            </select>
          </div>

          <div className="mb-5">
            <p className="mb-2 text-sm font-bold text-white/80">Message</p>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={
                subject === "Wallet Help"
                  ? "Your wallet guide will appear here after selection..."
                  : "Write your support message..."
              }
              className="min-h-40 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
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
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:opacity-60"
          >
            <MessageCircle className="h-5 w-5" />
            {submitting ? "Sending..." : "Send Support Message"}
          </button>
        </form>

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black">Support History</h2>
          <span className="text-xs text-yellow-300">
            {messages.length} records
          </span>
        </div>

        {loading && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 text-center text-white/60">
            Loading support history...
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center">
            <Headphones className="mx-auto mb-3 h-9 w-9 text-yellow-300" />
            <p className="font-bold">No support messages yet</p>
            <p className="mt-2 text-sm text-white/50">
              Your submitted support requests will appear here.
            </p>
          </div>
        )}

        <div className="space-y-4 pb-6">
          {messages.map((item) => (
            <div
              key={item.id}
              className="rounded-[1.7rem] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black">{item.subject}</h3>
                  <p className="mt-1 text-xs text-white/45">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    item.status === "closed"
                      ? "bg-emerald-400/10 text-emerald-300"
                      : item.status === "reviewing"
                      ? "bg-yellow-400/10 text-yellow-300"
                      : "bg-blue-400/10 text-blue-300"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div className="rounded-2xl bg-black/30 p-3">
                <p className="text-xs text-white/45">Your Message</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-white/70">
                  {item.message}
                </p>
              </div>

              {item.admin_reply ? (
                <div className="mt-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-3">
                  <p className="text-xs text-yellow-200/70">Admin Reply</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-yellow-100">
                    {item.admin_reply}
                  </p>

                  {item.replied_at && (
                    <p className="mt-2 text-xs text-yellow-100/45">
                      Replied: {new Date(item.replied_at).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2 rounded-2xl bg-black/30 p-3 text-sm text-white/50">
                  <Clock className="h-4 w-4 text-yellow-300" />
                  Waiting for support review
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}