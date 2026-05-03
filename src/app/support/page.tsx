//app>support>page.tsx

"use client";

import { getLanguage, messages } from "@/i18n";
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

type SupportTopic = "missionHelp" | "walletHelp" | "accountSecurity";

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
  key: SupportTopic;
  icon: typeof Gem;
}> = [
  {
    key: "missionHelp",
    icon: Gem,
  },
  {
    key: "walletHelp",
    icon: Wallet,
  },
  {
    key: "accountSecurity",
    icon: ShieldCheck,
  },
];

const topicSubjectMap: Record<SupportTopic, string> = {
  missionHelp: "Mission Help",
  walletHelp: "Wallet Help",
  accountSecurity: "Account Security",
};

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
  const lang = getLanguage(profile.language);
  const t = messages[lang];

  const [activeTopic, setActiveTopic] = useState<SupportTopic>("missionHelp");
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
  activeTopic === "walletHelp" && walletAction && walletAsset && walletNetwork
    ? `Wallet Help - ${walletAction.toUpperCase()} ${walletAsset} ${walletNetwork}`
    : topicSubjectMap[activeTopic];

const finalSubjectLabel =
  activeTopic === "walletHelp" && walletAction && walletAsset && walletNetwork
    ? `${t.support.topics.walletHelp.title} - ${t.support.walletActions[walletAction]} ${walletAsset} ${walletNetwork}`
    : t.support.topics[activeTopic].title;

