"use client";

import {
  ChevronLeft,
  ChevronRight,
  Gem,
  Sparkles,
  Star,
} from "lucide-react";

type GeneratedOrderItem = {
  id: string;
  product_snapshot: {
    id?: string | null;
    name?: string;
    category?: string;
    price?: number;
    original_price?: number;
    custom_lucky_amount?: number | string;
    currency?: string;
    rating?: number;
    reviews_count?: number;
    description?: string | null;
    main_image?: string | null;
    images?: string[];
    tier?: string | null;
    stock_status?: string;
    product_type?: string;
  };
  unit_price: number;
  quantity: number;
  subtotal: number;
};

type GeneratedOrder = {
  id: string;
  user_id: string;
  step_number: number;
  order_total: number;
  profit_rate: number;
  profit_amount: number;
  lucky_profit_rate_percent: number | null;
  lucky_profit_amount: number;
  order_type: "normal" | "lucky";
  status: "pending" | "completed" | "cancelled";
  is_lucky_bonus: boolean;
  created_at: string;
  completed_at: string | null;
  user_generated_order_items?: GeneratedOrderItem[];
};

type CraftProfile = {
  grade: string;
  score: number;
  minCredit: number;
  maxCredit: number;
  workMin: number;
  workMax: number;
};

type ActiveMissionCardProps = {
  order: GeneratedOrder;
  activeItems: GeneratedOrderItem[];
  currentStep: number;
  actionLoading: boolean;
  lang: string;
  t: any;
  galleryIndex: Record<string, number>;
  setGalleryIndex: (value: Record<string, number>) => void;
  getImages: (order: GeneratedOrder) => string[];
  changeGalleryImage: (order: GeneratedOrder, direction: "prev" | "next") => void;
  calculateDisplayReward: (order: GeneratedOrder | null) => number;
  getCraftProfile: (order: GeneratedOrder | null) => CraftProfile;
  formatCreditRange: (profile: CraftProfile) => string;
  formatWorkValueRange: (profile: CraftProfile) => string;
  onComplete: (order: GeneratedOrder) => void;
};

function RatingStars({ rating }: { rating: number }) {
  const safeRating = Math.min(Math.max(rating, 0), 5);
  const fillWidth = `${(safeRating / 5) * 100}%`;

  return (
    <div className="relative inline-flex">
      <div className="flex gap-0.5 text-white/20">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className="h-4 w-4" />
        ))}
      </div>

      <div
        className="absolute left-0 top-0 flex gap-0.5 overflow-hidden text-yellow-300"
        style={{ width: fillWidth }}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className="h-4 w-4 fill-current" />
        ))}
      </div>
    </div>
  );
}

