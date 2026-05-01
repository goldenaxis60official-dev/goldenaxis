"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import {
  Headphones,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  MessageCircle,
  Save,
} from "lucide-react";

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
  const [filter, setFilter] = useState<"open" | "reviewing" | "closed" | "all">(
    "open"
  );

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
      <AppShell>
        <section className="px-5 pt-8">
          <div className="rounded-[2rem] border border-red-400/30 bg-red-500/10 p-6 text-center">
            <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-red-300" />
            <h1 className="text-2xl font-black">Admin Access Required</h1>
            <p className="mt-2 text-sm text-white/55">
              This page is only available for admin accounts.
            </p>
          </div>
        </section>
      </AppShell>
    );
  }

  const openCount = messages.filter((item) => item.status === "open").length;
  const reviewingCount = messages.filter(
    (item) => item.status === "reviewing"
  ).length;

  return (
    <AppShell>
      <section className="px-5 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">Admin Control</p>
            <h1 className="text-2xl font-black">Support Messages</h1>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <Headphones className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3">
          <StatBox label="Showing" value={String(messages.length)} />
          <StatBox label="Open" value={String(openCount)} />
          <StatBox label="Review" value={String(reviewingCount)} />
        </div>

        <div className="mb-5 grid grid-cols-4 gap-2">
          {["open", "reviewing", "closed", "all"].map((item) => (
            <button
              key={item}
              onClick={() =>
                setFilter(item as "open" | "reviewing" | "closed" | "all")
              }
              className={`rounded-2xl border px-2 py-3 text-xs font-bold capitalize ${
                filter === item
                  ? "border-yellow-400 bg-yellow-400 text-black"
                  : "border-white/10 bg-white/[0.06] text-white/60"
              }`}
            >
              {item}
            </button>
          ))}
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

        {loading && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 text-center text-white/60">
            Loading support messages...
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center">
            <MessageCircle className="mx-auto mb-3 h-9 w-9 text-yellow-300" />
            <p className="font-bold">No support messages found</p>
            <p className="mt-2 text-sm text-white/50">
              User support requests will appear here.
            </p>
          </div>
        )}

        <div className="space-y-4 pb-6">
          {messages.map((item) => (
            <div
              key={item.id}
              className="rounded-[1.7rem] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black">{item.subject}</h3>
                  <p className="mt-1 text-xs text-white/45">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                  <p className="mt-2 text-sm text-white/60">
                    {item.profiles?.display_name || "Unknown User"} •{" "}
                    {item.profiles?.email || "No email"}
                  </p>
                </div>

                <StatusBadge status={item.status} />
              </div>

              <div className="rounded-2xl bg-black/30 p-3">
                <p className="text-xs text-white/45">User Message</p>
                <p className="mt-1 text-sm leading-6 text-white/75">
                  {item.message}
                </p>
              </div>

              <div className="mt-3">
                <p className="mb-2 text-sm font-bold text-white/80">
                  Admin Reply
                </p>

                <textarea
                  value={replyText[item.id] || ""}
                  onChange={(e) =>
                    setReplyText({
                      ...replyText,
                      [item.id]: e.target.value,
                    })
                  }
                  placeholder="Write admin reply..."
                  className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
                />
              </div>

              <div className="mt-3">
                <p className="mb-2 text-sm font-bold text-white/80">Status</p>

                <select
                  value={statusText[item.id] || item.status}
                  onChange={(e) =>
                    setStatusText({
                      ...statusText,
                      [item.id]: e.target.value as
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
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:opacity-60"
              >
                <Save className="h-5 w-5" />
                {actionId === item.id ? "Saving..." : "Save Reply"}
              </button>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-1 truncate font-bold text-yellow-300">{value}</p>
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