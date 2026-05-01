"use client";

import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
  User,
  Wallet,
  Download,
  Upload,
  History,
  Users,
  Headphones,
  ShieldCheck,
  LogOut,
  ChevronRight,
  ClipboardList,
  Crown,
} from "lucide-react";

const menuItems = [
  { label: "Deposit Credits", icon: Upload },
  { label: "Withdraw Request", icon: Download },
  { label: "Deposit Record", icon: ClipboardList },
  { label: "Withdrawal Record", icon: ClipboardList },
  { label: "Task History", icon: History },
  { label: "Transaction Details", icon: History },
  { label: "Team Invite", icon: Users },
  { label: "Customer Support", icon: Headphones },
  { label: "Terms & Security", icon: ShieldCheck },
  { label: "Logout", icon: LogOut },
];

export default function ProfilePage() {
  const router = useRouter();

  async function handleMenuClick(label: string) {

if (label === "Team Invite") {
  router.push("/team");
  return;
}

if (label === "Deposit Credits") {
  router.push("/deposit");
  return;
}

if (label === "Withdraw Request") {
  router.push("/withdraw");
  return;
}

if (label === "Deposit Record") {
  router.push("/wallet-records?type=deposit_credit");
  return;
}

if (label === "Withdrawal Record") {
  router.push("/wallet-records?type=withdrawal");
  return;
}

if (label === "Transaction Details") {
  router.push("/transactions");
  return;
}

if (label === "Task History") {
  router.push("/history");
  return;
}

if (label === "Customer Support") {
  router.push("/support");
  return;
}

if (label === "Terms & Security") {
  router.push("/terms");
  return;
}

if (label === "Logout") {
  await supabase.auth.signOut();
  router.push("/login");
}
  }

  return (
    <RequireAuth>
      {(profile) => (
        <AppShell>
          <section className="px-5 pt-8">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-yellow-400/40 bg-yellow-400/10 shadow-[0_0_35px_rgba(212,175,55,0.2)]">
                <User className="h-12 w-12 text-yellow-300" />
              </div>

              <h1 className="text-2xl font-black">
                {profile.display_name || "Gold Member"}
              </h1>
              <p className="mt-1 text-sm text-white/50">
                {profile.email || "Golden Axis User"}
              </p>
            </div>

            <div className="mb-6 rounded-[2rem] border border-yellow-400/20 bg-white/[0.06] p-5 backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Account Balance</p>
                  <h2 className="mt-1 text-3xl font-black">
                    ${Number(profile.balance).toFixed(2)}
                  </h2>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-yellow-300 to-yellow-600 p-3 text-black">
                  <Wallet className="h-7 w-7" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-black/30 p-3">
                  <p className="text-xs text-white/45">Invite Code</p>
                  <p className="mt-1 font-black text-yellow-300">
                    {profile.referral_code}
                  </p>
                </div>

                <div className="rounded-2xl bg-black/30 p-3">
                  <p className="text-xs text-white/45">Today</p>
                  <p className="mt-1 font-black text-emerald-300">
                    ${Number(profile.today_earnings).toFixed(2)}
                  </p>
                </div>

                <div className="rounded-2xl bg-black/30 p-3">
                  <p className="text-xs text-white/45">Step</p>
                  <p className="mt-1 font-black text-blue-300">
                    {profile.current_step}/80
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] backdrop-blur-xl">
              {profile.role === "admin" && (
  <button
    onClick={() => router.push("/admin")}
    className="flex w-full items-center justify-between border-b border-white/10 px-5 py-4"
  >
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-300">
        <Crown className="h-5 w-5" />
      </div>

      <span className="font-medium text-yellow-300">Admin Panel</span>
    </div>

    <ChevronRight className="h-5 w-5 text-white/35" />
  </button>
)}
              {menuItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    onClick={() => handleMenuClick(item.label)}
                    className="flex w-full items-center justify-between border-b border-white/10 px-5 py-4 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-300">
                        <Icon className="h-5 w-5" />
                      </div>

                      <span className="font-medium text-white/80">
                        {item.label}
                      </span>
                    </div>

                    <ChevronRight className="h-5 w-5 text-white/35" />
                  </button>
                );
              })}
            </div>
          </section>
        </AppShell>
      )}
    </RequireAuth>
  );
}