const activeTopicData = helpTopics.find((item) => item.key === activeTopic);

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
      setActiveTopic("walletHelp");

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

    if (topic !== "walletHelp") {
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
      setErrorText(t.support.pleaseWriteMessage);
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

    setSuccessText(t.support.messageSent);
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
            <p className="text-sm text-yellow-200/80">{t.support.supportChat}</p>
            <h1 className="text-2xl font-black">{t.support.customerSupport}</h1>
            <p className="mt-1 text-xs text-white/45">
              {t.support.subtitle}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <Headphones className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-3">
          <StatusCard label={t.support.statuses.open} value={openCount} color="text-blue-300" />
<StatusCard
  label={t.support.statuses.reviewing}
  value={reviewingCount}
  color="text-yellow-300"
/>
<StatusCard
  label={t.support.statuses.closed}
  value={closedCount}
  color="text-emerald-300"
/>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          {helpTopics.map((item) => {
            const Icon = item.icon;
            const active = activeTopic === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleTopicSelect(item.key)}
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
                <p className="text-xs font-black">{t.support.topics[item.key].short}</p>
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
                {t.support.goldenAxisSupport}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                {t.support.hello.replace("{name}", profile.display_name || "there")}
              </p>
            </div>
          </div>

          {activeTopicData && (
            <div className="mb-4 ml-12 rounded-2xl border border-white/10 bg-black/25 p-3">
              <p className="text-xs font-bold text-yellow-200/80">
                {t.support.selectedTopic}
              </p>
              <p className="mt-1 text-sm font-black text-white">
                {t.support.topics[activeTopicData.key].title}
              </p>
              <p className="mt-1 text-xs leading-5 text-white/45">
                {t.support.topics[activeTopicData.key].text}
              </p>
            </div>
          )}

          {activeTopic === "walletHelp" && (
            <WalletAssistantCard
            t={t.support.walletAssistant}
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
                {t.support.loadingConversation}
              </div>
            )}

            {!loading && groupedMessages.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-center">
                <MessageCircle className="mx-auto mb-2 h-7 w-7 text-yellow-300" />
                <p className="text-sm font-bold text-white">
                  {t.support.noConversationYet}
                </p>
                <p className="mt-1 text-xs text-white/45">
                  {t.support.noConversationNote}
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
                        <StatusBadge status={ticket.status} labels={t.support.statuses} />
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
  youLabel={t.support.you}
  supportReplyLabel={t.support.supportReply}
/>

                      {ticket.admin_reply ? (
                        <ChatBubble
  role="admin"
  message={ticket.admin_reply}
  time={ticket.replied_at || ticket.created_at}
  youLabel={t.support.you}
  supportReplyLabel={t.support.supportReply}
/>
                      ) : (
                        <WaitingBubble label={t.support.waitingReview} />
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
  youLabel={t.support.you}
  supportReplyLabel={t.support.supportReply}
/>
                      ))}

                      {ticket.status !== "closed" &&
                        !messages.some((chat) => chat.sender_role === "admin") && (
                          <WaitingBubble label={t.support.waitingReview} />
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
              <p className="text-xs text-white/45">{t.support.messageToSupport}</p>
              <p className="text-sm font-black text-yellow-200">
                {finalSubjectLabel}
              </p>
            </div>

            {successText && (
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-300">
                <CheckCircle className="h-4 w-4" />
                {t.support.sent}
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
  activeTopic === "walletHelp"
    ? t.support.walletPlaceholder
    : t.support.defaultPlaceholder
}
            className="mb-3 min-h-24 w-full rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
          />

          <button
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 px-5 py-4 font-black text-black shadow-[0_12px_32px_rgba(234,179,8,0.28)] active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? (
  t.support.sending
) : (
  <>
    <Send className="h-5 w-5" />
    {t.support.sendMessage}
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
  youLabel,
  supportReplyLabel,
}: {
  role: "user" | "admin";
  message: string;
  time: string;
  youLabel: string;
  supportReplyLabel: string;
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
            {isUser ? youLabel : supportReplyLabel}
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

function WaitingBubble({ label }: { label: string }) {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-2xl bg-black/25 px-4 py-3 text-xs text-white/45">
        <Clock className="h-4 w-4 text-yellow-300" />
        {label}
      </div>
    </div>
  );
}

type WalletAssistantText = {
  title: string;
  note: string;
  requestType: string;
  deposit: string;
  depositHint: string;
  withdraw: string;
  withdrawHint: string;
  asset: string;
  network: string;
  depositInformation: string;
  withdrawalRequest: string;
  copied: string;
  copyAddress: string;
  loadingGuide: string;
  assetNetwork: string;
  depositAddress: string;
  addressUnavailable: string;
  instruction: string;
  defaultInstruction: string;
  afterPayment: string;
  afterPaymentNote: string;
  openDepositReview: string;
  withdrawalNetwork: string;
  withdrawNote: string;
  openWithdrawRequest: string;
};

function WalletAssistantCard({
  t,
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
  t: WalletAssistantText;
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
          <p className="text-sm font-black text-yellow-100">{t.title}</p>
          <p className="text-xs text-white/45">
            {t.note}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs font-bold text-white/60">{t.requestType}</p>
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
            <p className="font-black">{t.deposit}</p>
            <p className="mt-1 text-xs opacity-70">{t.depositHint}</p>
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
            <p className="font-black">{t.withdraw}</p>
            <p className="mt-1 text-xs opacity-70">{t.withdrawHint}</p>
          </button>
        </div>
      </div>

      {walletAction && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-bold text-white/60">{t.asset}</p>
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
          <p className="mb-2 text-xs font-bold text-white/60">{t.network}</p>
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
  ? t.depositInformation
  : t.withdrawalRequest}
            </p>

            {walletAction === "deposit" && depositAddress && (
              <button
                type="button"
                onClick={onCopyAddress}
                className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-bold text-white/70"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? t.copied : t.copyAddress}
              </button>
            )}
          </div>

          {addressLoading ? (
            <p className="text-sm text-white/50">{t.loadingGuide}</p>
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
                <p className="text-xs text-white/45">{t.assetNetwork}</p>
                <p className="mt-1 text-sm font-black text-white">
                  {walletAsset} • {walletNetwork}
                </p>

                <p className="mt-3 text-xs text-white/45">{t.depositAddress}</p>
                {depositAddress ? (
                  <p className="mt-1 break-all text-sm leading-6 text-yellow-100">
                    {depositAddress}
                  </p>
                ) : (
                  <p className="mt-1 text-sm leading-6 text-red-200">
                    {t.addressUnavailable}
                  </p>
                )}

                <p className="mt-3 text-xs text-white/45">{t.instruction}</p>
                <p className="mt-1 text-sm leading-6 text-white/70">
                  {selectedWalletAddress?.memo || t.defaultInstruction}
                </p>

                <div className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-3">
                  <p className="text-xs font-bold text-yellow-100/80">
                    {t.afterPayment}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-white/70">
                    {t.afterPaymentNote}
                  </p>

                  <Link
                    href={`/deposit?asset=${walletAsset}&network=${walletNetwork}`}
                    className="mt-3 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-4 py-3 text-sm font-black text-black"
                  >
                    {t.openDepositReview}
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-black/30 p-3">
              <p className="text-xs text-white/45">{t.withdrawalNetwork}</p>
              <p className="mt-1 text-sm font-black text-white">
                {walletAsset} • {walletNetwork}
              </p>

              <p className="mt-3 text-sm leading-6 text-white/70">
  {t.withdrawNote
    .replace("{asset}", walletAsset)
    .replace("{network}", walletNetwork)}
</p>

              <Link
                href={`/withdraw?asset=${walletAsset}&network=${walletNetwork}`}
                className="mt-4 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-4 py-3 text-sm font-black text-black"
              >
                {t.openWithdrawRequest}
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

function StatusBadge({
  status,
  labels,
}: {
  status: SupportStatus;
  labels: Record<SupportStatus, string>;
}) {
  const styles =
    status === "closed"
      ? "bg-emerald-400/10 text-emerald-300"
      : status === "reviewing"
      ? "bg-yellow-400/10 text-yellow-300"
      : "bg-blue-400/10 text-blue-300";

  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${styles}`}>
      {labels[status]}
    </span>
  );
}