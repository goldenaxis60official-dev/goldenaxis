//src>app>admin>users>components>ReferralCodeModal.tsx

"use client";

import { useState } from "react";
import { Check, Copy, Save, X } from "lucide-react";

type ModalUser = {
  display_name: string | null;
  email: string | null;
  referral_code: string;
};

type ReferralCodeModalText = {
  tag: string;
  title: string;
  user: string;
  currentCode: string;
  referralCode: string;
  placeholder: string;
  note: string;
  saving: string;
  saveReferralCode: string;
};

type ReferralCodeModalProps = {
  user: ModalUser;
  fallbackName: string;
  referralValue: string;
  actionLoading: boolean;
  t: ReferralCodeModalText;
  onReferralChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

function MiniBox({
  label,
  value,
  color = "white",
  onCopy,
  copied = false,
}: {
  label: string;
  value: string;
  color?: "white" | "gold";
  onCopy?: () => void;
  copied?: boolean;
}) {
  const canCopy = Boolean(onCopy && value && value !== "-");

  return (
    <div className="rounded-2xl bg-black/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-white/45">{label}</p>

        {canCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-1 rounded-lg border border-yellow-400/20 bg-yellow-400/10 px-2 py-1 text-[10px] font-black text-yellow-200 transition hover:bg-yellow-400/20"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>

      <p
        className={`mt-1 truncate font-bold ${
          color === "gold" ? "text-yellow-300" : "text-white/75"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function ReferralCodeModal({
  user,
  fallbackName,
  referralValue,
  actionLoading,
  t,
  onReferralChange,
  onClose,
  onSubmit,
}: ReferralCodeModalProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopyCurrentCode() {
    const code = user.referral_code || "";

    if (!code) return;

    await navigator.clipboard.writeText(code);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-yellow-400/20 bg-[#090909] p-6 shadow-[0_0_60px_rgba(212,175,55,0.16)]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">{t.tag}</p>
            <h2 className="text-2xl font-black">{t.title}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white/10 p-3 text-white/70 transition hover:bg-white/15"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <MiniBox label={t.user} value={user.display_name || fallbackName} />

          <MiniBox
            label={t.currentCode}
            value={user.referral_code || "-"}
            color="gold"
            onCopy={handleCopyCurrentCode}
            copied={copied}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-bold text-white/80">
            {t.referralCode}
          </p>

          <input
            value={referralValue}
            onChange={(event) =>
              onReferralChange(
                event.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9_-]/g, "")
                  .slice(0, 20)
              )
            }
            placeholder={t.placeholder}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
          />

          <p className="mt-2 text-xs text-white/45">{t.note}</p>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={actionLoading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:opacity-60"
        >
          <Save className="h-5 w-5" />
          {actionLoading ? t.saving : t.saveReferralCode}
        </button>
      </div>
    </div>
  );
}