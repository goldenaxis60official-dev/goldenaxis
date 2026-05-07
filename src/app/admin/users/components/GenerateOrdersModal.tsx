//src>app>users>components>GenerateOrdersModal.tsx

import { PackagePlus, X } from "lucide-react";

type ModalUser = {
  display_name: string | null;
  email: string | null;
  balance: number;
  current_step: number;
};

type GenerateOrdersModalProps = {
  user: ModalUser;
  fallbackName: string;
  taskCount: number;
  capitalAmount: number;
  profitRate: number;
  resetExisting: boolean;
  actionLoading: boolean;
  onTaskCountChange: (value: number) => void;
  onCapitalAmountChange: (value: number) => void;
  onProfitRateChange: (value: number) => void;
  onResetExistingChange: (value: boolean) => void;
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

export default function GenerateOrdersModal({
  user,
  fallbackName,
  taskCount,
  capitalAmount,
  profitRate,
  resetExisting,
  actionLoading,
  onTaskCountChange,
  onCapitalAmountChange,
  onProfitRateChange,
  onResetExistingChange,
  onClose,
  onSubmit,
}: GenerateOrdersModalProps) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[2rem] border border-yellow-400/25 bg-[#090909] p-6 shadow-[0_0_60px_rgba(212,175,55,0.18)]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">Auto Order Engine</p>
            <h2 className="text-2xl font-black">Generate Orders</h2>
            <p className="mt-1 text-sm text-white/45">
              Create generated promotion orders for this user.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl bg-white/10 p-3 text-white/70"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3">
          <MiniBox label="User" value={user.display_name || fallbackName} />

          <MiniBox
            label="Balance"
            value={`$${Number(user.balance || 0).toFixed(2)}`}
            color="gold"
          />

          <MiniBox label="Step" value={String(user.current_step)} />
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-bold text-white/80">Task Count</p>
            <input
              value={taskCount}
              onChange={(event) => onTaskCountChange(Number(event.target.value))}
              type="number"
              min={1}
              max={80}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-400/50"
            />
            <p className="mt-2 text-xs text-white/45">
              Minimum 1, maximum 80.
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-white/80">
              Capital / Order Amount
            </p>
            <input
              value={capitalAmount}
              onChange={(event) =>
                onCapitalAmountChange(Number(event.target.value))
              }
              type="number"
              min={1}
              step="0.01"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-400/50"
            />
            <p className="mt-2 text-xs text-white/45">
              Example: 500, 3000, 8000, 20000. System will pick closest product
              tier.
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-white/80">
              Profit Rate %
            </p>
            <input
              value={profitRate}
              onChange={(event) =>
                onProfitRateChange(Number(event.target.value))
              }
              type="number"
              min={0}
              step="0.01"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-400/50"
            />
            <p className="mt-2 text-xs text-white/45">
              Example: 0.08 means 0.08% per normal order.
            </p>
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <div>
              <p className="text-sm font-black text-white">
                Reset existing generated orders
              </p>
              <p className="mt-1 text-xs text-white/45">
                Turn on when creating a fresh campaign for this user.
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
            disabled={actionLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PackagePlus className="h-5 w-5" />
            {actionLoading ? "Generating..." : "Generate Auto Orders"}
          </button>
        </div>
      </div>
    </div>
  );
}