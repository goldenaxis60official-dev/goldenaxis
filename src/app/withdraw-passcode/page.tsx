"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle,
  Lock,
  ShieldCheck,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import LuxuryCard from "@/components/ui/LuxuryCard";
import { supabase } from "@/lib/supabaseClient";

export default function WithdrawPasscodePage() {
  return (
    <RequireAuth>
      {() => <WithdrawPasscodeContent />}
    </RequireAuth>
  );
}

function WithdrawPasscodeContent() {
  const router = useRouter();

  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");

  const [loading, setLoading] = useState(false);
  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");

  async function handleSavePasscode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSuccessText("");
    setErrorText("");

    if (!/^[0-9]{6}$/.test(newPasscode)) {
      setErrorText("Withdraw passcode must be exactly 6 digits.");
      return;
    }

    if (newPasscode !== confirmPasscode) {
      setErrorText("Confirm passcode does not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.rpc("set_withdraw_passcode", {
      p_passcode: newPasscode,
    });

    if (error) {
      setErrorText(error.message);
      setLoading(false);
      return;
    }

    setSuccessText("Withdraw passcode changed successfully.");
    setNewPasscode("");
    setConfirmPasscode("");
    setLoading(false);
  }

  return (
    <AppShell>
      <section className="px-5 pb-36 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">Account Security</p>
            <h1 className="text-2xl font-black">Withdraw Passcode</h1>
            <p className="mt-1 text-xs text-white/45">
              Change your 6-digit withdrawal security passcode.
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <ShieldCheck className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <LuxuryCard goldGlow className="mb-5 p-5">
          <div className="mb-4 flex gap-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-100/80">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" />
            <p>
              Use a 6-digit passcode you can remember. You will need this before
              submitting a withdrawal request.
            </p>
          </div>

          <form onSubmit={handleSavePasscode} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-white/45">
                New Withdraw Passcode
              </span>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3.5 transition focus-within:border-yellow-400/60 focus-within:bg-black/60">
                <Lock className="h-5 w-5 text-yellow-300/80" />

                <input
                  value={newPasscode}
                  onChange={(event) =>
                    setNewPasscode(
                      event.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter new 6-digit passcode"
                  autoComplete="new-password"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold text-white/45">
                Confirm Withdraw Passcode
              </span>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3.5 transition focus-within:border-yellow-400/60 focus-within:bg-black/60">
                <Lock className="h-5 w-5 text-yellow-300/80" />

                <input
                  value={confirmPasscode}
                  onChange={(event) =>
                    setConfirmPasscode(
                      event.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter passcode again"
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
              <ShieldCheck className="h-5 w-5" />
              {loading ? "Saving..." : "Change Withdraw Passcode"}
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