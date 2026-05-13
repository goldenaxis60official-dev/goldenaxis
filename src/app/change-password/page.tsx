"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import LuxuryCard from "@/components/ui/LuxuryCard";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";

export default function ChangePasswordPage() {
  return (
    <RequireAuth>
      {(profile) => <ChangePasswordContent profile={profile} />}
    </RequireAuth>
  );
}

function ChangePasswordContent({ profile }: { profile: Profile }) {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");

  async function handleChangePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSuccessText("");
    setErrorText("");

const loginId = profile.email || profile.phone;

if (!loginId) {
  setErrorText("This account does not have a login ID.");
  return;
}

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setErrorText("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorText("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorText("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setErrorText("New password must be different from current password.");
      return;
    }

    setLoading(true);

const loginPayload = profile.email
  ? { email: profile.email, password: currentPassword }
  : { phone: profile.phone || "", password: currentPassword };

const { error: loginError } = await supabase.auth.signInWithPassword(
  loginPayload
);

    if (loginError) {
      setErrorText("Current password is incorrect.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setErrorText(updateError.message);
      setLoading(false);
      return;
    }

    setSuccessText("Password changed successfully.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setLoading(false);
  }

  return (
    <AppShell>
      <section className="px-5 pb-36 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">Account Security</p>
            <h1 className="text-2xl font-black">Change Password</h1>
            <p className="mt-1 text-xs text-white/45">
              Update your login password for account protection.
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <KeyRound className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <LuxuryCard goldGlow className="mb-5 p-5">
          <div className="mb-4 flex gap-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-100/80">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" />
            <p>
              Use a password you can remember. If you forget it, support can
              reset it for you.
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-white/45">
                Current Password
              </span>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3.5 transition focus-within:border-yellow-400/60 focus-within:bg-black/60">
                <Lock className="h-5 w-5 text-yellow-300/80" />

                <input
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-white/40 transition hover:text-yellow-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold text-white/45">
                New Password
              </span>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3.5 transition focus-within:border-yellow-400/60 focus-within:bg-black/60">
                <Lock className="h-5 w-5 text-yellow-300/80" />

                <input
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold text-white/45">
                Confirm New Password
              </span>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3.5 transition focus-within:border-yellow-400/60 focus-within:bg-black/60">
                <Lock className="h-5 w-5 text-yellow-300/80" />

                <input
                  value={confirmNewPassword}
                  onChange={(event) =>
                    setConfirmNewPassword(event.target.value)
                  }
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password again"
                  autoComplete="new-password"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                />
              </div>
            </label>

            {successText && (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                <CheckCircle className="h-4 w-4" />
                {successText}
              </div>
            )}

            {errorText && (
              <div className="flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                <AlertCircle className="h-4 w-4" />
                {errorText}
              </div>
            )}

            <button
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 px-5 py-4 font-black text-black shadow-[0_12px_32px_rgba(234,179,8,0.28)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <KeyRound className="h-5 w-5" />
              {loading ? "Changing..." : "Change Password"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 font-bold text-white/75"
            >
              Back to Profile
            </button>
          </form>
        </LuxuryCard>
      </section>
    </AppShell>
  );
}