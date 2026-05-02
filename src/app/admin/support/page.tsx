"use client";

import { useEffect, useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import AdminNav from "../AdminNav";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import {
  AlertCircle,
  CheckCircle,
  Headphones,
  MessageCircle,
  Save,
  ShieldCheck,
} from "lucide-react";

type SupportFilter = "open" | "reviewing" | "closed" | "all";

type AdminSupportMessage = {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: "open" | "reviewing" | "closed";
  admin_reply: string | null;
  created_at: string;
  replied_at: string | null;
  profiles: {
    display_name: string | null;
    email: string | null;
  } | null;
};

export default function AdminSupportPage() {
  return (
    <RequireAuth>
      {(profile) => <AdminSupportContent profile={profile} />}
    </RequireAuth>
  );
}

function AdminSupportContent({ profile }: { profile: Profile }) {
  const [messages, setMessages] = useState<AdminSupportMessage[]>([]);
  const [filter, setFilter] = useState<SupportFilter>("open");

  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [statusText, setStatusText] = useState<
    Record<string, "open" | "reviewing" | "closed">
  >({});

  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");

  const isAdmin = profile.role === "admin";

  async function loadMessages() {
    setLoading(true);
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
      setLoading(false);
      return;
    }

    const rows = (data || []) as AdminSupportMessage[];
    setMessages(rows);

    const nextReplies: Record<string, string> = {};
    const nextStatuses: Record<string, "open" | "reviewing" | "closed"> = {};

    rows.forEach((item) => {
      nextReplies[item.id] = item.admin_reply || "";
      nextStatuses[item.id] = item.status;
    });

    setReplyText(nextReplies);
    setStatusText(nextStatuses);
    setLoading(false);
  }

  useEffect(() => {
    if (isAdmin) {
      loadMessages();
    } else {
      setLoading(false);
    }
  }, [isAdmin, filter]);

  async function handleSaveReply(messageId: string) {
    setActionId(messageId);
    setSuccessText("");
    setErrorText("");

    const newReply = replyText[messageId] || "";
    const newStatus = statusText[messageId] || "reviewing";

    const { error } = await supabase
      .from("support_messages")
      .update({
        admin_reply: newReply || null,
        status: newStatus,
        replied_at: newReply ? new Date().toISOString() : null,
      })
      .eq("id", messageId);

    if (error) {
      setErrorText(error.message);
      setActionId(null);
      return;
    }

    setSuccessText("Support message updated successfully.");
    setActionId(null);
    loadMessages();
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

  const openCount = messages.filter((item) => item.status === "open").length;
  const reviewingCount = messages.filter(
    (item) => item.status === "reviewing"
  ).length;
  const closedCount = messages.filter((item) => item.status === "closed").length;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <AdminNav />

        <div className="mb-8 flex items-center justify-between gap-5">
          <div>
            <p className="text-sm font-bold text-yellow-200/80">
              Admin Control
            </p>
            <h1 className="mt-1 text-3xl font-black">Support Messages</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Review user support messages, update ticket status, and send admin
              replies.
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4">
            <Headphones className="h-7 w-7 text-yellow-300" />
          </div>
        </div>

        <div className="mb-6 grid grid-cols-4 gap-4">
          <StatCard label="Showing" value={String(messages.length)} />
          <StatCard label="Open" value={String(openCount)} />
          <StatCard label="Reviewing" value={String(reviewingCount)} />
          <StatCard label="Closed" value={String(closedCount)} />
        </div>

        <div className="mb-6 flex items-center justify-between gap-4 rounded-[2rem] border border-white/10 bg-white/[0.035] p-4">
          <div>
            <p className="text-sm text-yellow-200/80">Filter Tickets</p>
            <h2 className="text-xl font-black capitalize">{filter}</h2>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {(["open", "reviewing", "closed", "all"] as SupportFilter[]).map(
              (item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`rounded-2xl border px-5 py-3 text-sm font-black capitalize ${
                    filter === item
                      ? "border-yellow-400 bg-yellow-400 text-black"
                      : "border-white/10 bg-black/35 text-white/60 hover:bg-white/[0.08]"
                  }`}
                >
                  {item}
                </button>
              )
            )}
          </div>
        </div>

        {successText && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle className="h-4 w-4" />
            {successText}
          </div>
        )}

        {errorText && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="h-4 w-4" />
            {errorText}
          </div>
        )}

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-200/80">Support Queue</p>
              <h2 className="text-2xl font-black">User Tickets</h2>
            </div>
          </div>

          {loading && (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center text-white/60">
              Loading support messages...
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center">
              <MessageCircle className="mx-auto mb-4 h-12 w-12 text-yellow-300" />
              <p className="font-black">No support messages found</p>
              <p className="mt-2 text-sm text-white/50">
                User support requests will appear here.
              </p>
            </div>
          )}

          {!loading && messages.length > 0 && (
            <div className="space-y-4">
              {messages.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[1.7rem] border border-white/10 bg-black/25 p-5"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 flex items-center gap-3">
                        <h3 className="text-lg font-black">{item.subject}</h3>
                        <StatusBadge status={item.status} />
                      </div>

                      <p className="text-xs text-white/45">
                        {new Date(item.created_at).toLocaleString()}
                      </p>

                      <p className="mt-2 text-sm text-white/60">
                        {item.profiles?.display_name || "Unknown User"} •{" "}
                        {item.profiles?.email || "No email"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_420px] gap-5">
                    <div className="space-y-4">
                      <div className="rounded-2xl bg-black/40 p-4">
                        <p className="text-xs text-white/45">User Message</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/75">
                          {item.message}
                        </p>
                      </div>

                      {item.admin_reply && (
                        <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
                          <p className="text-xs text-yellow-100/60">
                            Current Admin Reply
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-yellow-50/80">
                            {item.admin_reply}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="mb-2 text-sm font-bold text-white/80">
                          Admin Reply
                        </p>

                        <textarea
                          value={replyText[item.id] || ""}
                          onChange={(event) =>
                            setReplyText({
                              ...replyText,
                              [item.id]: event.target.value,
                            })
                          }
                          placeholder="Write admin reply..."
                          className="min-h-36 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
                        />
                      </div>

                      <div>
                        <p className="mb-2 text-sm font-bold text-white/80">
                          Status
                        </p>

                        <select
                          value={statusText[item.id] || item.status}
                          onChange={(event) =>
                            setStatusText({
                              ...statusText,
                              [item.id]: event.target.value as
                                | "open"
                                | "reviewing"
                                | "closed",
                            })
                          }
                          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-400/50"
                        >
                          <option value="open">open</option>
                          <option value="reviewing">reviewing</option>
                          <option value="closed">closed</option>
                        </select>
                      </div>

                      <button
                        onClick={() => handleSaveReply(item.id)}
                        disabled={actionId === item.id}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:opacity-60"
                      >
                        <Save className="h-5 w-5" />
                        {actionId === item.id ? "Saving..." : "Save Reply"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
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

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "closed"
      ? "bg-emerald-400/10 text-emerald-300"
      : status === "reviewing"
      ? "bg-yellow-400/10 text-yellow-300"
      : "bg-blue-400/10 text-blue-300";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles}`}>
      {status}
    </span>
  );
}