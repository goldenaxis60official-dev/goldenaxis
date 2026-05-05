//app>profile>page.tsx

"use client";

import LuxuryCard from "@/components/ui/LuxuryCard";
import StatCard from "@/components/ui/StatCard";
import { getLanguage, messages, type Language } from "@/i18n";
import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types/profile";
import {
  User,
  Wallet,
  Download,
  Upload,
  History,
  Headphones,
  ShieldCheck,
  KeyRound,
  LogOut,
  ChevronRight,
  ClipboardList,
  Copy,
  CheckCircle,
  Gem,
  Languages,
  Send,
  MessageCircle,
} from "lucide-react";

const menuItems = [
  {
    key: "customerSupport",
    icon: Headphones,
    href: "/support",
    featured: true,
    danger: false,
    subtitleKey: "customerSupport",
  },
  {
    key: "depositCredits",
    icon: Upload,
    href: "/deposit",
    featured: false,
    danger: false,
    subtitleKey: null,
  },
  {
    key: "withdrawRequest",
    icon: Download,
    href: "/withdraw",
    featured: false,
    danger: false,
    subtitleKey: null,
  },
  {
    key: "depositRecord",
    icon: ClipboardList,
    href: "/wallet-records?type=deposit_credit",
    featured: false,
    danger: false,
    subtitleKey: null,
  },
  {
    key: "withdrawalRecord",
    icon: ClipboardList,
    href: "/wallet-records?type=withdrawal",
    featured: false,
    danger: false,
    subtitleKey: null,
  },
  {
    key: "taskHistory",
    icon: History,
    href: "/history",
    featured: false,
    danger: false,
    subtitleKey: null,
  },
  {
    key: "transactionDetails",
    icon: History,
    href: "/transactions",
    featured: false,
    danger: false,
    subtitleKey: null,
  },

  {
  key: "changePassword",
  icon: KeyRound,
  href: "/change-password",
  featured: false,
  danger: false,
  subtitleKey: null,
},
  {
  key: "withdrawPasscode",
  icon: ShieldCheck,
  href: "/withdraw-passcode",
  featured: false,
  danger: false,
  subtitleKey: null,
},
  {
    key: "termsSecurity",
    icon: ShieldCheck,
    href: "/terms",
    featured: false,
    danger: false,
    subtitleKey: null,
  },
  {
    key: "logout",
    icon: LogOut,
    href: "/login",
    featured: false,
    danger: true,
    subtitleKey: null,
  },
] as const;

export default function ProfilePage() {
  return (
    <RequireAuth>
      {(profile) => <ProfileContent profile={profile} />}
    </RequireAuth>
  );
}

