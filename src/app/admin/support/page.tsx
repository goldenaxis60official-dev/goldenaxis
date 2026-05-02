//admin>support>page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import AdminNav from "../AdminNav";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import {
  AlertCircle,
  CheckCircle,
  Headphones,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";

type SupportFilter = "open" | "reviewing" | "closed" | "all";
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
    display_name: string | null;
    email: string | null;
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

export default function AdminSupportPage() {
  return (
    <RequireAuth>
      {(profile) => <AdminSupportContent profile={profile} />}
    </RequireAuth>
  );
}

function AdminSupportContent({ profile }: { profile: Profile }) {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const [filter, setFilter] = useState<SupportFilter>("open");
  const [searchText, setSearchText] = useState("");
  const [replyText, setReplyText] = useState("");

  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);

  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");

  const isAdmin = profile.role === "admin";

  const selectedTicket = useMemo(() => {
    return tickets.find((ticket) => ticket.id === selectedTicketId) || null;
  }, [tickets, selectedTicketId]);

  const filteredTickets = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) return tickets;

    return tickets.filter((ticket) => {
      const name = ticket.profiles?.display_name || "";
      const email = ticket.profiles?.email || "";

      return (
        ticket.subject.toLowerCase().includes(keyword) ||
        ticket.message.toLowerCase().includes(keyword) ||
        name.toLowerCase().includes(keyword) ||
        email.toLowerCase().includes(keyword)
      );
    });
  }, [tickets, searchText]);

  async function loadTickets() {
    setLoadingTickets(true);
    setErrorText("");

    let query = supabase
      .from("support_messages")
      .select(
        `
        *,
        profiles (
          display_name,
          email
        )
      `
      )
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;

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
    } else if (!selectedTicketId || !rows.some((item) => item.id === selectedTicketId)) {
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
    if (isAdmin) {
      loadTickets();
    } else {
      setLoadingTickets(false);
    }
  }, [isAdmin, filter]);

  useEffect(() => {
    if (selectedTicketId) {
      loadChat(selectedTicketId);
      setReplyText("");
    }
  }, [selectedTicketId]);

  async function handleSendReply() {
    if (!selectedTicket) return;

    const finalReply = replyText.trim();

    if (!finalReply) {
      setErrorText("Please write a reply first.");
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
    setSuccessText("Reply sent.");
    setSending(false);

    await loadChat(selectedTicket.id);
    await loadTickets();
  }

  async function handleStatusChange(nextStatus: SupportStatus) {
    if (!selectedTicket) return;

    setErrorText("");
    setSuccessText("");

    const { error } = await supabase
      .from("support_messages")
      .update({ status: nextStatus })
      .eq("id", selectedTicket.id);

    if (error) {
      setErrorText(error.message);
      return;
    }

    setSuccessText("Ticket status updated.");
    await loadTickets();
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#050505] p-6 text-white">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-red-400/30 bg-red-500/10 p-8 text-center">
          <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-red-300" />
          <h1 className="text-2xl font-black">Admin Access Required</h1>
          <p className="mt-2 text-sm text-white/55">
            This page is only available for admin accounts.
          </p>
        </div>
      </main>
    );
  }

  const openCount = tickets.filter((item) => item.status === "open").length;
  const reviewingCount = tickets.filter((item) => item.status === "reviewing").length;
  const closedCount = tickets.filter((item) => item.status === "closed").length;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <AdminNav />

        <div className="mb-6 flex items-center justify-between gap-5">
          <div>
            <p className="text-sm font-bold text-yellow-200/80">
              Admin Control
            </p>
            <h1 className="mt-1 text-3xl font-black">Support Chat Center</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Chat with each user directly and manage ticket status.
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4">
            <Headphones className="h-7 w-7 text-yellow-300" />
          </div>
        </div>

        <div className="mb-5 grid grid-cols-4 gap-4">
          <StatCard label="Showing" value={String(filteredTickets.length)} />
          <StatCard label="Open" value={String(openCount)} />
          <StatCard label="Reviewing" value={String(reviewingCount)} />
          <StatCard label="Closed" value={String(closedCount)} />
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

        <section className="grid h-[calc(100vh-280px)] min-h-[650px] grid-cols-[360px_1fr] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035]">
          <aside className="flex min-h-0 flex-col border-r border-white/10 bg-black/25">
            <div className="border-b border-white/10 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-yellow-200/80">Support Queue</p>
                  <h2 className="text-xl font-black">User Chats</h2>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-4 gap-2">
                {(["open", "reviewing", "closed", "all"] as SupportFilter[]).map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => setFilter(item)}
                      className={`rounded-xl border px-3 py-2 text-xs font-black capitalize ${
                        filter === item
                          ? "border-yellow-400 bg-yellow-400 text-black"
                          : "border-white/10 bg-black/35 text-white/55 hover:bg-white/[0.08]"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-3 py-2">
                <Search className="h-4 w-4 text-white/35" />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search user or ticket..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              {loadingTickets && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center text-sm text-white/50">
                  Loading chats...
                </div>
              )}

              {!loadingTickets && filteredTickets.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.04] p-6 text-center">
                  <MessageCircle className="mx-auto mb-3 h-9 w-9 text-yellow-300" />
                  <p className="text-sm font-black">No chats found</p>
                  <p className="mt-1 text-xs text-white/45">
                    User support chats will appear here.
                  </p>
                </div>
              )}

              {!loadingTickets &&
                filteredTickets.map((ticket) => {
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
                          {ticket.profiles?.display_name || "Unknown User"}
                        </p>
                        <StatusBadge status={ticket.status} />
                      </div>

                      <p className="truncate text-xs font-bold text-yellow-100/75">
                        {ticket.subject}
                      </p>

                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/45">
                        {ticket.message}
                      </p>

                      <p className="mt-3 text-[11px] text-white/30">
                        {new Date(ticket.created_at).toLocaleString()}
                      </p>
                    </button>
                  );
                })}
            </div>
          </aside>

          <div className="flex min-h-0 flex-col">
            {!selectedTicket ? (
              <div className="flex flex-1 items-center justify-center p-8 text-center">
                <div>
                  <MessageCircle className="mx-auto mb-4 h-14 w-14 text-yellow-300" />
                  <p className="text-xl font-black">Select a user chat</p>
                  <p className="mt-2 text-sm text-white/45">
                    Choose a ticket from the left side to start replying.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-black/25 px-5 py-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-black">
                        {selectedTicket.profiles?.display_name || "Unknown User"}
                      </h2>
                      <StatusBadge status={selectedTicket.status} />
                    </div>

                    <p className="mt-1 text-sm text-white/45">
                      {selectedTicket.profiles?.email || "No email"} •{" "}
                      {selectedTicket.subject}
                    </p>
                  </div>

                  <select
                    value={selectedTicket.status}
                    onChange={(event) =>
                      handleStatusChange(event.target.value as SupportStatus)
                    }
                    className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400/50"
                  >
                    <option value="open">Open</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(234,179,8,0.08),transparent_35%),#070707] p-5">
                  {loadingChat && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center text-sm text-white/50">
                      Loading conversation...
                    </div>
                  )}

                  {!loadingChat && chatMessages.length === 0 && (
                    <div className="space-y-4">
                      <ChatBubble
                        role="user"
                        message={selectedTicket.message}
                        time={selectedTicket.created_at}
                      />

                      <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-100/70">
                        Old ticket message shown as fallback. New replies will
                        be saved as real chat messages.
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
                      />
                    ))}
                </div>

                <div className="border-t border-white/10 bg-[#11100b]/95 p-4">
                  <div className="flex gap-3">
                    <textarea
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                      placeholder="Type admin reply..."
                      className="min-h-20 flex-1 resize-none rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
                    />

                    <button
                      onClick={handleSendReply}
                      disabled={sending}
                      className="flex min-w-36 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black shadow-[0_12px_32px_rgba(234,179,8,0.24)] disabled:opacity-60"
                    >
                      <Send className="h-5 w-5" />
                      {sending ? "Sending..." : "Send"}
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
}: {
  role: "user" | "admin";
  message: string;
  time: string;
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
          {isAdmin ? "Admin Support" : "User"}
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-1 truncate text-xl font-black text-yellow-300">
        {value}
      </p>
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
    <span className={`rounded-full px-3 py-1 text-xs font-black ${styles}`}>
      {status}
    </span>
  );
}