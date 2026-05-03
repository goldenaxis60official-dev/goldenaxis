//src>app>verify-email>page.tsx

"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Gem,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { generateTeamCode } from "@/lib/referral";

type PendingSignup = {
  email: string;
  displayName: string;
  teamCode: string;
};

export default function VerifyEmailPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [resending, setResending] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlEmail = params.get("email") || "";

    const pending = getPendingSignup();

    setEmail(urlEmail || pending?.email || "");

    async function checkExistingSession() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      await finishProfileSetup(session.user.id, session.user.email || "");
      return;
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not finish verification.";
    setErrorText(message);
  } finally {
    setCheckingSession(false);
  }
}

checkExistingSession();
    }, []);

  function getPendingSignup(): PendingSignup | null {
    try {
      const raw = localStorage.getItem("ga60_pending_signup");
      if (!raw) return null;
      return JSON.parse(raw) as PendingSignup;
    } catch {
      return null;
    }
  }

  async function finishProfileSetup(userId: string, userEmail: string) {
    const pending = getPendingSignup();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const metadata = user?.user_metadata || {};

    const finalEmail = userEmail || email;
    const finalDisplayName =
    pending?.displayName || metadata.display_name || finalEmail.split("@")[0];
    const finalTeamCode = (
      pending?.teamCode ||
      metadata.team_code ||
      ""
    )
      .trim()
      .toUpperCase();

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle();

    if (!existingProfile) {
      const legacyCode = generateTeamCode();

      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        email: finalEmail,
        display_name: finalDisplayName,
        referral_code: legacyCode,
        referred_by: null,
        terms_accepted: true,
        role: "user",
        balance: 0,
        today_earnings: 0,
        total_earnings: 0,
        current_step: 1,
        credit_score: 100,
        status: "active",
      });

      if (profileError) {
        throw new Error(profileError.message);
      }

      if (finalTeamCode) {
        const { error: joinError } = await supabase.rpc("join_team_by_code", {
          _team_code: finalTeamCode,
        });

        if (joinError) {
          throw new Error(joinError.message || "Team code not found.");
        }
      }
    }

    localStorage.removeItem("ga60_pending_signup");

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profile?.role === "admin") {
      router.replace("/admin");
    } else {
      router.replace("/");
    }
  }

  async function handleVerify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorText("");
    setSuccessText("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanEmail || !cleanOtp) {
      setErrorText("Please enter your email and verification code.");
      return;
    }

    if (cleanOtp.length !== 6) {
  setErrorText("Verification code must be 6 digits.");
  return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanOtp,
        type: "signup",
      });

      if (error) throw error;

      const user = data.user;

      if (!user) {
        throw new Error("Verification succeeded, but user was not found.");
      }

      setSuccessText("Email verified. Preparing your account...");
      await finishProfileSetup(user.id, user.email || cleanEmail);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Verification failed.";
      setErrorText(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setErrorText("");
    setSuccessText("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorText("Please enter your email first.");
      return;
    }

    setResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: cleanEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (error) throw error;

      setSuccessText("A new verification code has been sent to your email.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not resend code.";
      setErrorText(message);
    } finally {
      setResending(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-yellow-300 border-t-transparent" />
          <p className="text-sm text-white/60">Checking verification...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col overflow-hidden border-x border-white/10 bg-[radial-gradient(circle_at_top,#3a2a08_0%,#0b0903_34%,#050505_72%,#000_100%)]">
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-yellow-400/30 bg-yellow-400/10 shadow-[0_0_30px_rgba(234,179,8,0.22)]">
              <Gem className="h-5 w-5 text-yellow-300" />
            </div>

            <div>
              <p className="text-sm font-black tracking-wide">
                Golden Axis 60
              </p>
              <p className="text-[11px] text-white/40">Email Verification</p>
            </div>
          </div>

          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold text-emerald-200">
            Secure
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center px-5 pb-10">
          <div className="relative">
            <div className="absolute -top-24 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-yellow-400/10 blur-3xl" />

            <div className="relative mb-8 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-yellow-300/40 bg-gradient-to-br from-yellow-300/20 via-yellow-500/10 to-black shadow-[0_0_55px_rgba(234,179,8,0.28)]">
                <Mail className="h-10 w-10 text-yellow-300 drop-shadow-[0_0_18px_rgba(250,204,21,0.55)]" />
              </div>

              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[11px] font-bold text-yellow-100/80">
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                Verify Member Access
              </div>

              <h1 className="text-4xl font-black tracking-tight">
                Check Your Email
              </h1>

              <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-white/50">
                Enter the 6-digit verification code sent to your email address.
              </p>
            </div>

            <form
              onSubmit={handleVerify}
              className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.065] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
            >
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-yellow-300/70 to-transparent" />

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-white/45">
                    Email Address
                  </span>

                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    type="email"
                    className="w-full rounded-2xl border border-white/10 bg-black/45 px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-yellow-400/60"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-white/45">
                    Verification Code
                  </span>

                  <input
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    inputMode="numeric"
                    maxLength={6}
                    className="w-full rounded-2xl border border-white/10 bg-black/45 px-4 py-4 text-center text-2xl font-black tracking-[0.45em] text-yellow-200 outline-none placeholder:text-white/20 focus:border-yellow-400/60"
                  />
                </label>

                {errorText && (
                  <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-100">
                    {errorText}
                  </div>
                )}

                {successText && (
                  <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm leading-5 text-emerald-100">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{successText}</span>
                  </div>
                )}

                <button
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 px-5 py-4 font-black text-black shadow-[0_18px_45px_rgba(234,179,8,0.22)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify Account
                      <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-5 py-3 text-sm font-bold text-white/70 transition hover:border-yellow-400/30 hover:text-yellow-200 disabled:opacity-60"
                >
                  {resending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Resend Code
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-5 rounded-3xl border border-white/10 bg-black/25 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-yellow-400/10">
                  <ShieldCheck className="h-5 w-5 text-yellow-300" />
                </div>

                <div>
                  <p className="text-sm font-bold text-white/85">
                    Protected account activation
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/45">
                    Your profile will be created only after your email is
                    verified successfully.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 text-center text-[11px] text-white/30">
          © Golden Axis 60 · Official Verification Portal
        </div>
      </div>
    </main>
  );
}