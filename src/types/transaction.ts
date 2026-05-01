export type Transaction = {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  reference_id: string | null;
  description: string | null;
  created_at: string;
};