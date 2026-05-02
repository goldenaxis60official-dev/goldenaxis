//app>support>page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Bot,
  CheckCircle,
  Clock,
  Copy,
  Gem,
  Headphones,
  MessageCircle,
  Send,
  ShieldCheck,
  Wallet,
} from "lucide-react";

type SupportStatus = "open" | "reviewing" | "closed";

type SupportMessage = {
  id: string;
  subject: string;
  message: string;
  status: SupportStatus;
  admin_reply: string | null;
  created_at: string;
  replied_at: string | null;
};

type SupportTopic = "Mission Help" | "Wallet Help" | "Account Security";

type WalletAsset = "USDT" | "USDC";
type WalletNetwork = "TRC20" | "ERC20";
type WalletAction = "deposit" | "withdraw";

type WalletAddress = {
  id: string;
  asset: WalletAsset;
  network: WalletNetwork;
  address: string;
  memo: string | null;
  qr_image_url: string | null;
  active: boolean;
};

const helpTopics: Array<{
  title: SupportTopic;
  short: string;
  text: string;
  icon: typeof Gem;
}> = [
  {
    title: "Mission Help",
    short: "Missions",
    text: "Task progress, locked missions, and Lucky Bonus help.",
    icon: Gem,
  },
  {
    title: "Wallet Help",
    short: "Wallet",
    text: "Deposit address, withdrawal network, and wallet records.",
    icon: Wallet,
  },
  {
    title: "Account Security",
    short: "Account",
    text: "Login, profile access, and account safety.",
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
  const [activeTopic, setActiveTopic] = useState<SupportTopic>("Mission Help");
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
      .order("created_at", { ascending: true });

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

  useEffect(() => {
  const params = new URLSearchParams(window.location.search);

  const topic = params.get("topic");
  const action = params.get("action");
  const asset = params.get("asset")?.toUpperCase();
  const network = params.get("network")?.toUpperCase();

  if (topic === "wallet") {
    setActiveTopic("Wallet Help");

    if (action === "deposit" || action === "withdraw") {
      setWalletAction(action);
    }

    if (asset === "USDT" || asset === "USDC") {
      setWalletAsset(asset);
    }

    if (network === "TRC20" || network === "ERC20") {
      setWalletNetwork(network);
    }
  }
}, []);

  const selectedWalletAddress = useMemo(() => {
    if (!walletAsset || !walletNetwork) return null;

    return (
      walletAddresses.find(
        (item) =>
          item.asset === walletAsset &&
          item.network === walletNetwork &&
          item.active
      ) || null
    );
  }, [walletAddresses, walletAsset, walletNetwork]);

  const depositAddress = selectedWalletAddress?.address?.trim() || "";

    function handleTopicSelect(topic: SupportTopic) {
    setActiveTopic(topic);
    setSuccessText("");
    setErrorText("");

    if (topic !== "Wallet Help") {
      setWalletAction(null);
      setWalletAsset(null);
      setWalletNetwork(null);
      setCopied(false);
      setMessage("");
    }
  }

  function handleWalletAction(action: WalletAction) {
    setWalletAction(action);
    setWalletAsset(null);
    setWalletNetwork(null);
    setCopied(false);
    setMessage("");
  }

  function handleWalletAsset(asset: WalletAsset) {
    setWalletAsset(asset);
    setWalletNetwork(null);
    setCopied(false);
    setMessage("");
  }

  async function handleCopyAddress() {
    if (!depositAddress) return;

    await navigator.clipboard.writeText(depositAddress);
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

    const finalMessage = message.trim();

    if (!finalMessage) {
      setErrorText("Please write your message.");
      setSubmitting(false);
      return;
    }

    const finalSubject =
      activeTopic === "Wallet Help" && walletAction && walletAsset && walletNetwork
        ? `Wallet Help - ${walletAction.toUpperCase()} ${walletAsset} ${walletNetwork}`
        : activeTopic;

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

    setSuccessText("Message sent to support.");
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

  const activeTopicData = helpTopics.find((item) => item.title === activeTopic);

  return (
    <AppShell>
      <section className="px-5 pt-8">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">Support Chat</p>
            <h1 className="text-2xl font-black">Customer Support</h1>
            <p className="mt-1 text-xs text-white/45">
              Online review • Usually replies after admin check
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <Headphones className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-3">
          <StatusCard label="Open" value={openCount} color="text-blue-300" />
          <StatusCard
            label="Reviewing"
            value={reviewingCount}
            color="text-yellow-300"
          />
          <StatusCard label="Closed" value={closedCount} color="text-emerald-300" />
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          {helpTopics.map((item) => {
            const Icon = item.icon;
            const active = activeTopic === item.title;

            return (
              <button
                key={item.title}
                type="button"
                onClick={() => handleTopicSelect(item.title)}
                className={`rounded-2xl border px-3 py-3 text-center transition ${
                  active
                    ? "border-yellow-400 bg-yellow-400 text-black"
                    : "border-white/10 bg-white/[0.05] text-white/60"
                }`}
              >
                <Icon
                  className={`mx-auto mb-1 h-5 w-5 ${
                    active ? "text-black" : "text-yellow-300"
                  }`}
                />
                <p className="text-xs font-black">{item.short}</p>
              </button>
            );
          })}
        </div>

        <div className="mb-5 rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 backdrop-blur-xl">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-yellow-400/15 text-yellow-300">
              <Bot className="h-5 w-5" />
            </div>

            <div className="rounded-3xl rounded-tl-sm border border-yellow-400/20 bg-yellow-400/10 p-4">
              <p className="text-sm font-black text-yellow-100">
                Golden Axis Support
              </p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Hello {profile.display_name || "there"}, select a topic below or
                send a message. For wallet help, I can show deposit QR, wallet
                address, and network instructions instantly.
              </p>
            </div>
          </div>

          {activeTopicData && (
            <div className="mb-4 ml-12 rounded-2xl border border-white/10 bg-black/25 p-3">
              <p className="text-xs font-bold text-yellow-200/80">
                Selected Topic
              </p>
              <p className="mt-1 text-sm font-black text-white">
                {activeTopicData.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-white/45">
                {activeTopicData.text}
              </p>
            </div>
          )}

          {activeTopic === "Wallet Help" && (
            <WalletAssistantCard
              walletAction={walletAction}
              walletAsset={walletAsset}
              walletNetwork={walletNetwork}
              selectedWalletAddress={selectedWalletAddress}
              depositAddress={depositAddress}
              copied={copied}
              addressLoading={addressLoading}
              onSelectAction={handleWalletAction}
              onSelectAsset={handleWalletAsset}
              onSelectNetwork={setWalletNetwork}
              onCopyAddress={handleCopyAddress}
            />
          )}

          <div className="space-y-4">
            {loading && (
              <div className="rounded-2xl bg-black/25 p-4 text-center text-sm text-white/50">
                Loading conversation...
              </div>
            )}

            {!loading && messages.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-center">
                <MessageCircle className="mx-auto mb-2 h-7 w-7 text-yellow-300" />
                <p className="text-sm font-bold text-white">
                  No conversation yet
                </p>
                <p className="mt-1 text-xs text-white/45">
                  Your messages and admin replies will appear here like chat.
                </p>
              </div>
            )}

            {!loading &&
              messages.map((item) => (
                <div key={item.id} className="space-y-3">
                  <div className="flex justify-end">
                    <div className="max-w-[88%] rounded-3xl rounded-tr-sm border border-yellow-400/20 bg-yellow-400/15 p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-xs font-black text-yellow-100">
                          {item.subject}
                        </p>
                        <StatusBadge status={item.status} />
                      </div>

                      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-white/80">
                        {item.message}
                      </p>

                      <p className="mt-2 text-right text-[11px] text-white/35">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {item.admin_reply ? (
                    <div className="flex justify-start">
                      <div className="max-w-[88%] rounded-3xl rounded-tl-sm border border-white/10 bg-black/35 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <Headphones className="h-4 w-4 text-yellow-300" />
                          <p className="text-xs font-black text-yellow-100">
                            Support Reply
                          </p>
                        </div>

                        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-white/75">
                          {item.admin_reply}
                        </p>

                        {item.replied_at && (
                          <p className="mt-2 text-[11px] text-white/35">
                            {new Date(item.replied_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-2xl bg-black/25 px-4 py-3 text-xs text-white/45">
                        <Clock className="h-4 w-4 text-yellow-300" />
                        Waiting for support review
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="sticky bottom-24 z-20 mb-6 rounded-[2rem] border border-yellow-400/20 bg-[#11100b]/95 p-4 shadow-[0_0_35px_rgba(234,179,8,0.12)] backdrop-blur-xl"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-white/45">Message to support</p>
              <p className="text-sm font-black text-yellow-200">{activeTopic}</p>
            </div>

            {successText && (
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-300">
                <CheckCircle className="h-4 w-4" />
                Sent
              </div>
            )}
          </div>

          {errorText && (
            <div className="mb-3 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              <AlertCircle className="h-4 w-4" />
              {errorText}
            </div>
          )}

          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={
  activeTopic === "Wallet Help"
    ? "Ask support a wallet question only..."
    : "Type your message..."
}
            className="mb-3 min-h-24 w-full rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
          />

          <button
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:opacity-60"
          >
            {submitting ? (
              "Sending..."
            ) : (
              <>
                <Send className="h-5 w-5" />
                Send Message
              </>
            )}
          </button>
        </form>
      </section>
    </AppShell>
  );
}

function WalletAssistantCard({
  walletAction,
  walletAsset,
  walletNetwork,
  selectedWalletAddress,
  depositAddress,
  copied,
  addressLoading,
  onSelectAction,
  onSelectAsset,
  onSelectNetwork,
  onCopyAddress,
}: {
  walletAction: WalletAction | null;
  walletAsset: WalletAsset | null;
  walletNetwork: WalletNetwork | null;
  selectedWalletAddress: WalletAddress | null;
  depositAddress: string;
  copied: boolean;
  addressLoading: boolean;
  onSelectAction: (action: WalletAction) => void;
  onSelectAsset: (asset: WalletAsset) => void;
  onSelectNetwork: (network: WalletNetwork) => void;
  onCopyAddress: () => void;
}) {
  return (
    <div className="mb-5 ml-0 rounded-[1.7rem] border border-yellow-400/20 bg-yellow-400/[0.06] p-4">
      <div className="mb-4 flex items-center gap-2">
        <Wallet className="h-5 w-5 text-yellow-300" />
        <div>
          <p className="text-sm font-black text-yellow-100">Wallet Assistant</p>
          <p className="text-xs text-white/45">
            Choose request type, asset, and network.
          </p>
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs font-bold text-white/60">1. Request Type</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onSelectAction("deposit")}
            className={`rounded-2xl border p-3 text-left ${
              walletAction === "deposit"
                ? "border-yellow-400 bg-yellow-400 text-black"
                : "border-white/10 bg-black/30 text-white/60"
            }`}
          >
            <ArrowDownToLine className="mb-2 h-5 w-5" />
            <p className="font-black">Deposit</p>
            <p className="mt-1 text-xs opacity-70">Get address / QR</p>
          </button>

          <button
            type="button"
            onClick={() => onSelectAction("withdraw")}
            className={`rounded-2xl border p-3 text-left ${
              walletAction === "withdraw"
                ? "border-yellow-400 bg-yellow-400 text-black"
                : "border-white/10 bg-black/30 text-white/60"
            }`}
          >
            <ArrowUpFromLine className="mb-2 h-5 w-5" />
            <p className="font-black">Withdraw</p>
            <p className="mt-1 text-xs opacity-70">Send wallet details</p>
          </button>
        </div>
      </div>

      {walletAction && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-bold text-white/60">2. Asset</p>
          <div className="grid grid-cols-2 gap-3">
            {assets.map((asset) => (
              <button
                key={asset}
                type="button"
                onClick={() => onSelectAsset(asset)}
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
          <p className="mb-2 text-xs font-bold text-white/60">3. Network</p>
          <div className="grid grid-cols-2 gap-3">
            {networks.map((network) => (
              <button
                key={network}
                type="button"
                onClick={() => onSelectNetwork(network)}
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
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-black text-yellow-200">
              {walletAction === "deposit"
                ? "Deposit Information"
                : "Withdrawal Request"}
            </p>

            {walletAction === "deposit" && depositAddress && (
              <button
                type="button"
                onClick={onCopyAddress}
                className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-bold text-white/70"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied" : "Copy Address"}
              </button>
            )}
          </div>

          {addressLoading ? (
            <p className="text-sm text-white/50">Loading wallet guide...</p>
          ) : walletAction === "deposit" ? (
            <div>
              {selectedWalletAddress?.qr_image_url && (
                <div className="mb-4 flex justify-center">
                  <div className="rounded-[1.5rem] border border-yellow-400/20 bg-white p-3 shadow-[0_0_30px_rgba(234,179,8,0.15)]">
                    <img
                      src={selectedWalletAddress.qr_image_url}
                      alt={`${walletAsset} ${walletNetwork} deposit QR`}
                      className="h-44 w-44 rounded-2xl object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-black/30 p-3">
                <p className="text-xs text-white/45">Asset / Network</p>
                <p className="mt-1 text-sm font-black text-white">
                  {walletAsset} • {walletNetwork}
                </p>

                <p className="mt-3 text-xs text-white/45">Deposit Address</p>
                {depositAddress ? (
                  <p className="mt-1 break-all text-sm leading-6 text-yellow-100">
                    {depositAddress}
                  </p>
                ) : (
                  <p className="mt-1 text-sm leading-6 text-red-200">
                    Address is not available. Please wait for support
                    confirmation before sending.
                  </p>
                )}

                <p className="mt-3 text-xs text-white/45">Instruction</p>
                <p className="mt-1 text-sm leading-6 text-white/70">
  {selectedWalletAddress?.memo ||
    "Please make sure the asset and network are correct before sending."}
</p>

<div className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-3">
  <p className="text-xs font-bold text-yellow-100/80">
    After you send payment
  </p>
  <p className="mt-1 text-sm leading-6 text-white/70">
    Open Deposit Review and submit your amount plus transaction hash/proof note.
    This chat is only for wallet help.
  </p>

  <Link
    href={`/deposit?asset=${walletAsset}&network=${walletNetwork}`}
    className="mt-3 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-4 py-3 text-sm font-black text-black"
  >
    Open Deposit Review
  </Link>
</div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-black/30 p-3">
              <p className="text-xs text-white/45">Withdrawal Network</p>
              <p className="mt-1 text-sm font-black text-white">
                {walletAsset} • {walletNetwork}
              </p>

              <p className="mt-3 text-sm leading-6 text-white/70">
  To request withdrawal, open the Withdraw Request page and submit your amount
  plus your receiving {walletAsset} {walletNetwork} wallet address. This chat is
  only for help if you are confused.
</p>

<Link
  href={`/withdraw?asset=${walletAsset}&network=${walletNetwork}`}
  className="mt-4 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-4 py-3 text-sm font-black text-black"
>
  Open Withdraw Request
</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
      <p className="text-xs text-white/45">{label}</p>
      <p className={`mt-1 font-black ${color}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: SupportStatus }) {
  const styles =
    status === "closed"
      ? "bg-emerald-400/10 text-emerald-300"
      : status === "reviewing"
      ? "bg-yellow-400/10 text-yellow-300"
      : "bg-blue-400/10 text-blue-300";

  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${styles}`}>
      {status}
    </span>
  );
}