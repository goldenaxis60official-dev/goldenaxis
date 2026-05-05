export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  rating: number;
  reviews_count: number;
  description: string | null;
  images: string[];
  main_image: string | null;
  product_type: "normal" | "lucky";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};