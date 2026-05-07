import type { Product } from "./product";

export type GeneratedOrderStatus = "pending" | "completed" | "cancelled";
export type GeneratedOrderType = "normal" | "lucky";

export type UserGeneratedOrder = {
  id: string;
  user_id: string;

  step_number: number;
  order_total: number;
  profit_rate: number;
  profit_amount: number;

  order_type: GeneratedOrderType;
  status: GeneratedOrderStatus;
  is_lucky_bonus: boolean;

  created_at: string;
  completed_at: string | null;

  user_generated_order_items?: UserGeneratedOrderItem[];
};

export type UserGeneratedOrderItem = {
  id: string;

  order_id: string;
  product_id: string | null;

  product_snapshot: {
    id?: string | null;
    name?: string;
    category?: string;
    price?: number;
    currency?: string;
    rating?: number;
    reviews_count?: number;
    description?: string | null;
    main_image?: string | null;
    images?: string[];
    product_type?: string;
    tier?: string | null;
  };

  unit_price: number;
  quantity: number;
  subtotal: number;

  created_at: string;

  products?: Product | null;
};