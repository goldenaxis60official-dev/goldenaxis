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
  luckyProducts: LuckyProductOption[];
  recommendedProduct: LuckyProductOption | null;
  selectedProductId: string;
  stepNumber: number;
  luckyAmount: number;
  profitRate: number;
  actionLoading: boolean;
  t: LuckyOrderModalText;
  onProductChange: (value: string) => void;
  onStepNumberChange: (value: number) => void;
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
  recommendedProduct,
  selectedProductId,
  stepNumber,
  luckyAmount,
  profitRate,
  actionLoading,
  t,
  onProductChange,
  onStepNumberChange,
  onLuckyAmountChange,
  onProfitRateChange,
  onClose,
  onSubmit,
}: LuckyOrderModalProps) {
  const selectedProduct =
    luckyProducts.find((product) => product.id === selectedProductId) ||
    recommendedProduct;

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
              onChange={(event) =>
                onStepNumberChange(Number(event.target.value))
              }
              type="number"
              min={1}
              max={80}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-fuchsia-400/50"
            />

            <p className="mt-2 text-xs text-white/45">{t.luckyStepHelp}</p>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-white/80">
              Choose Lucky Product
            </p>

            <select
              value={selectedProduct?.id || ""}
              onChange={(event) => onProductChange(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-fuchsia-400/50"
            >
              <option className="bg-black" value="">
                Auto recommend product
              </option>

              {luckyProducts.map((product) => (
                <option key={product.id} className="bg-black" value={product.id}>
                  {product.name} · ${Number(product.price || 0).toFixed(2)}
                </option>
              ))}
            </select>

            <p className="mt-2 text-xs text-white/45">
              Admin can manually choose the product used for this lucky order.
            </p>
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

          <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-black text-fuchsia-100">
                Selected Lucky Product
              </p>

              <span className="rounded-full bg-yellow-400 px-3 py-1 text-[10px] font-black text-black">
                {selectedProductId ? "MANUAL" : t.autoBadge}
              </span>
            </div>

            {selectedProduct ? (
              <div className="flex items-center gap-3">
                {selectedProduct.main_image ? (
                  <img
                    src={selectedProduct.main_image}
                    alt={selectedProduct.name}
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-black/40 text-xl">
                    💎
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-white">
                    {selectedProduct.name}
                  </p>

                  <p className="mt-1 text-xs text-white/45">
                    {selectedProduct.category || "Product"} · {t.productValue}{" "}
                    <span className="font-bold text-yellow-300">
                      ${Number(selectedProduct.price || 0).toFixed(2)}
                    </span>
                  </p>

                  <p className="mt-1 text-xs text-white/45">
                    {t.luckyOrderAmount}{" "}
                    <span className="font-bold text-fuchsia-200">
                      ${Number(luckyAmount || 0).toFixed(2)}
                    </span>
                  </p>
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
            disabled={actionLoading || !selectedProduct}
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