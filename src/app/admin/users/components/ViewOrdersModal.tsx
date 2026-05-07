//src>app>admin>users<components<ViewOrdersModal.tsx

import { Eye, X } from "lucide-react";

type ModalUser = {
  display_name: string | null;
  email: string | null;
};

type GeneratedOrderItemPreview = {
  id: string;
  product_snapshot: {
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

type ViewOrdersModalProps = {
  user: ModalUser;
  fallbackName: string;
  orders: GeneratedOrderPreview[];
  loading: boolean;
  onClose: () => void;
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
  onClose,
}: ViewOrdersModalProps) {
  const completedCount = orders.filter(
    (order) => order.status === "completed"
  ).length;

  const pendingCount = orders.filter(
    (order) => order.status === "pending"
  ).length;

  const luckyCount = orders.filter((order) => order.is_lucky_bonus).length;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
      <div className="w-full max-w-5xl rounded-[2rem] border border-blue-400/25 bg-[#090909] p-6 shadow-[0_0_60px_rgba(59,130,246,0.18)]">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-blue-200/80">Generated Order Center</p>
            <h2 className="text-2xl font-black">View Orders</h2>
            <p className="mt-1 text-sm text-white/45">
              Review generated promotion orders for this user.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl bg-white/10 p-3 text-white/70"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
          <MiniBox label="User" value={user.display_name || fallbackName} />

          <MiniBox label="Total" value={String(orders.length)} color="gold" />

          <MiniBox label="Completed" value={String(completedCount)} />

          <MiniBox label="Pending" value={String(pendingCount)} />

          <MiniBox label="Lucky" value={String(luckyCount)} color="gold" />
        </div>

        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center text-white/55">
            Loading generated orders...
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
            <Eye className="mx-auto mb-3 h-10 w-10 text-blue-300" />
            <p className="font-black text-white">No generated orders found</p>
            <p className="mt-2 text-sm text-white/45">
              Generate orders first, then they will appear here.
            </p>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="max-h-[620px] overflow-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[#151515] text-xs uppercase tracking-wide text-white/45">
                <tr>
                  <th className="px-4 py-3">Step</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Order Total</th>
                  <th className="px-4 py-3">Profit</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Completed</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {orders.map((order) => {
                  const firstItem = order.user_generated_order_items?.[0];

                  return (
                    <tr
                      key={order.id}
                      className="bg-black/20 hover:bg-white/[0.04]"
                    >
                      <td className="px-4 py-4 font-black text-yellow-300">
                        #{order.step_number}
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-bold text-white">
                          {firstItem?.product_snapshot?.name ||
                            "Generated product"}
                        </p>

                        <p className="mt-1 text-xs text-white/45">
                          Qty {firstItem?.quantity || 1} · Subtotal $
                          {Number(
                            firstItem?.subtotal || order.order_total
                          ).toFixed(2)}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            order.is_lucky_bonus
                              ? "bg-fuchsia-500/15 text-fuchsia-300"
                              : "bg-blue-500/15 text-blue-300"
                          }`}
                        >
                          {order.is_lucky_bonus ? "Lucky" : "Normal"}
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
                          {order.status}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-xs text-white/45">
                        {order.completed_at
                          ? new Date(order.completed_at).toLocaleString()
                          : "-"}
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