// src/app/register/page.tsx

"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { guestAuth } from "@/i18n/guestAuth";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Gem,
  Lock,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

function formatPhoneInput(rawPhone: string) {
  const digits = rawPhone.replace(/\D/g, "").slice(0, 15);
  return digits ? `+${digits}` : "+";
}
const REGISTRATION_LOCKED_MESSAGE =
  "This demo website has limited access during the review period. Please use verified domain address";

function normalizePhoneNumber(rawPhone: string) {
  const digits = rawPhone.replace(/\D/g, "").slice(0, 15);
  return digits ? `+${digits}` : "";
}

function isValidPhoneNumber(phone: string) {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

function phoneToHiddenEmail(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `${digits}@goldenaxis60.member`;
}

export default function RegisterPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("+");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [withdrawPasscode, setWithdrawPasscode] = useState("");
  const [confirmWithdrawPasscode, setConfirmWithdrawPasscode] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [accepted, setAccepted] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [errorText, setErrorText] = useState("");
  const t = guestAuth.en;

  useEffect(() => {
    async function redirectIfLoggedIn() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!profileData) {
        await supabase.auth.signOut();
        return;
      }

if (
  profileData.role === "admin" ||
  profileData.role === "leader" ||
  profileData.role === "support"
) {
  router.replace("/admin/users");
} else {
  router.replace("/");
}
    }

    redirectIfLoggedIn();
  }, [router]);

function handleRegister(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setErrorText(REGISTRATION_LOCKED_MESSAGE);
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
              <p className="text-[11px] text-white/40">
                {t.register.memberRegistration}
              </p>
            </div>
          </div>

          <div className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[10px] font-bold text-yellow-100">
            {t.register.official}
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center px-5 pb-10">
          <div className="relative">
            <div className="absolute -top-24 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-yellow-400/10 blur-3xl" />

            <div className="relative mb-7 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-yellow-300/40 bg-gradient-to-br from-yellow-300/20 via-yellow-500/10 to-black shadow-[0_0_55px_rgba(234,179,8,0.28)]">
                <Gem className="h-10 w-10 text-yellow-300 drop-shadow-[0_0_18px_rgba(250,204,21,0.55)]" />
              </div>

              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[11px] font-bold text-yellow-100/80">
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                {t.register.officialMemberRegistration}
              </div>

              <h1 className="text-4xl font-black tracking-tight">
                {t.register.title}
              </h1>

              <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-white/50">
                {t.register.description}
              </p>
            </div>

            <form
              onSubmit={handleRegister}
              className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.065] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
            >
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-yellow-300/70 to-transparent" />

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-white/45">
                    Display Name
                  </span>

                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3.5 transition focus-within:border-yellow-400/60 focus-within:bg-black/60">
                    <UserRound className="h-5 w-5 text-yellow-300/80" />
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Gold Member"
                      autoComplete="name"
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                    />
                  </div>
                </label>

<label className="block">
  <span className="mb-2 block text-xs font-bold text-white/45">
    Phone Number
  </span>

  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3.5 transition focus-within:border-yellow-400/60 focus-within:bg-black/60">
    <Phone className="h-5 w-5 text-yellow-300/80" />

    <input
      value={phone}
      onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
      placeholder="+12345678"
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
    />
  </div>
</label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-white/45">
                    Password
                  </span>

                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3.5 transition focus-within:border-yellow-400/60 focus-within:bg-black/60">
                    <Lock className="h-5 w-5 text-yellow-300/80" />

                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
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
                    Confirm Password
                  </span>

                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3.5 transition focus-within:border-yellow-400/60 focus-within:bg-black/60">
                    <Lock className="h-5 w-5 text-yellow-300/80" />

                    <input
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Enter password again"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-white/45">
                    Withdraw Passcode
                  </span>

                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3.5 transition focus-within:border-yellow-400/60 focus-within:bg-black/60">
                    <Lock className="h-5 w-5 text-yellow-300/80" />

                    <input
                      value={withdrawPasscode}
                      onChange={(e) =>
                        setWithdrawPasscode(
                          e.target.value.replace(/\D/g, "").slice(0, 6)
                        )
                      }
                      placeholder="Create 6-digit passcode"
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
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
                      value={confirmWithdrawPasscode}
                      onChange={(e) =>
                        setConfirmWithdrawPasscode(
                          e.target.value.replace(/\D/g, "").slice(0, 6)
                        )
                      }
                      placeholder="Enter passcode again"
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="new-password"
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                    />
                  </div>
                </label>

                <label className="block">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="block text-xs font-bold text-white/45">
                      Referral Code
                    </span>
                    <span className="text-[10px] font-bold text-yellow-300/80">
                      Required
                    </span>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3.5 transition focus-within:border-yellow-400/60 focus-within:bg-black/60">
                    <Sparkles className="h-5 w-5 text-yellow-300/80" />
                    <input
                      value={referralCode}
                      onChange={(e) =>
                        setReferralCode(e.target.value.toUpperCase())
                      }
                      placeholder="Enter referral code"
                      autoComplete="off"
                      className="w-full bg-transparent text-sm uppercase tracking-wider text-white outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-white/25"
                    />
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/65">
                  <input
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-yellow-400"
                  />
                  <span className="leading-5">
                    I agree to the Golden Axis 60 member agreement, campaign
                    rules, and account review process.
                  </span>
                </label>

                {errorText && (
                  <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-100">
                    {errorText}
                  </div>
                )}

<button
  type="submit"
  className="group mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 px-5 py-4 font-black text-black shadow-[0_18px_45px_rgba(234,179,8,0.22)] transition active:scale-[0.98]"
>
  Registration Closed
  <Lock className="h-5 w-5" />
</button>
              </div>
            </form>

            <div className="mt-5 rounded-3xl border border-white/10 bg-black/25 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10">
                  <ShieldCheck className="h-5 w-5 text-emerald-300" />
                </div>

                <div>
<p className="text-sm font-bold text-white/85">
  Registration temporarily closed
</p>
<p className="mt-1 text-xs leading-5 text-white/45">
  New account creation is paused while this demo website is under limited review access.
</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-yellow-400/15 bg-yellow-400/5 px-4 py-3 text-xs text-yellow-100/65">
              <CheckCircle2 className="h-4 w-4 text-yellow-300" />A valid
              referral code is required to create a member account.
            </div>

            <p className="mt-6 text-center text-sm text-white/50">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-black text-yellow-300 transition hover:text-yellow-200"
              >
                Login
              </Link>
            </p>
          </div>
        </div>

        <div className="px-5 pb-5 text-center text-[11px] text-white/35">
          <p>© Golden Axis 60 · Official Member Portal</p>

          <div className="mt-2 flex items-center justify-center gap-3">
            <Link href="/terms" className="hover:text-yellow-300">
              Terms
            </Link>
            <span className="text-white/20">•</span>
            <Link href="/login" className="hover:text-yellow-300">
              Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}