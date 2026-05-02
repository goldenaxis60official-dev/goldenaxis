"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gem } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  async function handleLogin(e: React.FormEvent) {
  e.preventDefault();
  setErrorText("");
  setLoading(true);

  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !password) {
    setErrorText("Email and password are required.");
    setLoading(false);
    return;
  }

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) throw error;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Login succeeded, but user session was not found.");
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profileData) {
      throw new Error("Profile not found.");
    }

    if (profileData.role === "admin") {
      router.replace("/admin");
    } else {
      router.replace("/");
    }
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

          <h1 className="text-3xl font-black">Welcome Back</h1>
          <p className="mt-2 text-sm text-white/50">
            Login to continue your campaign missions.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl"
        >
          <div className="space-y-4">
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

            {errorText && (
              <p className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorText}
              </p>
            )}

            <button
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-white/50">
          New here?{" "}
          <Link href="/register" className="font-bold text-yellow-300">
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
}