//app>admin>users>components>UserMessageModal.tsx

"use client";

import { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

type ModalUser = {
  display_name: string | null;
  phone: string | null;
  email: string | null;
  member_id?: string | null;
};

const noticeTypes = [
  "Account Notice",
  "Campaign Notice",
  "Wallet Notice",
  "Event Notice",
  "Security Notice",
  "Custom Notice",
] as const;

type NoticeType = (typeof noticeTypes)[number];

export default function UserMessageModal({
  user,
  fallbackName,
  actionLoading,
  onClose,
  onSubmit,
}: {
  user: ModalUser;
  fallbackName: string;
  actionLoading: boolean;
  onClose: () => void;
  onSubmit: (subject: string, message: string) => void;
}) {
  const [noticeType, setNoticeType] = useState<NoticeType>("Account Notice");
  const [customSubject, setCustomSubject] = useState("");
  const [message, setMessage] = useState("");

  const finalSubject =
    noticeType === "Custom Notice" ? customSubject.trim() : noticeType;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xl">
      <div className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-yellow-400/25 bg-[#090909] text-white shadow-[0_28px_90px_rgba(0,0,0,0.65)]">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-yellow-400/15 via-white/[0.04] to-black px-5 py-5">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-yellow-400/25 bg-yellow-400/10 px-3 py-1 text-xs font-black text-yellow-200">
              <MessageCircle className="h-4 w-4" />
              Direct User Notice
            </div>

            <h2 className="text-2xl font-black">Send Notice</h2>

            <p className="mt-1 text-sm text-white/50">
              To{" "}
              <span className="font-black text-yellow-200">
                {user.display_name || user.phone || user.email || fallbackName}
              </span>
              {user.member_id ? ` · ${user.member_id}` : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/[0.06] p-2 text-white/60 hover:bg-white/[0.1]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/40">
              Notice Type
            </label>

            <select
              value={noticeType}
              onChange={(event) =>
                setNoticeType(event.target.value as NoticeType)
              }
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/45 px-4 text-sm font-black text-white outline-none focus:border-yellow-400/50"
            >
              {noticeTypes.map((type) => (
                <option key={type} className="bg-black" value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {noticeType === "Custom Notice" && (
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/40">
                Custom Subject
              </label>

              <input
                value={customSubject}
                onChange={(event) => setCustomSubject(event.target.value)}
                placeholder="Example: Holiday campaign update"
                className="h-12 w-full rounded-2xl border border-white/10 bg-black/45 px-4 text-sm font-bold text-white outline-none placeholder:text-white/30 focus:border-yellow-400/50"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/40">
              Message
            </label>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write the official notice for this user..."
              className="min-h-36 w-full resize-none rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/30 focus:border-yellow-400/50"
            />
          </div>

          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-xs leading-5 text-yellow-100/75">
            This will appear inside the user&apos;s Support page as an official
            support message. The conversation can continue from Admin Support.
          </div>

          <button
            type="button"
            disabled={actionLoading || !finalSubject || !message.trim()}
            onClick={() => onSubmit(finalSubject, message.trim())}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black shadow-[0_12px_32px_rgba(234,179,8,0.28)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
            {actionLoading ? "Sending..." : "Send Notice"}
          </button>
        </div>
      </div>
    </div>
  );
}