// src/app/verify-email/page.tsx

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gem, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function VerifyEmailPage() {
  const router = useRouter();

  useEffect(() => {
    async function redirectUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/register");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        await supabase.auth.signOut();
        router.replace("/register");
        return;
      }

      if (profile.role === "admin" || profile.role === "super") {
        router.replace("/admin");
        return;
      }

      if (profile.role === "support") {
        router.replace("/admin/support");
        return;
      }

      router.replace("/");
    }

    redirectUser();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center shadow-[0_22px_80px_rgba(0,0,0,0.55)]">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-yellow-300/30 bg-yellow-400/10">
          <Gem className="h-8 w-8 text-yellow-300" />
        </div>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-100/80">
          <ShieldCheck className="h-4 w-4 text-yellow-300" />
          Referral Verification Active
        </div>

        <h1 className="text-2xl font-black">Email verification disabled</h1>

        <p className="mt-3 text-sm leading-6 text-white/50">
          Golden Axis 60 now uses referral-code verification during registration.
          A valid referral code is required to create a member account.
        </p>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin text-yellow-300" />
          Redirecting...
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <Link href="/register" className="font-black text-yellow-300">
            Register
          </Link>
          <span className="text-white/20">•</span>
          <Link href="/login" className="font-black text-yellow-300">
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}