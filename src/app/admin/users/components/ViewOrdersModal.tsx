// src/app/admin/users/components/ViewOrdersModal.tsx

import { Eye, Pencil, Trash2, X } from "lucide-react";

type ModalUser = {
  display_name: string | null;
  email: string | null;
};

type GeneratedOrderItemPreview = {
  id: string;
  product_snapshot: {
    id?: string;
    name?: string;
    main_image?: string | null;
    category?: string;
    custom_lucky_amount?: string | number;
  };
  unit_price: number;
  quantity: number;
  subtotal: number;
};

type GeneratedOrderPreview = {
  id: string;
  step_number: number;
  order_total: number;
  profit_rate: number;
  profit_amount: number;
  order_type: "normal" | "lucky";
  status: "pending" | "completed" | "cancelled";
  is_lucky_bonus: boolean;
  created_at: string;
  completed_at: string | null;
  user_generated_order_items?: GeneratedOrderItemPreview[];
};

type ViewOrdersModalText = {
  tag: string;
  title: string;
  description: string;
  user: string;
  total: string;
  completed: string;
  pending: string;
  lucky: string;
  loading: string;
  noOrdersTitle: string;
  noOrdersDescription: string;
  step: string;
  product: string;
  type: string;
  orderTotal: string;
  profit: string;
  status: string;
  completedDate: string;
  generatedProduct: string;
  qty: string;
  subtotal: string;
  normal: string;
  cancelled: string;
};

type ViewOrdersModalProps = {
  user: ModalUser;
  fallbackName: string;
  orders: GeneratedOrderPreview[];
  loading: boolean;
  t: ViewOrdersModalText;
  onClose: () => void;
  onDeleteOrder: (order: GeneratedOrderPreview) => void;
  onEditLuckyOrder: (order: GeneratedOrderPreview) => void;
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

export default function ViewOrdersModal({
  user,
  fallbackName,
  orders,
  loading,
  t,
  onClose,
  onDeleteOrder,
  onEditLuckyOrder,
}: ViewOrdersModalProps) {
  const completedCount = orders.filter(
    (order) => order.status === "completed"
  ).length;

  const pendingCount = orders.filter(
    (order) => order.status === "pending"
  ).length;

  const luckyCount = orders.filter((order) => order.is_lucky_bonus).length;

  function getStatusText(status: GeneratedOrderPreview["status"]) {
    if (status === "completed") return t.completed;
    if (status === "pending") return t.pending;
    return t.cancelled;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
      <div className="w-full max-w-6xl rounded-[2rem] border border-blue-400/25 bg-[#090909] p-6 shadow-[0_0_60px_rgba(59,130,246,0.18)]">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-blue-200/80">{t.tag}</p>
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

        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
          <MiniBox label={t.user} value={user.display_name || fallbackName} />
          <MiniBox label={t.total} value={String(orders.length)} color="gold" />
          <MiniBox label={t.completed} value={String(completedCount)} />
          <MiniBox label={t.pending} value={String(pendingCount)} />
          <MiniBox label={t.lucky} value={String(luckyCount)} color="gold" />
        </div>

        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center text-white/55">
            {t.loading}
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
            <Eye className="mx-auto mb-3 h-10 w-10 text-blue-300" />
            <p className="font-black text-white">{t.noOrdersTitle}</p>
            <p className="mt-2 text-sm text-white/45">
              {t.noOrdersDescription}
            </p>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="max-h-[620px] overflow-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[#151515] text-xs uppercase tracking-wide text-white/45">
                <tr>
                  <th className="px-4 py-3">{t.step}</th>
                  <th className="px-4 py-3">{t.product}</th>
                  <th className="px-4 py-3">{t.type}</th>
                  <th className="px-4 py-3">{t.orderTotal}</th>
                  <th className="px-4 py-3">{t.profit}</th>
                  <th className="px-4 py-3">{t.status}</th>
                  <th className="px-4 py-3">{t.completedDate}</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {orders.map((order) => {
                  const firstItem = order.user_generated_order_items?.[0];

                  return (
                    <tr
                      key={order.id}
                      className={
                        order.is_lucky_bonus
                          ? "bg-fuchsia-500/[0.07] hover:bg-fuchsia-500/[0.11]"
                          : "bg-black/20 hover:bg-white/[0.04]"
                      }
                    >
                      <td className="px-4 py-4 font-black text-yellow-300">
                        #{order.step_number}
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-bold text-white">
                          {firstItem?.product_snapshot?.name ||
                            t.generatedProduct}
                        </p>

                        <p className="mt-1 text-xs text-white/45">
                          {t.qty} {firstItem?.quantity || 1} · {t.subtotal} $
                          {Number(
                            firstItem?.subtotal || order.order_total
                          ).toFixed(2)}
                        </p>

                        {order.is_lucky_bonus && (
                          <p className="mt-1 text-[11px] font-bold text-fuchsia-200">
                            Lucky custom amount: $
                            {Number(
                              firstItem?.product_snapshot?.custom_lucky_amount ||
                                order.order_total ||
                                0
                            ).toFixed(2)}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            order.is_lucky_bonus
                              ? "bg-fuchsia-500/20 text-fuchsia-200"
                              : "bg-blue-500/15 text-blue-300"
                          }`}
                        >
                          {order.is_lucky_bonus ? "Lucky Bonus" : t.normal}
                        </span>
                      </td>

                      <td className="px-4 py-4 font-black text-white">
                        ${Number(order.order_total || 0).toFixed(2)}
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-black text-emerald-300">
                          ${Number(order.profit_amount || 0).toFixed(2)}
                        </p>
                        <p className="mt-1 text-xs text-white/40">
                          {Number(order.profit_rate || 0).toFixed(2)}%
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            order.status === "completed"
                              ? "bg-emerald-400/15 text-emerald-300"
                              : order.status === "pending"
                                ? "bg-yellow-400/15 text-yellow-300"
                                : "bg-red-400/15 text-red-300"
                          }`}
                        >
                          {getStatusText(order.status)}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-xs text-white/45">
                        {order.completed_at
                          ? new Date(order.completed_at).toLocaleString()
                          : "-"}
                      </td>

                      <td className="px-4 py-4 text-right">
                        {order.status === "pending" ? (
                          <div className="flex justify-end gap-2">
                            {order.is_lucky_bonus && (
                              <button
                                onClick={() => onEditLuckyOrder(order)}
                                className="inline-flex items-center gap-1 rounded-lg bg-fuchsia-500/15 px-3 py-1.5 text-xs font-black text-fuchsia-200 hover:bg-fuchsia-500/25"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit Lucky
                              </button>
                            )}

                            <button
                              onClick={() => onDeleteOrder(order)}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-black text-red-300 hover:bg-red-500/25"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-white/30">Locked</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}