// src/app/admin/users/components/LuckyOrderModal.tsx

// src/app/admin/users/components/LuckyOrderModal.tsx

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
  customLuckyAmount: string;
  customLuckyAmountHelp: string;
  recommendedProduct: string;
  autoBadge: string;
  productValue: string;
  luckyOrderAmount: string;
  noLuckyProducts: string;
  noMatchingProduct: string;
  luckyProfitRate: string;
  luckyProfitRateHelp: string;
  injecting: string;
  injectLuckyOrder: string;
};

type LuckyOrderModalProps = {
  user: ModalUser;
  fallbackName: string;
  totalSteps: number;
  pendingOrders: number;
  luckyProducts: LuckyProductOption[];
  recommendedProduct: LuckyProductOption | null;
  selectedProductId: string;
  stepNumber: number | "";
  luckyAmount: number;
  profitRate: number;
  actionLoading: boolean;
  t: LuckyOrderModalText;
  onProductChange: (value: string) => void;
  onStepNumberChange: (value: number | "") => void;
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
  totalSteps,
  pendingOrders,
  luckyProducts,
  recommendedProduct,
  stepNumber,
  luckyAmount,
  profitRate,
  actionLoading,
  t,
  onStepNumberChange,
  onLuckyAmountChange,
  onProfitRateChange,
  onClose,
  onSubmit,
}: LuckyOrderModalProps) {
  const estimatedLuckyProfit = Number(
    ((Number(luckyAmount || 0) * Number(profitRate || 0)) / 100).toFixed(2)
  );

  const currentStep = Number(user.current_step || 1);
  const stepHelp =
    totalSteps > 0
      ? `Choose pending step ${currentStep} - ${totalSteps}. Completed steps cannot be replaced.`
      : "No generated steps found for this user.";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-xl overflow-auto rounded-[2rem] border border-fuchsia-400/25 bg-[#090909] p-6 shadow-[0_0_60px_rgba(217,70,239,0.18)]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-fuchsia-200/80">{t.tag}</p>
            <h2 className="text-2xl font-black">{t.title}</h2>
            <p className="mt-1 text-sm text-white/45">{t.description}</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl bg-white/10 p-3 text-white/70 hover:bg-white/15"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <MiniBox label={t.user} value={user.display_name || fallbackName} />

          <MiniBox
            label={t.balance}
            value={`$${Number(user.balance || 0).toFixed(2)}`}
            color="gold"
          />

          <MiniBox label={t.currentStep} value={String(currentStep)} />

          <MiniBox
            label="Total Steps"
            value={totalSteps > 0 ? String(totalSteps) : "No orders"}
            color="gold"
          />

          <MiniBox label="Pending" value={String(pendingOrders)} />
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-bold text-white/80">
              {t.luckyStepNumber}
            </p>

            <input
              value={stepNumber}
              onChange={(event) => {
                const value = event.target.value;
                onStepNumberChange(value === "" ? "" : Number(value));
              }}
              type="number"
              min={1}
              max={totalSteps > 0 ? totalSteps : undefined}
              placeholder={
                totalSteps > 0
                  ? `Enter step ${currentStep} - ${totalSteps}`
                  : "No generated steps"
              }
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-fuchsia-400/50"
            />

            <p className="mt-2 text-xs text-white/45">{stepHelp}</p>
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

          <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-black text-fuchsia-100">
                {t.recommendedProduct}
              </p>

              <span className="rounded-full bg-yellow-400 px-3 py-1 text-[10px] font-black text-black">
                {t.autoBadge}
              </span>
            </div>

            {recommendedProduct ? (
              <div className="flex items-center gap-3">
                {recommendedProduct.main_image ? (
                  <img
                    src={recommendedProduct.main_image}
                    alt={recommendedProduct.name}
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-black/40 text-xl">
                    💎
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-white">
                    {recommendedProduct.name}
                  </p>

                  <p className="mt-1 text-xs text-white/45">
                    {recommendedProduct.category || "Product"} · {t.productValue}{" "}
                    <span className="font-bold text-yellow-300">
                      ${Number(recommendedProduct.price || 0).toFixed(2)}
                    </span>
                  </p>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-black/25 p-2">
                      <p className="text-white/40">{t.luckyOrderAmount}</p>
                      <p className="font-black text-fuchsia-200">
                        ${Number(luckyAmount || 0).toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/25 p-2">
                      <p className="text-white/40">Lucky Profit</p>
                      <p className="font-black text-emerald-300">
                        ${estimatedLuckyProfit.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-red-200">
                {luckyProducts.length === 0
                  ? t.noLuckyProducts
                  : t.noMatchingProduct}
              </p>
            )}
          </div>

          <button
            onClick={onSubmit}
            disabled={actionLoading || !recommendedProduct || !stepNumber}
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