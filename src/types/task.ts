export type Task = {
  id: string;
  step_number: number;
  title: string;
  category: string;
  price: number;
  commission_rate: number;
  task_type: "standard" | "lucky_bonus";
  multiplier: number;
  image_url: string | null;
  video_url: string | null;
  rating_label_1: string | null;
  rating_label_2: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
};