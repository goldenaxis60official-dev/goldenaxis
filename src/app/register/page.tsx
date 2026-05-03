//src>app>register>page.tsx

"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Gem,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [accepted, setAccepted] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

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

    if (profileData?.role === "admin") {
      router.replace("/admin");
    } else {
      router.replace("/");
    }
  }

  redirectIfLoggedIn();
}, [router]);

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setErrorText("");

  if (!accepted) {
    setErrorText("Please accept the member agreement first.");
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanDisplayName = displayName.trim();

if (!cleanDisplayName) {
  setErrorText("Display name is required.");
  return;
}
  const cleanReferralCode = referralCode.trim().toUpperCase();

  if (!cleanEmail || !password) {
    setErrorText("Email and password are required.");
    return;
  }

  if (password.length < 6) {
    setErrorText("Password must be at least 6 characters.");
    return;
  }

  setLoading(true);

  try {
    localStorage.setItem(
  "ga60_pending_signup",
  JSON.stringify({
    email: cleanEmail,
    displayName: cleanDisplayName,
    referralCode: cleanReferralCode,
  })
);

    const { error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
        data: {
  display_name: cleanDisplayName,
  referral_code: cleanReferralCode,
},
      },
    });

    if (signUpError) throw signUpError;

    router.replace(`/verify-email?email=${encodeURIComponent(cleanEmail)}`);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Something went wrong.";
    setErrorText(message);
  } finally {
    setLoading(false);
  }
}

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col overflow-hidden border-x border-white/10 bg-[radial-gradient(circle_at_top,#3a2a08_0%,#0b0903_34%,#050505_72%,#000_100%)]">
        {/* Top brand bar */}
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-yellow-400/30 bg-yellow-400/10 shadow-[0_0_30px_rgba(234,179,8,0.22)]">
              <Gem className="h-5 w-5 text-yellow-300" />
            </div>

            <div>
              <p className="text-sm font-black tracking-wide">
                Golden Axis 60
              </p>
              <p className="text-[11px] text-white/40">Member Registration</p>
            </div>
          </div>

          <div className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[10px] font-bold text-yellow-100">
            Official
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col justify-center px-5 pb-10">
          <div className="relative">
            <div className="absolute -top-24 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-yellow-400/10 blur-3xl" />

            <div className="relative mb-7 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-yellow-300/40 bg-gradient-to-br from-yellow-300/20 via-yellow-500/10 to-black shadow-[0_0_55px_rgba(234,179,8,0.28)]">
                <Gem className="h-10 w-10 text-yellow-300 drop-shadow-[0_0_18px_rgba(250,204,21,0.55)]" />
              </div>

              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[11px] font-bold text-yellow-100/80">
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                Official Member Registration
              </div>

              <h1 className="text-4xl font-black tracking-tight">
                Create Account
              </h1>

              <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-white/50">
                Create your Golden Axis 60 member account to access assigned
campaign tasks, account records, referral benefits, and support.
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
                    Email Address
                  </span>

                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3.5 transition focus-within:border-yellow-400/60 focus-within:bg-black/60">
                    <Mail className="h-5 w-5 text-yellow-300/80" />
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      type="email"
                      autoComplete="email"
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
  <div className="mb-2 flex items-center justify-between gap-3">
    <span className="block text-xs font-bold text-white/45">
      Referral Code
    </span>
    <span className="text-[10px] font-bold text-white/30">
      Optional
    </span>
  </div>

  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3.5 transition focus-within:border-yellow-400/60 focus-within:bg-black/60">
    <Sparkles className="h-5 w-5 text-yellow-300/80" />
    <input
      value={referralCode}
      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
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
                    I agree to the Golden Axis 60 member agreement, campaign rules,
and account review process.
                  </span>
                </label>

                {errorText && (
                  <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-100">
                    {errorText}
                  </div>
                )}

                <button
                  disabled={loading}
                  className="group mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 px-5 py-4 font-black text-black shadow-[0_18px_45px_rgba(234,179,8,0.22)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                    </>
                  )}
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
                   Member account setup
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/45">
                    Your account is created securely and may be reviewed for normal
platform protection.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-yellow-400/15 bg-yellow-400/5 px-4 py-3 text-xs text-yellow-100/65">
              <CheckCircle2 className="h-4 w-4 text-yellow-300" />
              Referral code is optional and can be entered during registration.
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

        {/* Footer */}
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
