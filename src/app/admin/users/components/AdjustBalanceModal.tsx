//src>app>admin>components>AdjustBalanceModal.tsx

import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";

type ModalUser = {
  display_name: string | null;
  email: string | null;
  balance: number;
  current_step: number;
};

type AdjustBalanceModalText = {
  tag: string;
  title: string;
  user: string;
  balance: string;
  step: string;
  amount: string;
  amountHelp: string;
  note: string;
  notePlaceholder: string;
  saving: string;
  saveAdjustment: string;
};

type AdjustBalanceModalProps = {
  user: ModalUser;
  fallbackName: string;
  amount: number;
  note: string;
  actionLoading: boolean;
  t: AdjustBalanceModalText;
  onAmountChange: (value: number) => void;
  onNoteChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
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

export default function AdjustBalanceModal({
  user,
  fallbackName,
  amount,
  note,
  actionLoading,
  t,
  onAmountChange,
  onNoteChange,
  onClose,
  onSubmit,
}: AdjustBalanceModalProps) {
  const [amountText, setAmountText] = useState(String(amount || ""));

  useEffect(() => {
    setAmountText(String(amount || ""));
  }, [amount]);

  function handleAmountInput(value: string) {
    setAmountText(value);

    if (value === "" || value === "-" || value === "." || value === "-.") {
      return;
    }

    const parsedAmount = Number(value);

    if (Number.isFinite(parsedAmount)) {
      onAmountChange(parsedAmount);
    }
  }

  function handleAmountBlur() {
    const parsedAmount = Number(amountText);

    if (!Number.isFinite(parsedAmount)) {
      setAmountText(String(amount || ""));
      return;
    }

    setAmountText(String(parsedAmount));
    onAmountChange(parsedAmount);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[2rem] border border-yellow-400/20 bg-[#090909] p-6 shadow-[0_0_60px_rgba(212,175,55,0.16)]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">{t.tag}</p>
            <h2 className="text-2xl font-black">{t.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl bg-white/10 p-3 text-white/70"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3">
          <MiniBox label={t.user} value={user.display_name || fallbackName} />

          <MiniBox
            label={t.balance}
            value={`$${Number(user.balance).toFixed(2)}`}
            color="gold"
          />

          <MiniBox label={t.step} value={String(user.current_step)} />
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-bold text-white/80">{t.amount}</p>

            <input
  value={amountText}
  onChange={(event) => handleAmountInput(event.target.value)}
  onBlur={handleAmountBlur}
  type="text"
  inputMode="decimal"
  placeholder="Example: 100 or -100"
  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-yellow-400/50"
/>

<div className="mt-3 grid grid-cols-2 gap-3">
  <button
    type="button"
    onClick={() => {
      const positiveAmount = Math.abs(Number(amountText || amount || 0));
      setAmountText(String(positiveAmount));
      onAmountChange(positiveAmount);
    }}
    className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-200 active:scale-[0.98]"
  >
    Add +
  </button>

  <button
    type="button"
    onClick={() => {
      const negativeAmount = -Math.abs(Number(amountText || amount || 0));
      setAmountText(String(negativeAmount));
      onAmountChange(negativeAmount);
    }}
    className="rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-2 text-sm font-black text-red-200 active:scale-[0.98]"
  >
    Deduct -
  </button>
</div>

            <p className="mt-2 text-xs text-white/45">{t.amountHelp}</p>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-white/80">{t.note}</p>

            <textarea
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder={t.notePlaceholder}
              className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
            />
          </div>

          <button
            onClick={onSubmit}
            disabled={actionLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:opacity-60"
          >
            <Save className="h-5 w-5" />
            {actionLoading ? t.saving : t.saveAdjustment}
          </button>
        </div>
      </div>
    </div>
  );
}