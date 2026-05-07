//src>app>admin>users>components>ReferralBonusModal.tsx

import { Save, X } from "lucide-react";

type ModalUser = {
  display_name: string | null;
  email: string | null;
  balance: number;
  deposited_balance: number;
  referral_bonus_balance: number;
  task_profit_balance: number;
};

type ReferralBonusModalText = {
  tag: string;
  title: string;
  description: string;
  user: string;
  currentReferral: string;
  depositedBalance: string;
  taskProfit: string;
  newReferralBonus: string;
  newTotalPreview: string;
  saving: string;
  saveReferralBonus: string;
};

type ReferralBonusModalProps = {
  user: ModalUser;
  fallbackName: string;
  amount: number;
  actionLoading: boolean;
  t: ReferralBonusModalText;
  onAmountChange: (value: number) => void;
  onClose: () => void;
  onSubmit: () => void;
};

function money(value: number | null | undefined) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function MiniBox({
  label,
  value,
  color = "white",
}: {
  label: string;
  value: string;
  color?: "white" | "gold" | "green";
}) {
  return (
    <div className="rounded-2xl bg-black/30 p-3">
      <p className="text-xs text-white/45">{label}</p>
      <p
        className={`mt-1 truncate font-bold ${
          color === "gold"
            ? "text-yellow-300"
            : color === "green"
              ? "text-emerald-300"
              : "text-white/75"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function ReferralBonusModal({
  user,
  fallbackName,
  amount,
  actionLoading,
  t,
  onAmountChange,
  onClose,
  onSubmit,
}: ReferralBonusModalProps) {
  const newTotal =
    Number(user.deposited_balance || 0) +
    Number(amount || 0) +
    Number(user.task_profit_balance || 0);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-yellow-400/20 bg-[#090909] p-6 shadow-[0_0_60px_rgba(212,175,55,0.16)]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">{t.tag}</p>
            <h2 className="text-2xl font-black">{t.title}</h2>
            <p className="mt-1 text-xs text-white/45">{t.description}</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl bg-white/10 p-3 text-white/70"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <MiniBox
            label={t.user}
            value={user.display_name || user.email || fallbackName}
          />

          <MiniBox
            label={t.currentReferral}
            value={money(user.referral_bonus_balance)}
            color="gold"
          />

          <MiniBox
            label={t.depositedBalance}
            value={money(user.deposited_balance)}
          />

          <MiniBox
            label={t.taskProfit}
            value={money(user.task_profit_balance)}
            color="green"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-bold text-white/80">
            {t.newReferralBonus}
          </p>

          <input
            value={amount}
            type="number"
            min={0}
            step="0.01"
            onChange={(event) =>
              onAmountChange(Math.max(0, Number(event.target.value || 0)))
            }
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
          />

          <div className="mt-3 rounded-2xl border border-yellow-400/15 bg-yellow-400/10 p-3">
            <p className="text-xs text-white/45">{t.newTotalPreview}</p>
            <p className="mt-1 text-xl font-black text-yellow-300">
              {money(newTotal)}
            </p>
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={actionLoading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:opacity-60"
        >
          <Save className="h-5 w-5" />
          {actionLoading ? t.saving : t.saveReferralBonus}
        </button>
      </div>
    </div>
  );
}