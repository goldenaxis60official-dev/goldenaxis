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
  CheckCircle,
  Clock,
  Copy,
  Gem,
  Headphones,
  MessageCircle,
  Send,
  ShieldCheck,
  Wallet,
  Image as ImageIcon,
  X,
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
  image_url?: string | null;
  created_at: string;
};

type SupportTopic = "missionHelp" | "walletHelp" | "accountSecurity";

type WalletAsset = "USDT" | "USDC" | "BTC";
type WalletNetwork = "TRC20" | "ERC20" | "BTC";
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

const assets: WalletAsset[] = ["USDT", "USDC", "BTC"];

const networkOptionsByAsset: Record<WalletAsset, WalletNetwork[]> = {
  USDT: ["TRC20", "ERC20"],
  USDC: ["TRC20", "ERC20"],
  BTC: ["BTC"],
};

function getDefaultNetworkForAsset(asset: WalletAsset): WalletNetwork {
  return asset === "BTC" ? "BTC" : "TRC20";
}

function getWalletLabel(asset: WalletAsset, network: WalletNetwork) {
  if (asset === "BTC" && network === "BTC") {
    return "BTC Bitcoin";
  }

  return `${asset} ${network}`;
}

function getNetworkLabel(asset: WalletAsset, network: WalletNetwork) {
  if (asset === "BTC" && network === "BTC") {
    return "Bitcoin";
  }

  return network;
}

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
  const [attachment, setAttachment] = useState<File | null>(null);
  const [replyTicketId, setReplyTicketId] = useState<string | null>(null);

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
    ? `Wallet Help - ${walletAction.toUpperCase()} ${getWalletLabel(walletAsset, walletNetwork)}`
    : topicSubjectMap[activeTopic];

const finalSubjectLabel =
  activeTopic === "walletHelp" && walletAction && walletAsset && walletNetwork
    ? `${t.support.topics.walletHelp.title} - ${t.support.walletActions[walletAction]} ${getWalletLabel(walletAsset, walletNetwork)}`
    : t.support.topics[activeTopic].title;

const activeTopicData = helpTopics.find((item) => item.key === activeTopic);
const ActiveTopicIcon = activeTopicData?.icon || Headphones;

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

  const replyTargetTicket = useMemo(() => {
  return tickets.find((ticket) => ticket.id === replyTicketId) || null;
}, [tickets, replyTicketId]);

const formSubjectLabel = replyTargetTicket
  ? replyTargetTicket.subject
  : finalSubjectLabel;

async function loadTicketsAndChat(showLoader = true) {
  if (showLoader) {
    setLoading(true);
  }

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
    const channel = supabase.channel(`user-support-realtime-${profile.id}`);

    // 1. Listen to the user's main tickets
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "support_messages",
        filter: `user_id=eq.${profile.id}`,
      },
      () => loadTicketsAndChat(false)
    );

    // 2. Only listen to chat messages for THEIR specific tickets
    tickets.forEach((ticket) => {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_chat_messages",
          filter: `ticket_id=eq.${ticket.id}`,
        },
        () => loadTicketsAndChat(false)
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile.id, tickets.length]);

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

if (asset === "USDT" || asset === "USDC" || asset === "BTC") {
  setWalletAsset(asset);

  const allowedNetworks = networkOptionsByAsset[asset];
  const defaultNetwork = getDefaultNetworkForAsset(asset);

  if (
    (network === "TRC20" || network === "ERC20" || network === "BTC") &&
    allowedNetworks.includes(network)
  ) {
    setWalletNetwork(network);
  } else {
    setWalletNetwork(defaultNetwork);
  }
}
    }
  }, []);

function handleTopicSelect(topic: SupportTopic) {
  setActiveTopic(topic);
  setSuccessText("");
  setErrorText("");
  setReplyTicketId(null);

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
    setReplyTicketId(null);
  }

function handleWalletAsset(asset: WalletAsset) {
  setWalletAsset(asset);
  setWalletNetwork(getDefaultNetworkForAsset(asset));
  setCopied(false);
  setMessage("");
  setReplyTicketId(null);
}

  async function handleCopyAddress() {
    if (!depositAddress) return;

    await navigator.clipboard.writeText(depositAddress);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1600);
  }

  function handleReplyToTicket(ticketId: string) {
  const ticket = tickets.find((item) => item.id === ticketId);

  if (!ticket || ticket.status === "closed") return;

  setReplyTicketId(ticketId);
  setMessage("");
  setSuccessText("");
  setErrorText("");
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

let targetTicket = replyTargetTicket;

if (targetTicket?.status === "closed") {
  setErrorText("This conversation is closed.");
  setSubmitting(false);
  return;
}

if (!targetTicket) {
  targetTicket =
    tickets.find(
      (ticket) =>
        ticket.subject === finalSubject &&
        ticket.status !== "closed"
    ) || null;
}

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

    let imageUrl = null;
    if (attachment) {
      const fileExt = attachment.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('support-attachments')
        .upload(`chat/${fileName}`, attachment);

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from('support-attachments')
          .getPublicUrl(`chat/${fileName}`);
        imageUrl = publicUrlData.publicUrl;
      }
    }

    const { error: chatError } = await supabase
      .from("support_chat_messages")
      .insert({
        ticket_id: targetTicket.id,
        sender_id: profile.id,
        sender_role: "user",
        message: finalMessage || (imageUrl ? "Attached an image" : ""),
        image_url: imageUrl,
      });

    if (chatError) {
      setErrorText(chatError.message);
      setSubmitting(false);
      return;
    }

    setSuccessText(t.support.messageSent);
    setMessage("");
    setAttachment(null);