function ProfileContent({ profile }: { profile: Profile }) {
  const router = useRouter();

  const [language, setLanguage] = useState<Language>(
    getLanguage(profile.language)
  );
  const [savingLanguage, setSavingLanguage] = useState(false);

  const t = messages[language];

const [assignedTotal, setAssignedTotal] = useState<number | null>(null);
const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (profile.role === "admin") {
      router.replace("/admin");
    }
  }, [profile.role, router]);

  useEffect(() => {
    async function loadAssignedCount() {
      const { count } = await supabase
        .from("user_task_assignments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("is_active", true);

      setAssignedTotal(count || 0);
    }

    if (profile.role === "user") {
      loadAssignedCount();
    }
  }, [profile.id, profile.role]);

async function handleLanguageChange(nextLanguage: Language) {
  if (nextLanguage === language || savingLanguage) return;

  const oldLanguage = language;

  setLanguage(nextLanguage);
  setSavingLanguage(true);

  const { error } = await supabase
    .from("profiles")
    .update({ language: nextLanguage })
    .eq("id", profile.id);

  if (error) {
  console.error("Language update failed:", error.message);
  alert(error.message);
  setLanguage(oldLanguage);
  setSavingLanguage(false);
  return;
}

localStorage.setItem("golden_axis_language", nextLanguage);
window.dispatchEvent(
  new CustomEvent("golden-axis-language-change", {
    detail: nextLanguage,
  })
);

setSavingLanguage(false);
}

  async function handleMenuClick(item: (typeof menuItems)[number]) {
    if (item.key === "logout") {
      await supabase.auth.signOut();
      router.replace("/login");
      return;
    }

    router.push(item.href);
  }

  async function copyReferralCode() {
  if (!profile.referral_code) return;

  await navigator.clipboard.writeText(profile.referral_code);
  setCopied(true);

  setTimeout(() => {
    setCopied(false);
  }, 1500);
}

function openTelegramSupport() {
  window.open("https://t.me/goldenaxis60", "_blank", "noopener,noreferrer");
}

  if (profile.role === "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-yellow-300 border-t-transparent" />
          <p className="text-sm text-white/60">{t.profile.openingAdmin}</p>
        </div>
      </main>
    );
  }

  const completedCount = Math.max(profile.current_step - 1, 0);
  const missionTotalText =
    assignedTotal === null ? "..." : assignedTotal > 0 ? assignedTotal : "-";

  return (
    <AppShell>
      <section className="px-5 pb-32 pt-8">
                <LuxuryCard goldGlow className="mb-5 p-5">
          <div className="flex items-center gap-4">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.7rem] border border-yellow-400/40 bg-yellow-400/10 shadow-[0_0_35px_rgba(212,175,55,0.2)]">
              <div className="absolute inset-0 rounded-[1.7rem] bg-yellow-300/15 blur-xl" />
              <User className="relative h-10 w-10 text-yellow-300" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]" />
                <p className="text-xs font-bold text-emerald-200">
                  {t.profile.accountCenterOnline}
                </p>
              </div>

              <h1 className="truncate text-2xl font-black">
                {profile.display_name || t.profile.goldMember}
              </h1>

              <p className="mt-1 truncate text-sm text-white/50">
                {profile.email || t.profile.goldenAxisUser}
              </p>

              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-200">
                <Gem className="h-3.5 w-3.5" />
                {t.profile.goldenAxisMember}
              </div>
            </div>
          </div>
        </LuxuryCard>

        <LuxuryCard goldGlow className="mb-6 p-5">
  <div className="mb-5 flex items-center justify-between">
    <div>
      <p className="text-sm text-white/50">{t.profile.campaignBalance}</p>
      <h2 className="mt-1 text-3xl font-black">
        ${Number(profile.balance).toFixed(2)}
      </h2>
    </div>

    <div className="rounded-2xl bg-gradient-to-br from-yellow-300 to-yellow-600 p-3 text-black">
      <Wallet className="h-7 w-7" />
    </div>
  </div>

  <div className="grid grid-cols-3 gap-3 text-center">
    <button
      type="button"
      onClick={copyReferralCode}
      className="rounded-[1.25rem] border border-yellow-400/25 bg-yellow-400/10 px-3 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_25px_rgba(0,0,0,0.25)] active:scale-[0.98]"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-yellow-100/60">Referral Code</p>

        {copied ? (
          <CheckCircle className="h-3.5 w-3.5 text-emerald-300" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-white/35" />
        )}
      </div>

      <p className="mt-1 truncate font-black text-yellow-300">
        {profile.referral_code}
      </p>
    </button>

    <StatCard
      label={t.profile.today}
      value={`$${Number(profile.today_earnings).toFixed(2)}`}
      color="green"
    />

    <StatCard
      label={t.profile.missions}
      value={`${completedCount}/${missionTotalText}`}
      color="blue"
    />
  </div>

  {copied && (
    <p className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-center text-xs text-emerald-200">
      Referral code copied
    </p>
  )}
