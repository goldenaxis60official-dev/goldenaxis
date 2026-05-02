"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import LuxuryCard from "@/components/ui/LuxuryCard";
import StatCard from "@/components/ui/StatCard";
import type { Profile } from "@/types/profile";
import {
  Gem,
  Crown,
  Wallet,
  Users,
  ShieldCheck,
  Headphones,
  Sparkles,
  Trophy,
  PlayCircle,
} from "lucide-react";

const quickActions = [
  { label: "Start Mission", icon: PlayCircle, href: "/missions" },
  { label: "VIP Badge", icon: Crown, href: "/terms" },
  { label: "Deposit Credits", icon: Wallet, href: "/deposit" },
  { label: "Team Invite", icon: Users, href: "/team" },
  { label: "Security", icon: ShieldCheck, href: "/terms" },
  { label: "Support", icon: Headphones, href: "/support" },
];

const sampleTasks = [
  {
    title: "Royal Gold Ring Campaign",
    type: "Standard",
    price: "$120.00",
    reward: "$0.10",
  },
  {
    title: "Diamond Jewel Bonus",
    type: "Lucky Bonus",
    price: "$1,400.00",
    reward: "2x Reward",
  },
  {
    title: "Luxury Watch Promotion",
    type: "Standard",
    price: "$260.00",
    reward: "$0.21",
  },
];

export default function HomePage() {
  return (
    <RequireAuth>
      {(profile) => <HomeContent profile={profile} />}
    </RequireAuth>
  );
}

function HomeContent({ profile }: { profile: Profile }) {
  const router = useRouter();

  useEffect(() => {
    if (profile.role === "admin") {
      router.replace("/admin");
    }
  }, [profile.role, router]);

  if (profile.role === "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-yellow-300 border-t-transparent" />
          <p className="text-sm text-white/60">Opening admin control...</p>
        </div>
      </main>
    );
  }

  return (
    <AppShell>
      <section className="relative px-5 pb-6 pt-8">
        <div className="absolute right-6 top-8 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs text-yellow-200">
          Credit Score {profile.credit_score}
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-400/40 bg-yellow-400/10 shadow-[0_0_25px_rgba(212,175,55,0.25)]">
            <Gem className="h-6 w-6 text-yellow-300" />
          </div>

          <div>
            <p className="text-sm text-yellow-200/80">Welcome back</p>
            <h1 className="text-2xl font-bold tracking-tight">
              {profile.display_name || "Gold Member"}
            </h1>
          </div>
        </div>

        <LuxuryCard goldGlow className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-white/55">Total Campaign Balance</p>
              <h2 className="mt-1 text-4xl font-black tracking-tight">
                ${Number(profile.balance).toFixed(2)}
              </h2>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-yellow-300 to-yellow-600 p-3 text-black">
              <Wallet className="h-7 w-7" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StatCard
  label="Today"
  value={`$${Number(profile.today_earnings).toFixed(2)}`}
  color="green"
/>
            <StatCard
  label="Mission"
  value={`${profile.current_step - 1} / 80`}
  color="gold"
/>
            <StatCard label="Team" value="0" color="blue" />
          </div>
        </LuxuryCard>
      </section>

      <section className="px-5">
        <LuxuryCard className="flex items-center gap-2 px-4 py-3 text-sm text-white/75">
          <Sparkles className="h-4 w-4 text-yellow-300" />
          Complete luxury campaign missions and unlock premium jewel rewards.
        </LuxuryCard>
      </section>

      <section className="px-5 py-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">Quick Access</h3>
          <span className="text-xs text-yellow-300">VIP Campaign</span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {quickActions.map((item) => {
            const Icon = item.icon;

            return (
              <button
  key={item.label}
  onClick={() => router.push(item.href)}
  className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 text-center shadow-xl backdrop-blur-xl transition hover:border-yellow-400/40 hover:bg-yellow-400/10"
>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-300 to-yellow-700 text-black">
                  <Icon className="h-6 w-6" />
                </div>

                <p className="text-xs font-medium text-white/80">
                  {item.label}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="px-5 pb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">Mission Preview</h3>

          <div className="flex items-center gap-1 text-xs text-yellow-300">
            <Trophy className="h-4 w-4" />
            Step 1
          </div>
        </div>

        <div className="space-y-3">
          {sampleTasks.map((task) => {
            const lucky = task.type === "Lucky Bonus";

            return (
              <LuxuryCard
                key={task.title}
                goldGlow={lucky}
                className={`p-4 ${lucky ? "bg-yellow-400/10" : ""}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                          lucky
                            ? "bg-yellow-400 text-black"
                            : "bg-white/10 text-white/70"
                        }`}
                      >
                        {task.type}
                      </span>
                    </div>

                    <h4 className="font-bold">{task.title}</h4>
                    <p className="mt-1 text-sm text-white/50">
                      Product Value {task.price}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-white/50">Reward</p>
                    <p className="font-black text-yellow-300">{task.reward}</p>
                  </div>
                </div>
              </LuxuryCard>
            );
          })}
        </div>
      </section>
                </AppShell>
  );
}