export type WalletRequest = {
  id: string;
  user_id: string;
  type: "deposit_credit" | "withdrawal";
  amount: number;
  method: string | null;
  proof_url: string | null;
  status: "pending" | "approved" | "rejected";
  note: string | null;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};