//src>app>admin>users>components>SecurityResetModal.tsx

import { ShieldCheck, X } from "lucide-react";

type ModalUser = {
  display_name: string | null;
  email: string | null;
};

type SecurityResetModalText = {
  tag: string;
  title: string;
  user: string;
  email: string;
  warning: string;
  newLoginPassword: string;
  temporaryPassword: string;
  generate: string;
  resetting: string;
  resetLoginPassword: string;
  newWithdrawPasscode: string;
  sixDigitCode: string;
  resetWithdrawPasscode: string;
};

type SecurityResetModalProps = {
  user: ModalUser;
  fallbackName: string;
  noEmailText: string;
  resetPassword: string;
  resetPasscode: string;
  resetResult: string;
  actionLoading: boolean;
  t: SecurityResetModalText;
  onPasswordChange: (value: string) => void;
  onPasscodeChange: (value: string) => void;
  onGeneratePassword: () => void;
  onGeneratePasscode: () => void;
  onResetLoginPassword: () => void;
  onResetWithdrawPasscode: () => void;
  onClose: () => void;
};

function MiniBox({
  label,
  value,
  color = "white",
}: {
  label: string;
  value: string;
  color?: "white" | "gold";
}) {
  return (
    <div className="rounded-2xl bg-black/30 p-3">
      <p className="text-xs text-white/45">{label}</p>
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

export default function SecurityResetModal({
  user,
  fallbackName,
  noEmailText,
  resetPassword,
  resetPasscode,
  resetResult,
  actionLoading,
  t,
  onPasswordChange,
  onPasscodeChange,
  onGeneratePassword,
  onGeneratePasscode,
  onResetLoginPassword,
  onResetWithdrawPasscode,
  onClose,
}: SecurityResetModalProps) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-emerald-400/25 bg-[#090909] p-6 shadow-[0_0_60px_rgba(16,185,129,0.16)]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-emerald-300/80">{t.tag}</p>
            <h2 className="text-2xl font-black">{t.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl bg-white/10 p-3 text-white/70"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <MiniBox label={t.user} value={user.display_name || fallbackName} />

          <MiniBox
            label={t.email}
            value={user.email || noEmailText}
            color="gold"
          />
        </div>

        <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm leading-6 text-yellow-100/75">
          {t.warning}
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-bold text-white/80">
            {t.newLoginPassword}
          </p>

          <div className="flex gap-3">
            <input
              value={resetPassword}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder={t.temporaryPassword}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-emerald-400/50"
            />

            <button
              type="button"
              onClick={onGeneratePassword}
              className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white/75 hover:bg-white/[0.1]"
            >
              {t.generate}
            </button>
          </div>

          <button
            onClick={onResetLoginPassword}
            disabled={actionLoading || resetPassword.length < 6}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ShieldCheck className="h-5 w-5" />
            {actionLoading ? t.resetting : t.resetLoginPassword}
          </button>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-bold text-white/80">
            {t.newWithdrawPasscode}
          </p>

          <div className="flex gap-3">
            <input
              value={resetPasscode}
              onChange={(event) =>
                onPasscodeChange(
                  event.target.value.replace(/\D/g, "").slice(0, 6)
                )
              }
              inputMode="numeric"
              maxLength={6}
              placeholder={t.sixDigitCode}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-emerald-400/50"
            />

            <button
              type="button"
              onClick={onGeneratePasscode}
              className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white/75 hover:bg-white/[0.1]"
            >
              {t.generate}
            </button>
          </div>
        </div>

        {resetResult && (
          <div className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-200">
            {resetResult}
          </div>
        )}

        <button
          onClick={onResetWithdrawPasscode}
          disabled={actionLoading || resetPasscode.length !== 6}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-300 to-emerald-600 px-5 py-4 font-black text-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ShieldCheck className="h-5 w-5" />
          {actionLoading ? t.resetting : t.resetWithdrawPasscode}
        </button>
      </div>
    </div>
  );
}