setCopied(false);
setReplyTicketId(null);
setSubmitting(false);

    await loadTicketsAndChat();
  }

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

                <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {helpTopics.map((item) => {
            const Icon = item.icon;
            const active = activeTopic === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleTopicSelect(item.key)}
                className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-3 transition active:scale-[0.98] ${
                  active
                    ? "border-yellow-400 bg-yellow-400 text-black shadow-[0_12px_28px_rgba(234,179,8,0.22)]"
                    : "border-white/10 bg-white/[0.05] text-white/60"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    active ? "text-black" : "text-yellow-300"
                  }`}
                />
                <span className="text-xs font-black">
                  {t.support.topics[item.key].short}
                </span>
              </button>
            );
          })}
        </div>

                <LuxuryCard className="mb-4 p-4">
          <div className="mb-4 flex items-center justify-between gap-3 rounded-[1.4rem] border border-yellow-400/20 bg-yellow-400/10 p-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-yellow-300 text-black shadow-[0_0_22px_rgba(234,179,8,0.28)]">
                <ActiveTopicIcon className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-black text-yellow-100">
                  {finalSubjectLabel}
                </p>
                <p className="mt-0.5 line-clamp-1 text-xs text-white/50">
                  {activeTopicData
                    ? t.support.topics[activeTopicData.key].text
                    : t.support.subtitle}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-black text-emerald-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
              Online
            </div>
          </div>

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

          <div className="space-y-4">
            {loading && (
              <div className="rounded-2xl bg-black/25 p-4 text-center text-sm text-white/50">
                {t.support.loadingConversation}
              </div>
            )}

            {!loading && groupedMessages.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-center">
                <MessageCircle className="mx-auto mb-2 h-6 w-6 text-yellow-300" />
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
                        <StatusBadge
                          status={ticket.status}
                          labels={t.support.statuses}
                        />
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
                        image_url={chat.image_url}
                        time={chat.created_at}
                        youLabel={t.support.you}
                        supportReplyLabel={t.support.supportReply}
                      />
                      ))}

{ticket.status !== "closed" &&
  !messages.some(
    (chat) => chat.sender_role === "admin"
  ) && <WaitingBubble label={t.support.waitingReview} />}
</>
)}

{ticket.status !== "closed" && (
  <div className="flex justify-center">
    <button
      type="button"
      onClick={() => handleReplyToTicket(ticket.id)}
      className={`rounded-full border px-4 py-2 text-xs font-black transition active:scale-[0.98] ${
        replyTicketId === ticket.id
          ? "border-yellow-400 bg-yellow-400 text-black"
          : "border-yellow-400/25 bg-yellow-400/10 text-yellow-200"
      }`}
    >
      {replyTicketId === ticket.id
        ? "Reply target selected"
        : "Reply to this notice"}
    </button>
  </div>
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
  {formSubjectLabel}
</p>

{replyTargetTicket && (
  <button
    type="button"
    onClick={() => setReplyTicketId(null)}
    className="mt-1 text-xs font-bold text-white/45 underline decoration-white/20"
  >
    Cancel reply target
  </button>
)}
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

          <div className="mb-3 overflow-hidden rounded-2xl border border-white/10 bg-black/45 focus-within:border-yellow-400/50">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={
                replyTargetTicket
                  ? "Reply to this official notice..."
                  : activeTopic === "walletHelp"
                    ? t.support.walletPlaceholder
                    : t.support.defaultPlaceholder
              }
              className="min-h-20 w-full bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
            />
            
            {attachment && (
              <div className="mx-4 mb-2 flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs text-yellow-300">
                <span className="truncate">{attachment.name}</span>
                <button type="button" onClick={() => setAttachment(null)} className="ml-2 rounded-full p-1 hover:bg-white/10 text-white">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 bg-black/20 px-3 py-2">
              <input
                type="file"
                id="chat-attachment"
                accept="image/*"
                className="hidden"
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
              />
              <label
                htmlFor="chat-attachment"
                className="flex cursor-pointer items-center justify-center rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                <ImageIcon className="h-5 w-5" />
              </label>
            </div>
          </div>

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
  image_url,
  time,
  youLabel,
  supportReplyLabel,
}: {
  role: "user" | "admin";
  message: string;
  image_url?: string | null;
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

        {message && message !== "Attached an image" && (
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-white/80">
            {message}
          </p>
        )}

        {image_url && (
          <img 
            src={image_url} 
            alt="Attachment" 
            className="mt-3 max-w-full rounded-xl object-contain" 
          />
        )}

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
<div
  className={`grid gap-3 ${
    networkOptionsByAsset[walletAsset].length === 1
      ? "grid-cols-1"
      : "grid-cols-2"
  }`}
>
  {networkOptionsByAsset[walletAsset].map((network) => (
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
      {getNetworkLabel(walletAsset, network)}
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
                      alt={`${getWalletLabel(walletAsset, walletNetwork)} deposit QR`}
                      className="h-44 w-44 rounded-2xl object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-black/30 p-3">
                <p className="text-xs text-white/45">{t.assetNetwork}</p>
                <p className="mt-1 text-sm font-black text-white">
                  {getWalletLabel(walletAsset, walletNetwork)}
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
                {getWalletLabel(walletAsset, walletNetwork)}
              </p>

              <p className="mt-3 text-sm leading-6 text-white/70">
  {t.withdrawNote
    .replace("{asset}", walletAsset)
    .replace("{network}", getNetworkLabel(walletAsset, walletNetwork))}
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