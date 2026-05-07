//src>app>admin>users>components>LuckyOrderModal.tsx

import { Sparkles, X } from "lucide-react";

type ModalUser = {
  display_name: string | null;
  email: string | null;
  balance: number;
  current_step: number;
};

type LuckyProductOption = {
  id: string;
  name: string;
  price: number;
  category: string;
  main_image: string | null;
};

type LuckyOrderModalProps = {
  user: ModalUser;
  fallbackName: string;
  luckyProducts: LuckyProductOption[];
  stepNumber: number;
  productId: string;
  luckyAmount: number;
  profitRate: number;
  actionLoading: boolean;
  onStepNumberChange: (value: number) => void;
  onProductIdChange: (value: string) => void;
  onLuckyAmountChange: (value: number) => void;
  onProfitRateChange: (value: number) => void;
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

export default function LuckyOrderModal({
  user,
  fallbackName,
  luckyProducts,
  stepNumber,
  productId,
  luckyAmount,
  profitRate,
  actionLoading,
  onStepNumberChange,
  onProductIdChange,
  onLuckyAmountChange,
  onProfitRateChange,
  onClose,
  onSubmit,
}: LuckyOrderModalProps) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[2rem] border border-fuchsia-400/25 bg-[#090909] p-6 shadow-[0_0_60px_rgba(217,70,239,0.18)]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-fuchsia-200/80">Lucky Order Engine</p>
            <h2 className="text-2xl font-black">Inject Lucky Order</h2>
            <p className="mt-1 text-sm text-white/45">
              Replace one pending generated order with a special lucky order.
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

          <MiniBox label="Current Step" value={String(user.current_step)} />
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-bold text-white/80">
              Lucky Step Number
            </p>

            <input
              value={stepNumber}
              onChange={(event) => onStepNumberChange(Number(event.target.value))}
              type="number"
              min={1}
              max={80}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-fuchsia-400/50"
            />

            <p className="mt-2 text-xs text-white/45">
              Choose a pending step only. Completed steps cannot be replaced.
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-white/80">
              Lucky Product
            </p>

            <select
              value={productId}
              onChange={(event) => onProductIdChange(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-fuchsia-400/50"
            >
              {luckyProducts.length === 0 && (
                <option className="bg-black" value="">
                  No lucky products found
                </option>
              )}

              {luckyProducts.map((product) => (
                <option key={product.id} className="bg-black" value={product.id}>
                  {product.name} - ${Number(product.price || 0).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-white/80">
              Custom Lucky Amount
            </p>

            <input
              value={luckyAmount}
              onChange={(event) =>
                onLuckyAmountChange(Number(event.target.value))
              }
              type="number"
              min={1}
              step="0.01"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-fuchsia-400/50"
            />

            <p className="mt-2 text-xs text-white/45">
              Example: 2800. This replaces the order total for this lucky step.
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-white/80">
              Lucky Profit Rate %
            </p>

            <input
              value={profitRate}
              onChange={(event) =>
                onProfitRateChange(Number(event.target.value))
              }
              type="number"
              min={0}
              step="0.01"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-fuchsia-400/50"
            />

            <p className="mt-2 text-xs text-white/45">
              Example: 5 means 5%. A $2,800 lucky order gives $140 profit.
            </p>
          </div>

          <button
            onClick={onSubmit}
            disabled={actionLoading || !productId}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-300 to-yellow-500 px-5 py-4 font-black text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="h-5 w-5" />
            {actionLoading ? "Injecting..." : "Inject Lucky Order"}
          </button>
        </div>
      </div>
    </div>
  );
}