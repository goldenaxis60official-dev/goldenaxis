//types>profile.ts

export type Profile = {
  id: string;
  member_id: string | null;
  email: string | null;
  phone: string | null;
  display_name: string | null;
  avatar_url: string | null;

  // Old balance column - keep for now so old pages do not break
  balance: number;

  // New separated balance system
  deposited_balance: number;
  referral_bonus_balance: number;
  task_profit_balance: number;

  today_earnings: number;
  total_earnings: number;
  current_step: number;

  referral_code: string;
  referred_by: string | null;

  credit_score: number;
  status: string;
  terms_accepted: boolean;

  role: "user" | "admin" | "leader" | "support";
  language: "en" | "zh";

  created_at: string;
};