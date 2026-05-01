export type Profile = {
  id: string;
  email: string | null;
  phone: string | null;
  display_name: string | null;
  avatar_url: string | null;
  balance: number;
  today_earnings: number;
  total_earnings: number;
  current_step: number;
  referral_code: string;
  referred_by: string | null;
  credit_score: number;
  status: string;
  terms_accepted: boolean;
  role: "user" | "admin";
  created_at: string;
};