import { RotateCcw, X } from "lucide-react";

type ModalUser = {
  display_name: string | null;
  email: string | null;
  balance: number;
  current_step: number;
};

type ResetOrdersModalProps = {
  user: ModalUser;
  fallbackName: string;
  confirmText: string;
  resetStep: boolean;
  actionLoading: boolean;
  onConfirmTextChange: (value: string) => void;
  onResetStepChange: (value: boolean) => void;
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

export default function ResetOrdersModal({
  user,
  fallbackName,
  confirmText,
  resetStep,
  actionLoading,
  onConfirmTextChange,
  onResetStepChange,
  onClose,
  onSubmit,
}: ResetOrdersModalProps) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-orange-400/25 bg-[#090909] p-6 shadow-[0_0_60px_rgba(249,115,22,0.18)]">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-orange-200/80">
              Generated Order Reset
            </p>
            <h2 className="text-2xl font-black">Reset Orders</h2>
            <p className="mt-1 text-sm text-white/45">
              Clear this user&apos;s generated campaign orders.
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

        <div className="rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4 text-sm leading-6 text-orange-100/75">
          This will delete generated orders for this user only. Product pool,
          balance, earnings, wallet records, and account data will not be
          deleted.
        </div>

        <label className="mt-5 flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <div>
            <p className="text-sm font-black text-white">
              Reset user step to 1
            </p>
            <p className="mt-1 text-xs text-white/45">
              Recommended when clearing a generated campaign.
            </p>
          </div>

          <input
            type="checkbox"
            checked={resetStep}
            onChange={(event) => onResetStepChange(event.target.checked)}
            className="h-5 w-5 accent-orange-400"
          />
        </label>

        <div className="mt-5">
          <p className="mb-2 text-sm font-bold text-white/80">
            Type RESET to confirm
          </p>

          <input
            value={confirmText}
            onChange={(event) =>
              onConfirmTextChange(event.target.value.toUpperCase())
            }
            placeholder="RESET"
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-orange-400/50"
          />
        </div>

        <button
          onClick={onSubmit}
          disabled={actionLoading || confirmText !== "RESET"}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-orange-400/30 bg-orange-500/20 px-5 py-4 font-black text-orange-100 hover:bg-orange-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw className="h-5 w-5" />
          {actionLoading ? "Resetting..." : "Reset Generated Orders"}
        </button>
      </div>
    </div>
  );
}