export default function ActiveMissionCard({
  order,
  activeItems,
  currentStep,
  actionLoading,
  lang,
  t,
  galleryIndex,
  setGalleryIndex,
  getImages,
  changeGalleryImage,
  calculateDisplayReward,
  getCraftProfile,
  formatCreditRange,
  formatWorkValueRange,
  onComplete,
}: ActiveMissionCardProps) {
  const firstItem = activeItems[0] || null;
  const snapshot = firstItem?.product_snapshot || {};
  const lucky = Boolean(order.is_lucky_bonus || order.order_type === "lucky");

  const images = getImages(order);
  const imageIndex = galleryIndex[order.id] || 0;
  const activeImage = images[imageIndex] || "";

  const productName =
    snapshot.name || (lucky ? "Lucky Promotion Order" : "Promotion Order");

  const productCategory = snapshot.category || "Gold Jewelry";
  const productDescription = snapshot.description || "";
  const productCurrency = snapshot.currency || "USD";
  const productRating = Number(snapshot.rating || 4.8);
  const productReviews = Number(snapshot.reviews_count || 0);

  const productPrice = Number(order.order_total || 0);
  const reward = calculateDisplayReward(order);
  const profitRate = Number(order.profit_rate || 0);
  const craftProfile = getCraftProfile(order);
  const expectedCreditText = formatCreditRange(craftProfile);
  const qualityIndexText = formatWorkValueRange(craftProfile);

  const luckyBoostRate = Number(
    order.lucky_profit_rate_percent ?? profitRate ?? 0
  );
  const requiredCampaignBalance = Number(order.order_total || 0);

  const completed = order.status === "completed";
  const isCurrent = order.step_number === currentStep;

  return (
    <div className="space-y-5 pb-32">
      <div
        key={order.id}
        className={`relative overflow-hidden rounded-[2rem] border backdrop-blur-xl ${
          lucky
            ? "border-yellow-300/70 bg-[radial-gradient(circle_at_top,#8a610d33_0%,#1a1202_42%,#050505_100%)] shadow-[0_0_55px_rgba(250,204,21,0.28)]"
            : "border-white/10 bg-white/[0.05]"
        }`}
      >
        {lucky && (
          <>
            <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-yellow-300/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-16 top-40 h-44 w-44 rounded-full bg-amber-500/10 blur-3xl" />
          </>
        )}

        <div className="relative z-10 border-b border-white/10 bg-black/40 p-3 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-yellow-200/60">
                {lucky ? t.missions.luckyBonus : t.missions.standard} •{" "}
                {t.missions.step} {order.step_number}
              </p>

              <p className="mt-1 truncate text-sm font-black text-white">
                {productName}
              </p>
            </div>

            <div className="shrink-0 rounded-2xl bg-black/45 px-3 py-2 text-right">
              <p className="text-[10px] uppercase tracking-wide text-white/40">
                {lucky
                  ? lang === "zh"
                    ? "奖励收益"
                    : "Bonus Credit"
                  : lang === "zh"
                    ? "预计收益"
                    : "Expected Credit"}
              </p>

              <p className="text-sm font-black text-yellow-300">
                {lucky ? `$${reward.toFixed(2)}` : expectedCreditText}
              </p>
            </div>
          </div>

          <button
            disabled={!isCurrent || actionLoading || completed}
            onClick={() => onComplete(order)}
            className={`w-full rounded-2xl px-5 py-3 text-sm font-black shadow-lg active:scale-[0.98] ${
              completed
                ? "bg-emerald-400/10 text-emerald-300"
                : isCurrent && lucky
                  ? "bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-600 text-black shadow-[0_0_30px_rgba(250,204,21,0.35)]"
                  : isCurrent
                    ? "bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 text-black shadow-[0_0_24px_rgba(250,204,21,0.28)]"
                    : "bg-white/10 text-white/40"
            }`}
          >
            {completed
              ? t.missions.completed
              : isCurrent
                ? actionLoading
                  ? lang === "zh"
                    ? lucky
                      ? "正在处理幸运推广..."
                      : "正在提交推广..."
                    : lucky
                      ? "Processing lucky campaign..."
                      : "Submitting campaign..."
                  : lucky
                    ? t.missions.claimLuckyBonusTask
                    : t.missions.startPromotionTask
                : t.missions.locked}
          </button>
        </div>

        <div className="relative h-72 bg-black/40">
          {activeImage ? (
            <img
              src={activeImage}
              alt={productName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Gem className="h-20 w-20 text-yellow-300/70" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black backdrop-blur ${
                lucky
                  ? "bg-gradient-to-r from-yellow-200 to-yellow-500 text-black shadow-[0_0_22px_rgba(250,204,21,0.45)]"
                  : "bg-black/65 text-white"
              }`}
            >
              {lucky && <Sparkles className="h-3.5 w-3.5" />}
              {lucky ? t.missions.luckyBonus : t.missions.standard}
            </span>

            <span className="rounded-full bg-black/65 px-3 py-1 text-[11px] font-bold text-white/80 backdrop-blur">
              {t.missions.step} {order.step_number}
            </span>
          </div>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => changeGalleryImage(order, "prev")}
                className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => changeGalleryImage(order, "next")}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                {images.map((image, index) => (
                  <button
                    type="button"
                    key={`${image}-${index}`}
                    onClick={() =>
                      setGalleryIndex({
                        ...galleryIndex,
                        [order.id]: index,
                      })
                    }
                    className={`h-1.5 rounded-full transition-all ${
                      index === imageIndex
                        ? "w-6 bg-yellow-300"
                        : "w-1.5 bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-4">
          {lucky ? (
            <div className="mb-4 rounded-[1.8rem] border border-yellow-300/45 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.24),rgba(34,20,0,0.58)_48%,rgba(0,0,0,0.42)_100%)] p-4 shadow-[0_0_36px_rgba(250,204,21,0.16)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-yellow-100/60">
                    {lang === "zh" ? "高级奖励事件" : "Premium Bonus Event"}
                  </p>

                  <h3 className="mt-1 flex items-center gap-2 text-xl font-black text-white">
                    <Sparkles className="h-5 w-5 text-yellow-300" />
                    {lang === "zh"
                      ? "特殊推广通道"
                      : "Special Campaign Access"}
                  </h3>
                </div>

                <div className="rounded-2xl bg-yellow-300 px-3 py-2 text-right text-black shadow-[0_0_22px_rgba(250,204,21,0.35)]">
                  <p className="text-[10px] font-black uppercase">
                    {lang === "zh" ? "加成倍率" : "Boost Rate"}
                  </p>
                  <p className="text-lg font-black">
                    {luckyBoostRate.toFixed(2)}%
                  </p>
                </div>
              </div>

              <p className="mb-4 text-sm leading-6 text-yellow-100/65">
                {lang === "zh"
                  ? "此任务为限时高级奖励任务，需要满足对应推广余额后才能完成。"
                  : "This is a premium bonus mission. The required campaign balance must be available before completion."}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-black/40 p-3">
                  <p className="text-[10px] uppercase text-white/35">
                    {lang === "zh"
                      ? "所需推广余额"
                      : "Required Campaign Balance"}
                  </p>
                  <p className="mt-1 text-sm font-black text-white">
                    {productCurrency} {requiredCampaignBalance.toFixed(2)}
                  </p>
                </div>

                <div className="rounded-2xl bg-yellow-300/10 p-3">
                  <p className="text-[10px] uppercase text-yellow-100/45">
                    {lang === "zh" ? "奖励收益" : "Bonus Credit"}
                  </p>
                  <p className="mt-1 text-sm font-black text-yellow-300">
                    ${reward.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 rounded-[1.6rem] border border-yellow-300/25 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.14),rgba(0,0,0,0.34)_55%)] p-4 shadow-[inset_0_0_26px_rgba(250,204,21,0.06)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-100/50">
                    {lang === "zh" ? "工艺评估" : "Craftsmanship Review"}
                  </p>

                  <h3 className="mt-1 text-xl font-black text-white">
                    {lang === "zh" ? "工艺等级" : "Craft Grade"}{" "}
                    {craftProfile.grade}
                  </h3>
                </div>

                <div className="rounded-2xl bg-black/45 px-3 py-2 text-right">
                  <p className="text-[10px] uppercase text-white/35">
                    {lang === "zh" ? "质量评分" : "Quality Score"}
                  </p>
                  <p className="text-lg font-black text-yellow-300">
                    {craftProfile.score}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-black/35 p-3">
                  <p className="text-[10px] uppercase text-white/35">
                    {lang === "zh" ? "质量指数" : "Quality Index"}
                  </p>
                  <p className="mt-1 text-sm font-black text-white">
                    {qualityIndexText}
                  </p>
                </div>

                <div className="rounded-2xl bg-yellow-300/10 p-3">
                  <p className="text-[10px] uppercase text-yellow-100/45">
                    {lang === "zh" ? "预计收益" : "Expected Credit"}
                  </p>
                  <p className="mt-1 text-sm font-black text-yellow-300">
                    {expectedCreditText}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                {lang === "zh" ? "产品参考" : "Product Reference"}
              </p>

              <h3 className="mt-1 text-lg font-black text-white">
                {productName}
              </h3>

              <p className="mt-1 text-sm text-white/45">
                {productCategory} {t.missions.campaign}
              </p>
            </div>

            <div className="rounded-2xl bg-black/25 px-3 py-2 text-right">
              <p className="text-[10px] uppercase tracking-wide text-white/35">
                {lang === "zh" ? "产品价值" : "Product Value"}
              </p>
              <p className="font-black text-white/75">
                {productCurrency} {productPrice.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="mb-3 flex items-center gap-2">
            <div className="flex items-center gap-2">
              <RatingStars rating={productRating} />

              <span className="text-sm font-black text-yellow-300">
                {productRating.toFixed(1)}
              </span>
            </div>

            <p className="text-xs text-white/45">
              {productReviews} {t.missions.reviews}
            </p>

            <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-300">
              {t.missions.verifiedProduct}
            </span>
          </div>

          {productDescription && (
            <p className="line-clamp-3 text-sm leading-6 text-white/60">
              {productDescription}
            </p>
          )}

          {activeItems.length > 0 && (
            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-black/25 p-3">
              <p className="mb-2 text-xs font-black uppercase tracking-wide text-white/40">
                Order Items
              </p>

              <div className="space-y-2">
                {activeItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] px-3 py-2 text-xs"
                  >
                    <div>
                      <p className="font-bold text-white/80">
                        {item.product_snapshot?.name || productName}
                      </p>
                      <p className="mt-0.5 text-white/40">
                        Qty {item.quantity} × $
                        {Number(item.unit_price || 0).toFixed(2)}
                      </p>
                    </div>

                    <p className="font-black text-yellow-300">
                      ${Number(item.subtotal || 0).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-black/30 p-3">
              <p className="text-xs text-white/45">
                {lucky
                  ? lang === "zh"
                    ? "所需推广余额"
                    : "Required Balance"
                  : lang === "zh"
                    ? "质量指数"
                    : "Quality Index"}
              </p>
              <p className="mt-1 font-bold text-white">
                {lucky
                  ? `${productCurrency} ${requiredCampaignBalance.toFixed(2)}`
                  : qualityIndexText}
              </p>
            </div>

            <div className="rounded-2xl bg-black/30 p-3">
              <p className="text-xs text-white/45">
                {lucky
                  ? lang === "zh"
                    ? "奖励收益"
                    : "Bonus Credit"
                  : lang === "zh"
                    ? "预计收益"
                    : "Expected Credit"}
              </p>
              <p className="mt-1 font-bold text-yellow-300">
                {lucky ? `$${reward.toFixed(2)}` : expectedCreditText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}