"use client";

import { useEffect, useState } from "react";
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

const helpTopics = [
  {
    title: "Mission Help",
    text: "Questions about campaign task progress, locked missions, or Lucky Bonus tasks.",
    icon: Gem,
  },
  {
    title: "Wallet Help",
    text: "Questions about deposit-credit requests, withdrawal requests, or wallet records.",
    icon: Wallet,
  },
  {
    title: "Account Security",
    text: "Questions about login, profile access, and account safety.",
    icon: ShieldCheck,
  },
];

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

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");

  async function loadMessages() {
    setLoading(true);
    setErrorText("");

    const { data, error } = await supabase
      .from("support_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorText(error.message);
      setLoading(false);
      return;
    }

    setMessages((data || []) as SupportMessage[]);
    setLoading(false);
  }

  useEffect(() => {
    loadMessages();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSubmitting(true);
    setSuccessText("");
    setErrorText("");

    if (!message.trim()) {
      setErrorText("Please write your message.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("support_messages").insert({
      user_id: profile.id,
      subject,
      message,
      status: "open",
    });

    if (error) {
      setErrorText(error.message);
      setSubmitting(false);
      return;
    }

    setSuccessText("Support message submitted successfully.");
    setMessage("");
    setSubmitting(false);
    loadMessages();
  }

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
            Send a support request about missions, wallet records, account
            access, or campaign-credit questions. Admin replies will appear in
            your support history.
          </p>
        </div>

        <div className="mb-5 grid gap-3">
          {helpTopics.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.title}
                onClick={() => setSubject(item.title)}
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
                    <p className="mt-1 text-sm text-white/50">{item.text}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl"
        >
          <div className="mb-5">
            <p className="mb-2 text-sm font-bold text-white/80">Subject</p>

            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-400/50"
            >
              <option>Mission Help</option>
              <option>Wallet Help</option>
              <option>Account Security</option>
              <option>Referral Help</option>
              <option>Other Question</option>
            </select>
          </div>

          <div className="mb-5">
            <p className="mb-2 text-sm font-bold text-white/80">Message</p>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your support message..."
              className="min-h-32 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
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
                <p className="mt-1 text-sm leading-6 text-white/70">
                  {item.message}
                </p>
              </div>

              {item.admin_reply ? (
                <div className="mt-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-3">
                  <p className="text-xs text-yellow-200/70">Admin Reply</p>
                  <p className="mt-1 text-sm leading-6 text-yellow-100">
                    {item.admin_reply}
                  </p>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2 rounded-2xl bg-black/30 p-3 text-sm text-white/50">
                  <Clock className="h-4 w-4 text-yellow-300" />
                  Waiting for admin reply
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}