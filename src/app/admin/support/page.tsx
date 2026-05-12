//admin>support>page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { en } from "@/i18n/en";
import { zh } from "@/i18n/zh";
import RequireAuth from "@/components/auth/RequireAuth";
import AdminNav from "../AdminNav";
import { supabase } from "@/lib/supabaseClient";
import { canAccessAdminPath } from "@/lib/adminPermissions";
import type { Profile } from "@/types/profile";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Headphones,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";

type SupportStatus = "open" | "reviewing" | "closed";

type AdminTicket = {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: SupportStatus;
  admin_reply: string | null;
  created_at: string;
  replied_at: string | null;
  profiles: {
  member_id: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
} | null;
};

type ChatMessage = {
  id: string;
  ticket_id: string;
  sender_id: string | null;
  sender_role: "user" | "admin";
  message: string;
  created_at: string;
};

type AdminSupportText = typeof en.adminSupport;

export default function AdminSupportPage() {
  return (
    <RequireAuth>
      {(profile) => <AdminSupportContent profile={profile} />}
    </RequireAuth>
  );
}

function AdminSupportContent({ profile }: { profile: Profile }) {
  const currentLanguage = profile.language === "zh" ? "zh" : "en";

  const t: AdminSupportText =
    currentLanguage === "zh"
      ? (zh.adminSupport as unknown as AdminSupportText)
      : en.adminSupport;

  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

const [searchText, setSearchText] = useState("");
const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(8);
const [replyText, setReplyText] = useState("");

  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);

  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");

  const hasPageAccess = canAccessAdminPath(profile.role, "/admin/support");

function getSupportStatusLabel(value: SupportStatus) {
  return t.status[value];
}

useEffect(() => {
  if (!hasPageAccess) {
    setLoadingTickets(false);
    return;
  }

  loadTickets();
}, [hasPageAccess]);

  const selectedTicket = useMemo(() => {
    return tickets.find((ticket) => ticket.id === selectedTicketId) || null;
  }, [tickets, selectedTicketId]);

  const filteredTickets = useMemo(() => {
  const keyword = searchText.trim().toLowerCase();

  const result = tickets.filter((ticket) => {
const name = ticket.profiles?.display_name || "";
const email = ticket.profiles?.email || "";
const phone = ticket.profiles?.phone || "";
const memberId = ticket.profiles?.member_id || "";
const userId = ticket.user_id || "";

    const matchesSearch =
      !keyword ||
      ticket.subject.toLowerCase().includes(keyword) ||
      ticket.message.toLowerCase().includes(keyword) ||
      name.toLowerCase().includes(keyword) ||
email.toLowerCase().includes(keyword) ||
phone.toLowerCase().includes(keyword) ||
memberId.toLowerCase().includes(keyword) ||
userId.toLowerCase().includes(keyword) ||
ticket.id.toLowerCase().includes(keyword);

    return matchesSearch;
  });

  return [...result].sort((a, b) => {
    if (sortBy === "oldest") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}, [tickets, searchText, sortBy]);

const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));

const paginatedTickets = useMemo(() => {
  const start = (currentPage - 1) * pageSize;
  return filteredTickets.slice(start, start + pageSize);
}, [filteredTickets, currentPage, pageSize]);

const firstResult =
  filteredTickets.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;

const lastResult = Math.min(currentPage * pageSize, filteredTickets.length);

useEffect(() => {
  setCurrentPage(1);
}, [searchText, sortBy, pageSize]);

useEffect(() => {
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }
}, [currentPage, totalPages]);

useEffect(() => {
  if (loadingTickets) return;

  if (filteredTickets.length === 0) {
    setSelectedTicketId(null);
    setChatMessages([]);
    return;
  }

  if (
    !selectedTicketId ||
    !filteredTickets.some((ticket) => ticket.id === selectedTicketId)
  ) {
    setSelectedTicketId(filteredTickets[0].id);
  }
}, [filteredTickets, selectedTicketId, loadingTickets]);