</LuxuryCard>

        <button
          type="button"
          onClick={openTelegramSupport}
          className="group mb-6 w-full overflow-hidden rounded-[1.7rem] border border-sky-400/25 bg-gradient-to-br from-sky-500/20 via-cyan-400/10 to-yellow-400/10 p-[1px] text-left shadow-[0_18px_45px_rgba(0,0,0,0.35),0_0_35px_rgba(56,189,248,0.12)] active:scale-[0.985]"
        >
          <div className="relative overflow-hidden rounded-[1.65rem] bg-[#071018]/95 px-5 py-4">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-sky-400/20 blur-2xl" />
            <div className="absolute -bottom-10 left-8 h-24 w-24 rounded-full bg-yellow-300/10 blur-2xl" />

            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-300 to-cyan-600 text-white shadow-[0_0_30px_rgba(56,189,248,0.35)]">
                <Send className="h-6 w-6" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
                    24/7 Online
                  </span>
                  <span className="text-xs font-bold text-sky-200">
                    Telegram
                  </span>
                </div>

                <h3 className="text-base font-black text-white">
                  Chat with official support
                </h3>

                <p className="mt-1 text-xs leading-relaxed text-white/55">
                  Need faster help? Contact our official Telegram support at{" "}
                  <span className="font-bold text-sky-200">@goldenaxis60</span>.
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition group-hover:border-sky-300/40 group-hover:text-sky-200">
                <MessageCircle className="h-5 w-5" />
              </div>
            </div>
          </div>
        </button>

<div className="mb-6 flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-2">
  <div className="flex items-center gap-2 px-3 text-xs font-bold text-white/55">
    <Languages className="h-4 w-4 text-yellow-300" />
    {t.profile.language}
  </div>

  <div className="flex rounded-2xl bg-black/35 p-1">
    <button
      type="button"
      disabled={savingLanguage}
      onClick={() => handleLanguageChange("en")}
      className={`rounded-xl px-4 py-2 text-xs font-black transition ${
        language === "en"
          ? "bg-yellow-300 text-black shadow-[0_0_18px_rgba(250,204,21,0.25)]"
          : "text-white/50 hover:text-white"
      }`}
    >
      {t.profile.english}
    </button>

    <button
      type="button"
      disabled={savingLanguage}
      onClick={() => handleLanguageChange("zh")}
      className={`rounded-xl px-4 py-2 text-xs font-black transition ${
        language === "zh"
          ? "bg-yellow-300 text-black shadow-[0_0_18px_rgba(250,204,21,0.25)]"
          : "text-white/50 hover:text-white"
      }`}
    >
      {t.profile.chinese}
    </button>
  </div>
</div>

<div className="mb-6 grid grid-cols-2 gap-3">
  <StatCard
    label={t.profile.totalEarnings}
    value={`$${Number(profile.total_earnings).toFixed(2)}`}
    color="gold"
  />

  <StatCard
    label={t.profile.creditScore}
    value={String(profile.credit_score)}
    color="green"
  />
</div>

        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-black">{t.profile.memberCenter}</h3>
          <span className="text-xs font-bold text-yellow-300">
            {t.profile.secureTools}
          </span>
        </div>

        <LuxuryCard className="mb-8 overflow-hidden p-0">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
  key={item.key}
  onClick={() => handleMenuClick(item)}
  className={`flex w-full items-center justify-between border-b border-white/10 px-5 py-4 text-left transition active:scale-[0.99] last:border-b-0 hover:bg-white/[0.035] ${
    item.featured
      ? "bg-gradient-to-r from-yellow-400/20 via-yellow-400/10 to-transparent"
      : ""
  }`}
>
  <div className="flex items-center gap-3">
  <div
  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
    item.danger
      ? "bg-red-500/10 text-red-300"
      : item.featured
      ? "bg-gradient-to-br from-yellow-300 to-yellow-600 text-black shadow-[0_0_25px_rgba(234,179,8,0.35)]"
      : "bg-yellow-400/10 text-yellow-300"
  }`}
>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="text-left">
  <span
    className={`font-medium ${
      item.danger
        ? "text-red-200"
        : item.featured
        ? "font-black text-yellow-200"
        : "text-white/80"
    }`}
  >
    {t.profile.menu[item.key]}
  </span>

  {item.subtitleKey && (
  <p
    className={`mt-0.5 text-xs ${
      item.featured ? "text-yellow-100/60" : "text-white/40"
    }`}
  >
    {t.profile.menuSubtitles[item.subtitleKey]}
  </p>
)}

</div>
                </div>

                <ChevronRight className="h-5 w-5 text-white/35" />
              </button>
            );
          })}
        </LuxuryCard>
      </section>
    </AppShell>
  );
}