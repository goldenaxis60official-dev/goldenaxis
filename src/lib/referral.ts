// src/lib/referral.ts

export function normalizeReferralCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 20);
}

export function isValidReferralCode(value: string) {
  const code = normalizeReferralCode(value);
  return /^[A-Z0-9_-]{4,20}$/.test(code);
}

export function generateReferralCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}