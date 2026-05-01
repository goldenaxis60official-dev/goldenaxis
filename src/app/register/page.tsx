"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gem } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { generateReferralCode } from "@/lib/referral";

export default function RegisterPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [accepted, setAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErrorText("");

    if (!accepted) {
      setErrorText("Please accept the platform agreement first.");
      return;
    }

    if (!email || !password) {
      setErrorText("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (signUpError) throw signUpError;

      const user = signUpData.user;

      if (!user) {
        throw new Error("Signup succeeded, but user session was not created.");
      }

      let referredBy: string | null = null;

      if (inviteCode.trim()) {
        const { data: referrerId, error: refError } = await supabase.rpc(
          "resolve_referral_code",
          {
            input_code: inviteCode.trim(),
          }
        );

        if (refError) throw refError;

        if (!referrerId) {
          throw new Error("Invalid invite code.");
        }

        referredBy = referrerId;
      }

      const myReferralCode = generateReferralCode();

      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        email,
        display_name: displayName || "Gold Member",
        referral_code: myReferralCode,
        referred_by: referredBy,
        terms_accepted: true,
        role: "user",
        balance: 0,
        today_earnings: 0,
        total_earnings: 0,
        current_step: 1,
        credit_score: 100,
        status: "active",
      });

      if (profileError) throw profileError;

      router.push("/");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setErrorText(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center border-x border-white/10 bg-[radial-gradient(circle_at_top,#2b2107_0%,#050505_45%,#000_100%)] px-5">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-400/40 bg-yellow-400/10 shadow-[0_0_35px_rgba(212,175,55,0.25)]">
            <Gem className="h-8 w-8 text-yellow-300" />
          </div>

          <h1 className="text-3xl font-black">Create Account</h1>
          <p className="mt-2 text-sm text-white/50">
            Join the Golden Axis 60 campaign simulation.
          </p>
        </div>

        <form
          onSubmit={handleRegister}
          className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl"
        >
          <div className="space-y-4">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display name"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none placeholder:text-white/35 focus:border-yellow-400/50"
            />

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              type="email"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none placeholder:text-white/35 focus:border-yellow-400/50"
            />

            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none placeholder:text-white/35 focus:border-yellow-400/50"
            />

            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Invite code optional"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 uppercase outline-none placeholder:normal-case placeholder:text-white/35 focus:border-yellow-400/50"
            />

            <label className="flex items-start gap-3 text-sm text-white/65">
              <input
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                type="checkbox"
                className="mt-1"
              />
              <span>
                I agree this platform uses promotional campaign credits and
                simulation rewards.
              </span>
            </label>

            {errorText && (
              <p className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorText}
              </p>
            )}

            <button
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-white/50">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-yellow-300">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}