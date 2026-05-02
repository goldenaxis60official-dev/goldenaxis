//app>support>page.tsx

"use client";

import LuxuryCard from "@/components/ui/LuxuryCard";
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

type SupportTicket = {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: SupportStatus;
  admin_reply: string | null;
  created_at: string;
  replied_at: string | null;
};

type ChatMessage = {
  id: string;
  ticket_id: string;
  sender_id: string | null;
  sender_role: "user" | "admin";
  message: string;
  created_at: string;
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

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

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

  const finalSubject =
    activeTopic === "Wallet Help" && walletAction && walletAsset && walletNetwork
      ? `Wallet Help - ${walletAction.toUpperCase()} ${walletAsset} ${walletNetwork}`
      : activeTopic;

  const activeTopicData = helpTopics.find((item) => item.title === activeTopic);

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

  const groupedMessages = useMemo(() => {
    return tickets.map((ticket) => ({
      ticket,
      messages: chatMessages.filter((chat) => chat.ticket_id === ticket.id),
    }));
  }, [tickets, chatMessages]);

  async function loadTicketsAndChat() {
    setLoading(true);
    setErrorText("");

    const { data: ticketData, error: ticketError } = await supabase
      .from("support_messages")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: true });

    if (ticketError) {
      setErrorText(ticketError.message);
      setLoading(false);
      return;
    }

    const rows = (ticketData || []) as SupportTicket[];
    setTickets(rows);

    const ticketIds = rows.map((item) => item.id);

    if (ticketIds.length === 0) {
      setChatMessages([]);
      setLoading(false);
      return;
    }

    const { data: chatData, error: chatError } = await supabase
      .from("support_chat_messages")
      .select("*")
      .in("ticket_id", ticketIds)
      .order("created_at", { ascending: true });

    if (chatError) {
      setErrorText(chatError.message);
      setLoading(false);
      return;
    }

    setChatMessages((chatData || []) as ChatMessage[]);
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
    loadTicketsAndChat();
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

    let targetTicket = tickets.find(
      (ticket) =>
        ticket.subject === finalSubject &&
        ticket.status !== "closed"
    );

    if (!targetTicket) {
      const { data: newTicket, error: ticketError } = await supabase
        .from("support_messages")
        .insert({
          user_id: profile.id,
          subject: finalSubject,
          message: finalMessage,
          status: "open",
        })
        .select("*")
        .single();

      if (ticketError) {
        setErrorText(ticketError.message);
        setSubmitting(false);
        return;
      }

      targetTicket = newTicket as SupportTicket;
    } else {
      const { error: updateError } = await supabase
        .from("support_messages")
        .update({
          status: "open",
          message: finalMessage,
        })
        .eq("id", targetTicket.id);

      if (updateError) {
        setErrorText(updateError.message);
        setSubmitting(false);
        return;
      }
    }

    const { error: chatError } = await supabase
      .from("support_chat_messages")
      .insert({
        ticket_id: targetTicket.id,
        sender_id: profile.id,
        sender_role: "user",
        message: finalMessage,
      });

    if (chatError) {
      setErrorText(chatError.message);
      setSubmitting(false);
      return;
    }

    setSuccessText("Message sent to support.");
    setMessage("");
    setCopied(false);
    setSubmitting(false);

    await loadTicketsAndChat();
  }

  const openCount = tickets.filter((item) => item.status === "open").length;
  const reviewingCount = tickets.filter(
    (item) => item.status === "reviewing"
  ).length;
  const closedCount = tickets.filter((item) => item.status === "closed").length;

  return (
    <AppShell>
      <section className="px-5 pt-8">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">Support Chat</p>
            <h1 className="text-2xl font-black">Customer Support</h1>
            <p className="mt-1 text-xs text-white/45">
              Chat with support • Replies appear in this conversation
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

        <LuxuryCard className="mb-5 p-4">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-yellow-400/15 text-yellow-300">
              <Bot className="h-5 w-5" />
            </div>

            <div className="rounded-3xl rounded-tl-sm border border-yellow-400/20 bg-yellow-400/10 p-4">
              <p className="text-sm font-black text-yellow-100">
                Golden Axis Support
              </p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Hello {profile.display_name || "there"}, send a message below.
                For wallet help, choose deposit or withdraw first.
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

          <div className="space-y-5">
            {loading && (
              <div className="rounded-2xl bg-black/25 p-4 text-center text-sm text-white/50">
                Loading conversation...
              </div>
            )}

            {!loading && groupedMessages.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-center">
                <MessageCircle className="mx-auto mb-2 h-7 w-7 text-yellow-300" />
                <p className="text-sm font-bold text-white">
                  No conversation yet
                </p>
                <p className="mt-1 text-xs text-white/45">
                  Your chat with support will appear here.
                </p>
              </div>
            )}

            {!loading &&
              groupedMessages.map(({ ticket, messages }) => (
                <div key={ticket.id} className="space-y-3">
                  <div className="flex items-center justify-center">
                    <div className="rounded-full border border-white/10 bg-black/35 px-4 py-2 text-center">
                      <p className="text-[11px] font-black text-yellow-100/80">
                        {ticket.subject}
                      </p>
                      <div className="mt-1 flex items-center justify-center gap-2">
                        <StatusBadge status={ticket.status} />
                        <span className="text-[10px] text-white/30">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {messages.length === 0 ? (
                    <>
                      <ChatBubble
                        role="user"
                        message={ticket.message}
                        time={ticket.created_at}
                      />

                      {ticket.admin_reply ? (
                        <ChatBubble
                          role="admin"
                          message={ticket.admin_reply}
                          time={ticket.replied_at || ticket.created_at}
                        />
                      ) : (
                        <WaitingBubble />
                      )}
                    </>
                  ) : (
                    <>
                      {messages.map((chat) => (
                        <ChatBubble
                          key={chat.id}
                          role={chat.sender_role}
                          message={chat.message}
                          time={chat.created_at}
                        />
                      ))}

                      {ticket.status !== "closed" &&
                        !messages.some((chat) => chat.sender_role === "admin") && (
                          <WaitingBubble />
                        )}
                    </>
                  )}
                </div>
              ))}
          </div>
        </LuxuryCard>

        <form
          onSubmit={handleSubmit}
          className="sticky bottom-24 z-20 mb-6 rounded-[2rem] border border-yellow-400/25 bg-[#11100b]/95 p-4 shadow-[0_0_45px_rgba(234,179,8,0.18),0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-white/45">Message to support</p>
              <p className="text-sm font-black text-yellow-200">
                {finalSubject}
              </p>
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
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 px-5 py-4 font-black text-black shadow-[0_12px_32px_rgba(234,179,8,0.28)] active:scale-[0.98] disabled:opacity-60"
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

