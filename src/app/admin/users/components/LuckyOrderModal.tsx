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

type LuckyOrderModalText = {
  tag: string;
  title: string;
  description: string;
  user: string;
  balance: string;
  currentStep: string;
  luckyStepNumber: string;
  luckyStepHelp: string;
  luckyProduct: string;
  noLuckyProducts: string;
  customLuckyAmount: string;
  customLuckyAmountHelp: string;
  luckyProfitRate: string;
  luckyProfitRateHelp: string;
  injecting: string;
  injectLuckyOrder: string;
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
  t: LuckyOrderModalText;
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
  t,
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
            <p className="text-sm text-fuchsia-200/80">{t.tag}</p>
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
            value={`$${Number(user.balance || 0).toFixed(2)}`}
            color="gold"
          />

          <MiniBox label={t.currentStep} value={String(user.current_step)} />
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-bold text-white/80">
              {t.luckyStepNumber}
            </p>

            <input
              value={stepNumber}
              onChange={(event) => onStepNumberChange(Number(event.target.value))}
              type="number"
              min={1}
              max={80}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-fuchsia-400/50"
            />

            <p className="mt-2 text-xs text-white/45">{t.luckyStepHelp}</p>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-white/80">
              {t.luckyProduct}
            </p>

            <select
              value={productId}
              onChange={(event) => onProductIdChange(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-fuchsia-400/50"
            >
              {luckyProducts.length === 0 && (
                <option className="bg-black" value="">
                  {t.noLuckyProducts}
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
              {t.customLuckyAmount}
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
              {t.customLuckyAmountHelp}
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-white/80">
              {t.luckyProfitRate}
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
              {t.luckyProfitRateHelp}
            </p>
          </div>

          <button
            onClick={onSubmit}
            disabled={actionLoading || !productId}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-300 to-yellow-500 px-5 py-4 font-black text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="h-5 w-5" />
            {actionLoading ? t.injecting : t.injectLuckyOrder}
          </button>
        </div>
      </div>
    </div>
  );
}