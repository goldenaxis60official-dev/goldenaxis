//src>app>login>page.tsx

"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { guestAuth } from "@/i18n/guestAuth";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Crown,
  Eye,
  EyeOff,
  Gem,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const ADMIN_HOSTS = ["goldenaxisadmin.vercel.app"];

function isAdminEntrance() {
  if (typeof window === "undefined") return false;
  return ADMIN_HOSTS.includes(window.location.hostname);
}

function isControlRole(role?: string | null) {
  return role === "admin" || role === "super" || role === "support";
}

function getRoleRedirectPath(role?: string | null) {
  if (role === "support") return "/admin/support";
  if (role === "admin" || role === "super") return "/admin";
  return "/";
}

export default function LoginPage() {
  const router = useRouter();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [isAdminPortal, setIsAdminPortal] = useState(false);

const t = guestAuth.en;

useEffect(() => {
  setIsAdminPortal(isAdminEntrance());
}, []);


const PortalIcon = isAdminPortal ? Crown : Gem;

const portalLabel = isAdminPortal
  ? t.login.controlCenter
  : t.login.memberPortal;

const secureLabel = isAdminPortal
  ? t.common.restricted
  : t.common.secure;

const accessLabel = isAdminPortal
  ? t.login.controlAccess
  : t.login.officialAccess;

const titleText = isAdminPortal
  ? t.login.titleAdmin
  : t.login.titleMember;

const descriptionText = isAdminPortal
  ? t.login.descAdmin
  : t.login.descMember;

const securityTitle = isAdminPortal
  ? t.login.securityTitleAdmin
  : t.login.securityTitleMember;

const securityDescription = isAdminPortal
  ? t.login.securityDescAdmin
  : t.login.securityDescMember;

const footerText = isAdminPortal
  ? t.common.footerAdmin
  : t.common.footerMember;

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

    const role = profileData?.role;

    if (isAdminEntrance() && !isControlRole(role)) {
      await supabase.auth.signOut();
      setErrorText(
        "This control link is only for authorized control accounts. Please use the member website for normal access."
      );
      return;
    }

    router.replace(getRoleRedirectPath(role));
  }

  redirectIfLoggedIn();
}, [router]);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorText("");
    setLoading(true);

    const cleanLoginId = loginId.trim();

if (!cleanLoginId || !password) {
  setErrorText(t.login.errors.missingFields);
  setLoading(false);
  return;
}

let loginEmail = cleanLoginId.toLowerCase();

if (!cleanLoginId.includes("@")) {
  const { data: foundEmail, error: nameError } = await supabase.rpc(
    "get_email_by_display_name",
    {
      input_display_name: cleanLoginId,
    }
  );

  if (nameError || !foundEmail) {
    setErrorText(t.login.errors.cannotVerify);
    setLoading(false);
    return;
  }

  loginEmail = foundEmail.toLowerCase();
}

    try {
      const { error } = await supabase.auth.signInWithPassword({
  email: loginEmail,
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
        throw new Error(t.login.errors.profileNotFound);
      }

if (isAdminEntrance() && !isControlRole(profileData.role)) {
  await supabase.auth.signOut();
    setErrorText(t.login.errors.controlOnly);
  return;
}

router.replace(getRoleRedirectPath(profileData.role));
    } catch (err) {
      const message =
  err instanceof Error ? err.message : t.login.errors.unknown;

if (
  message.toLowerCase().includes("email not confirmed") ||
  message.toLowerCase().includes("not confirmed")
) {
  setErrorText(t.login.errors.notActivated);
  return;
}

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
              <PortalIcon className="h-5 w-5 text-yellow-300" />
            </div>

            <div>
              <p className="text-sm font-black tracking-wide">
                Golden Axis 60
              </p>
              <p className="text-[11px] text-white/40">{portalLabel}</p>
            </div>
          </div>

<div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold text-emerald-200">
  {secureLabel}
</div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col justify-center px-5 pb-10">
          <div className="relative">
            <div className="absolute -top-24 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-yellow-400/10 blur-3xl" />

            <div className="relative mb-8 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-yellow-300/40 bg-gradient-to-br from-yellow-300/20 via-yellow-500/10 to-black shadow-[0_0_55px_rgba(234,179,8,0.28)]">
                <PortalIcon className="h-10 w-10 text-yellow-300 drop-shadow-[0_0_18px_rgba(250,204,21,0.55)]" />
              </div>

              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[11px] font-bold text-yellow-100/80">
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                {accessLabel}
              </div>

              <h1 className="text-4xl font-black tracking-tight">
                {titleText}
              </h1>

              <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-white/50">
                {descriptionText}
              </p>
            </div>

            <form
              onSubmit={handleLogin}
              className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.065] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
            >
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-yellow-300/70 to-transparent" />

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-white/45">
                    {t.login.emailLabel}
                  </span>

                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3.5 transition focus-within:border-yellow-400/60 focus-within:bg-black/60">
                    <Mail className="h-5 w-5 text-yellow-300/80" />
                    <input
  value={loginId}
  onChange={(e) => setLoginId(e.target.value)}
  placeholder={t.login.emailPlaceholder}
  type="text"
  autoComplete="username"
  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
/>
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-white/45">
                    {t.login.passwordLabel}
                  </span>

                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3.5 transition focus-within:border-yellow-400/60 focus-within:bg-black/60">
                    <Lock className="h-5 w-5 text-yellow-300/80" />

                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.login.passwordPlaceholder}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
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
                      {t.login.loggingIn}
                    </>
                  ) : (
                    <>
                      {t.login.login}
                      <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
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
                    {securityTitle}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/45">
                   {securityDescription}
                  </p>
                </div>
              </div>
            </div>

            {!isAdminPortal && (
  <p className="mt-6 text-center text-sm text-white/50">
    {t.login.newHere}{" "}
    <Link
      href="/register"
      className="font-black text-yellow-300 transition hover:text-yellow-200"
    >
      {t.login.createAccount}
    </Link>
  </p>
)}

{isAdminPortal && (
  <p className="mt-6 text-center text-xs font-bold uppercase tracking-[0.24em] text-yellow-200/55">
    {t.login.authorizedOnly}
  </p>
)}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 text-center text-[11px] text-white/35">
  <p>{footerText}</p>

  <div className="mt-2 flex items-center justify-center gap-3">
    <Link href="/terms" className="hover:text-yellow-300">
      {t.common.terms}
    </Link>
    <span className="text-white/20">•</span>
    <Link href="/support" className="hover:text-yellow-300">
      {t.common.support}
    </Link>
  </div>
</div>
      </div>
    </main>
  );
}