async function loadTickets() {
  setLoadingTickets(true);
  setErrorText("");

  const { data: visibleProfiles, error: visibleProfilesError } =
    await supabase.rpc("get_staff_visible_profiles");

  if (visibleProfilesError) {
    setErrorText(visibleProfilesError.message);
    setLoadingTickets(false);
    return;
  }

  const visibleUserIds = ((visibleProfiles || []) as Profile[])
    .filter((user) => user.status !== "deleted")
    .map((user) => user.id);

  if (visibleUserIds.length === 0) {
    setTickets([]);
    setSelectedTicketId(null);
    setChatMessages([]);
    setLoadingTickets(false);
    return;
  }

  const { data, error } = await supabase
    .from("support_messages")
    .select(
      `
      *,
      profiles (
        member_id,
        display_name,
        email,
        phone
      )
    `
    )
    .in("user_id", visibleUserIds)
    .order("created_at", { ascending: false });

  if (error) {
    setErrorText(error.message);
    setLoadingTickets(false);
    return;
  }

  const rows = (data || []) as AdminTicket[];
  setTickets(rows);

  if (rows.length === 0) {
    setSelectedTicketId(null);
    setChatMessages([]);
  } else if (
    !selectedTicketId ||
    !rows.some((item) => item.id === selectedTicketId)
  ) {
    setSelectedTicketId(rows[0].id);
  }

  setLoadingTickets(false);
}

  async function loadChat(ticketId: string) {
    setLoadingChat(true);
    setErrorText("");

    const { data, error } = await supabase
      .from("support_chat_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) {
      setErrorText(error.message);
      setLoadingChat(false);
      return;
    }

    setChatMessages((data || []) as ChatMessage[]);
    setLoadingChat(false);
  }

  useEffect(() => {
  if (selectedTicketId) {
    loadChat(selectedTicketId);
    setReplyText("");
  } else {
    setChatMessages([]);
  }
}, [selectedTicketId]);

  useEffect(() => {
  if (!hasPageAccess) return;

  const channel = supabase
    .channel("admin-support-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "support_messages",
      },
      () => {
        loadTickets();
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "support_chat_messages",
      },
      (payload) => {
        const newMessage = payload.new as ChatMessage;

        loadTickets();

        if (newMessage.ticket_id === selectedTicketId) {
          loadChat(selectedTicketId);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [hasPageAccess, selectedTicketId]);

  async function handleSendReply() {
    if (!selectedTicket) return;

    const finalReply = replyText.trim();

    if (!finalReply) {
      setErrorText(t.messages.writeReplyFirst);
      return;
    }

    const { data: canAccess, error: accessError } = await supabase.rpc(
  "staff_can_access_user",
  {
    p_target_user_id: selectedTicket.user_id,
  }
);

if (accessError || !canAccess) {
  setErrorText("You cannot reply to this user's support ticket.");
  return;
}

    setSending(true);
    setSuccessText("");
    setErrorText("");

    const { error: chatError } = await supabase
      .from("support_chat_messages")
      .insert({
        ticket_id: selectedTicket.id,
        sender_id: profile.id,
        sender_role: "admin",
        message: finalReply,
      });

    if (chatError) {
      setErrorText(chatError.message);
      setSending(false);
      return;
    }

    const { error: ticketError } = await supabase
      .from("support_messages")
      .update({
        status: selectedTicket.status === "closed" ? "closed" : "reviewing",
        admin_reply: finalReply,
        replied_at: new Date().toISOString(),
      })
      .eq("id", selectedTicket.id);

    if (ticketError) {
      setErrorText(ticketError.message);
      setSending(false);
      return;
    }

    setReplyText("");
    setSuccessText(t.messages.replySent);
    setSending(false);

    await loadChat(selectedTicket.id);
    await loadTickets();
  }

async function handleStatusChange(nextStatus: SupportStatus) {
  if (!selectedTicket) return;

  setErrorText("");
  setSuccessText("");

  const { data: canAccess, error: accessError } = await supabase.rpc(
    "staff_can_access_user",
    {
      p_target_user_id: selectedTicket.user_id,
    }
  );

  if (accessError || !canAccess) {
    setErrorText("You cannot update this user's support ticket.");
    return;
  }

    const { error } = await supabase
      .from("support_messages")
      .update({ status: nextStatus })
      .eq("id", selectedTicket.id);

    if (error) {
      setErrorText(error.message);
      return;
    }

    setSuccessText(t.messages.statusUpdated);
    await loadTickets();
  }

  if (!hasPageAccess) {
    return (
      <main className="min-h-screen bg-[#050505] p-6 text-white">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-red-400/30 bg-red-500/10 p-8 text-center">
          <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-red-300" />
          <h1 className="text-2xl font-black">{t.accessRequiredTitle}</h1>
<p className="mt-2 text-sm text-white/55">
  {t.accessRequiredDescription}
</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <AdminNav language={currentLanguage} profile={profile} />

        <div className="mb-6 flex items-center justify-between gap-5">
          <div>
            <p className="text-sm font-bold text-yellow-200/80">
  {t.pageTag}
</p>
<h1 className="mt-1 text-3xl font-black">{t.title}</h1>
<p className="mt-2 max-w-2xl text-sm text-white/50">
  {t.description}
</p>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4">
            <Headphones className="h-7 w-7 text-yellow-300" />
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

        <section className="grid min-h-[760px] overflow-hidden rounded-[2rem] border border-yellow-400/10 bg-white/[0.035] shadow-[0_24px_90px_rgba(0,0,0,0.34)] xl:h-[calc(100vh-220px)] xl:grid-cols-[420px_1fr]">
          <aside className="flex min-h-0 flex-col border-r border-white/10 bg-[#0b0b0b]/95">
            <div className="border-b border-white/10 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-yellow-200/80">{t.filters.supportQueue}</p>
<h2 className="text-xl font-black">{t.filters.userChats}</h2>
                </div>
              </div>

<div className="space-y-3">
  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-3 py-2">
    <Search className="h-4 w-4 text-white/35" />
    <input
      value={searchText}
      onChange={(event) => setSearchText(event.target.value)}
      placeholder={t.filters.searchPlaceholder}
      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
    />
  </div>

  <div className="grid grid-cols-2 gap-2">
    <select
      value={sortBy}
      onChange={(event) => setSortBy(event.target.value as "newest" | "oldest")}
      className="rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-bold text-white outline-none focus:border-yellow-400/50"
    >
      <option className="bg-black" value="newest">{t.filters.newest}</option>
<option className="bg-black" value="oldest">{t.filters.oldest}</option>
    </select>

    <select
      value={pageSize}
      onChange={(event) => setPageSize(Number(event.target.value))}
      className="rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-bold text-white outline-none focus:border-yellow-400/50"
    >
      <option className="bg-black" value={8}>
  {t.filters.pageSize.replace("{count}", "8")}
</option>
<option className="bg-black" value={15}>
  {t.filters.pageSize.replace("{count}", "15")}
</option>
<option className="bg-black" value={30}>
  {t.filters.pageSize.replace("{count}", "30")}
</option>
    </select>
  </div>
</div>

            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              {loadingTickets && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center text-sm text-white/50">
                  {t.list.loadingChats}
                </div>
              )}

              {!loadingTickets && filteredTickets.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.04] p-6 text-center">
                  <MessageCircle className="mx-auto mb-3 h-9 w-9 text-yellow-300" />
                  <p className="text-sm font-black">{t.list.noChatsFound}</p>
<p className="mt-1 text-xs text-white/45">
  {t.list.noChatsFoundDescription}
</p>
                </div>
              )}

              {!loadingTickets &&
  paginatedTickets.map((ticket) => {
                  const active = selectedTicketId === ticket.id;

                  return (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-yellow-400/60 bg-yellow-400/15 shadow-[0_0_28px_rgba(234,179,8,0.12)]"
                          : "border-white/10 bg-black/30 hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-black text-white">
                          {ticket.profiles?.display_name || t.list.unknownUser}
                        </p>
                        <StatusBadge
  status={ticket.status}
  label={getSupportStatusLabel(ticket.status)}
/>
                      </div>

                      <div className="mt-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-2">
  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-yellow-200/65">
    Request Reason
  </p>
  <p className="mt-1 truncate text-sm font-black text-yellow-100">
    {ticket.subject}
  </p>
</div>

<p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/30">
  Latest Message
</p>
<p className="mt-1 line-clamp-2 text-xs leading-5 text-white/55">
  {ticket.message}
</p>

                      <div className="mt-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/30">
    ID
  </p>
  <p className="mt-1 text-xs font-black text-yellow-300">
    {ticket.profiles?.member_id || ticket.user_id.slice(0, 8)}
  </p>
</div>

<p className="mt-3 text-[11px] text-white/30">
  {new Date(ticket.created_at).toLocaleString()}
</p>
                    </button>
                  );
                })}
                        </div>

            {!loadingTickets && filteredTickets.length > 0 && (
              <div className="border-t border-white/10 bg-black/30 p-3">
                <p className="mb-3 text-center text-xs text-white/45">
                  {t.list.showing}{" "}
<span className="font-black text-white">{firstResult}</span>
{" - "}
<span className="font-black text-white">{lastResult}</span>
{" "}
{t.list.of}{" "}
<span className="font-black text-yellow-300">
  {filteredTickets.length}
</span>{" "}
{t.list.chats}
                </p>

                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white/70 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black text-yellow-300">
                    {currentPage} / {totalPages}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(totalPages, page + 1)
                      )
                    }
                    className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white/70 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </aside>

          <div className="flex min-h-0 flex-col">
            {!selectedTicket ? (
              <div className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.08),transparent_38%),#070707] p-8 text-center">
                <div>
                  <MessageCircle className="mx-auto mb-4 h-14 w-14 text-yellow-300" />
                  <p className="text-xl font-black">{t.list.selectUserChat}</p>
<p className="mt-2 text-sm text-white/45">
  {t.list.selectUserChatDescription}
</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-black/25 px-5 py-4">
  <div className="min-w-0">
    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-400/25 bg-yellow-400/10 px-4 py-2">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-yellow-200/65">
        Request Reason
      </span>
      <span className="text-sm font-black text-yellow-100">
        {selectedTicket.subject}
      </span>
    </div>

    <div className="flex items-center gap-3">
      <h2 className="truncate text-xl font-black">
        {selectedTicket.profiles?.display_name || t.list.unknownUser}
      </h2>
      <StatusBadge
        status={selectedTicket.status}
        label={getSupportStatusLabel(selectedTicket.status)}
      />
    </div>

<div className="mt-2 flex flex-wrap items-center gap-2">
  <p className="text-sm text-white/45">
    Phone:{" "}
    <span className="font-bold text-white/65">
      {selectedTicket.profiles?.phone || "-"}
    </span>
  </p>

  <span className="rounded-full border border-yellow-400/25 bg-yellow-400/10 px-3 py-1 text-xs font-black text-yellow-300">
    ID: {selectedTicket.profiles?.member_id || selectedTicket.user_id.slice(0, 8)}
  </span>
</div>
  </div>

  <select
    value={selectedTicket.status}
    onChange={(event) =>
      handleStatusChange(event.target.value as SupportStatus)
    }
    className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400/50"
  >
    <option value="open">{t.status.open}</option>
    <option value="reviewing">{t.status.reviewing}</option>
    <option value="closed">{t.status.closed}</option>
  </select>
</div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(234,179,8,0.08),transparent_35%),#070707] p-5">
                  {loadingChat && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center text-sm text-white/50">
                      {t.chat.loadingConversation}
                    </div>
                  )}

                  {!loadingChat && chatMessages.length === 0 && (
                    <div className="space-y-4">
                      <ChatBubble
  role="user"
  message={selectedTicket.message}
  time={selectedTicket.created_at}
  adminLabel={t.chat.adminSupport}
  userLabel={t.chat.user}
/>

                      <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-100/70">
                        {t.chat.fallbackNotice}
                      </div>
                    </div>
                  )}

                  {!loadingChat &&
                    chatMessages.map((chat) => (
                      <ChatBubble
  key={chat.id}
  role={chat.sender_role}
  message={chat.message}
  time={chat.created_at}
  adminLabel={t.chat.adminSupport}
  userLabel={t.chat.user}
/>
                    ))}
                </div>

                <div className="border-t border-white/10 bg-[#11100b]/95 p-4">
                  <div className="flex gap-3">
                    <textarea
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                      placeholder={t.chat.replyPlaceholder}
                      className="min-h-20 flex-1 resize-none rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
                    />

                    <button
                      onClick={handleSendReply}
                      disabled={sending}
                      className="flex min-w-36 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black shadow-[0_12px_32px_rgba(234,179,8,0.24)] disabled:opacity-60"
                    >
                      <Send className="h-5 w-5" />
                      {sending ? t.chat.sending : t.chat.send}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function ChatBubble({
  role,
  message,
  time,
  adminLabel,
  userLabel,
}: {
  role: "user" | "admin";
  message: string;
  time: string;
  adminLabel: string;
  userLabel: string;
}) {
  const isAdmin = role === "admin";

  return (
    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[72%] rounded-3xl p-4 ${
          isAdmin
            ? "rounded-tr-sm border border-yellow-400/25 bg-yellow-400/15"
            : "rounded-tl-sm border border-white/10 bg-black/45"
        }`}
      >
        <p
          className={`mb-2 text-xs font-black ${
            isAdmin ? "text-yellow-100" : "text-white/65"
          }`}
        >
          {isAdmin ? adminLabel : userLabel}
        </p>

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

function StatusBadge({
  status,
  label,
}: {
  status: SupportStatus;
  label: string;
}) {
  const styles =
    status === "closed"
      ? "bg-emerald-400/10 text-emerald-300"
      : status === "reviewing"
      ? "bg-yellow-400/10 text-yellow-300"
      : "bg-blue-400/10 text-blue-300";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${styles}`}>
      {label}
    </span>
  );
}