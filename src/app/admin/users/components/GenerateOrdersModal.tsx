//src>app>admin>users>components>GenerateOrdersModal.tsx

import { PackagePlus, X } from "lucide-react";

type ModalUser = {
  display_name: string | null;
  email: string | null;
  balance: number;
  deposited_balance?: number | null;
  referral_bonus_balance?: number | null;
  task_profit_balance?: number | null;
  current_step: number;
};

type GenerateOrdersModalText = {
  tag: string;
  title: string;
  description: string;
  user: string;
  balance: string;
  step: string;
  taskCount: string;
  taskCountHelp: string;
  profitRate: string;
  profitRateHelp: string;
  resetExisting: string;
  resetExistingHelp: string;
  generating: string;
  generateAutoOrders: string;
};

type GenerateOrdersModalProps = {
  user: ModalUser;
  fallbackName: string;
  taskCount: number;
  profitRate: number;
  resetExisting: boolean;
  actionLoading: boolean;
  t: GenerateOrdersModalText;
  onTaskCountChange: (value: number) => void;
  onProfitRateChange: (value: number) => void;
  onResetExistingChange: (value: boolean) => void;
  onClose: () => void;
  onSubmit: () => void;
};

function getAvailableBalance(user: ModalUser) {
  const mainBalance = Number(user.balance || 0);
  const depositBalance = Number(user.deposited_balance || 0);
  const referralBalance = Number(user.referral_bonus_balance || 0);
  const profitBalance = Number(user.task_profit_balance || 0);

  // Use main balance if backend already synced it.
  // Otherwise fallback to separated wallet balances.
  const separatedTotal = depositBalance + referralBalance + profitBalance;

  return mainBalance > 0 ? mainBalance : separatedTotal;
}

function getAutoOrderAmount(user: ModalUser) {
  const availableBalance = getAvailableBalance(user);

  if (availableBalance <= 0) return 0;

  return Number(Math.min(availableBalance, 10000).toFixed(2));
}

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

export default function GenerateOrdersModal({
  user,
  fallbackName,
  taskCount,
  profitRate,
  resetExisting,
  actionLoading,
  t,
  onTaskCountChange,
  onProfitRateChange,
  onResetExistingChange,
  onClose,
  onSubmit,
}: GenerateOrdersModalProps) {
  const availableBalance = getAvailableBalance(user);
  const autoOrderAmount = getAutoOrderAmount(user);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[2rem] border border-yellow-400/25 bg-[#090909] p-6 shadow-[0_0_60px_rgba(212,175,55,0.18)]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">{t.tag}</p>
            <h2 className="text-2xl font-black">{t.title}</h2>
            <p className="mt-1 text-sm text-white/45">{t.description}</p>
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
            value={`$${availableBalance.toFixed(2)}`}
            color="gold"
          />

          <MiniBox label={t.step} value={String(user.current_step)} />
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-bold text-white/80">
              {t.taskCount}
            </p>
            <input
  value={taskCount}
  onChange={(event) => onTaskCountChange(Number(event.target.value))}
  type="number"
  min={1}
  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-400/50"
/>
            <p className="mt-2 text-xs text-white/45">{t.taskCountHelp}</p>
          </div>

          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3">
            <p className="text-sm font-black text-yellow-200">
              Auto Order Amount
            </p>

            <p className="mt-1 text-2xl font-black text-yellow-300">
              ${autoOrderAmount.toFixed(2)}
            </p>

            <p className="mt-2 text-xs text-white/45">
              The system calculates this from the user&apos;s available balance
              and automatically selects the closest affordable product tier.
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-white/80">
              {t.profitRate}
            </p>
<input
  value={profitRate}
  onChange={(event) =>
    onProfitRateChange(Number(event.target.value))
  }
  type="number"
  min={0}
  step="0.001"
  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-400/50"
/>
            <p className="mt-2 text-xs text-white/45">{t.profitRateHelp}</p>
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <div>
              <p className="text-sm font-black text-white">
                {t.resetExisting}
              </p>
              <p className="mt-1 text-xs text-white/45">
                {t.resetExistingHelp}
              </p>
            </div>

            <input
              type="checkbox"
              checked={resetExisting}
              onChange={(event) => onResetExistingChange(event.target.checked)}
              className="h-5 w-5 accent-yellow-400"
            />
          </label>

          <button
            onClick={onSubmit}
            disabled={actionLoading || autoOrderAmount <= 0}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PackagePlus className="h-5 w-5" />
            {actionLoading ? t.generating : t.generateAutoOrders}
          </button>
        </div>
      </div>
    </div>
  );
}