function ChatBubble({
  role,
  message,
  time,
}: {
  role: "user" | "admin";
  message: string;
  time: string;
}) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] rounded-3xl p-4 ${
          isUser
            ? "rounded-tr-sm border border-yellow-400/20 bg-yellow-400/15"
            : "rounded-tl-sm border border-white/10 bg-black/35"
        }`}
      >
        <div className="mb-2 flex items-center gap-2">
          {isUser ? (
            <MessageCircle className="h-4 w-4 text-yellow-300" />
          ) : (
            <Headphones className="h-4 w-4 text-yellow-300" />
          )}

          <p className="text-xs font-black text-yellow-100">
            {isUser ? "You" : "Support Reply"}
          </p>
        </div>

        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-white/80">
          {message}
        </p>

        <p className="mt-2 text-right text-[11px] text-white/35">
          {new Date(time).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function WaitingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-2xl bg-black/25 px-4 py-3 text-xs text-white/45">
        <Clock className="h-4 w-4 text-yellow-300" />
        Waiting for support review
      </div>
    </div>
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
    <div className="mb-5 ml-0 rounded-[1.7rem] border border-yellow-400/25 bg-gradient-to-br from-yellow-400/10 via-white/[0.035] to-black/30 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
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
                ? "border-yellow-400 bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 text-black shadow-[0_10px_25px_rgba(234,179,8,0.24)]"
                : "border-white/10 bg-white/[0.05] text-white/60 hover:bg-white/[0.08]"
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
                    Open Deposit Review and submit your amount plus transaction
                    hash/proof note. This chat is only for wallet help.
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
                To request withdrawal, open the Withdraw Request page and submit
                your amount plus your receiving {walletAsset} {walletNetwork}{" "}
                wallet address. This chat is only for help if you are confused.
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
    <div className="rounded-[1.25rem] border border-white/10 bg-black/35 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_25px_rgba(0,0,0,0.25)]">
      <p className="truncate text-[11px] font-medium tracking-wide text-white/45">
        {label}
      </p>
      <p className={`mt-1 font-black tabular-nums ${color}`}>{value}</p>
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