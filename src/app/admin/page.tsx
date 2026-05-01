"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import {
  Crown,
  Users,
  Gem,
  ClipboardList,
  Wallet,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Headphones,
} from "lucide-react";

type AdminStats = {
  users: number;
  tasks: number;
  pendingRequests: number;
  completedTasks: number;
};

const adminCards = [
  {
    title: "Users",
    description: "View users, balance, step progress, and invite links.",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Tasks",
    description: "View and edit mission tasks.",
    href: "/admin/tasks",
    icon: Gem,
  },
  {
    title: "Sequence Builder",
    description: "Generate 1–80 mission ladder instantly.",
    href: "/admin/sequence-builder",
    icon: Crown,
  },
  {
    title: "Wallet Requests",
    description: "Approve or reject deposit and withdrawal requests.",
    href: "/admin/wallet-requests",
    icon: Wallet,
  },
  {
  title: "Support Messages",
  description: "Read user support messages and send admin replies.",
  href: "/admin/support",
  icon: Headphones,
},
];

export default function AdminPage() {
  return (
    <RequireAuth>
      {(profile) => <AdminContent profile={profile} />}
    </RequireAuth>
  );
}

function AdminContent({ profile }: { profile: Profile }) {
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats>({
    users: 0,
    tasks: 0,
    pendingRequests: 0,
    completedTasks: 0,
  });

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const isAdmin = profile.role === "admin";

  useEffect(() => {
    async function loadStats() {
      if (!isAdmin) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorText("");

      const [usersResult, tasksResult, requestsResult, historyResult] =
        await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("tasks").select("id", { count: "exact", head: true }),
          supabase
            .from("wallet_requests")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase
            .from("task_history")
            .select("id", { count: "exact", head: true }),
        ]);

      const firstError =
        usersResult.error ||
        tasksResult.error ||
        requestsResult.error ||
        historyResult.error;

      if (firstError) {
        setErrorText(firstError.message);
        setLoading(false);
        return;
      }

      setStats({
        users: usersResult.count || 0,
        tasks: tasksResult.count || 0,
        pendingRequests: requestsResult.count || 0,
        completedTasks: historyResult.count || 0,
      });

      setLoading(false);
    }

    loadStats();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <AppShell>
        <section className="px-5 pt-8">
          <div className="rounded-[2rem] border border-red-400/30 bg-red-500/10 p-6 text-center">
            <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-red-300" />
            <h1 className="text-2xl font-black">Admin Access Required</h1>
            <p className="mt-2 text-sm text-white/55">
              This page is only available for admin accounts.
            </p>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="px-5 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">Control Center</p>
            <h1 className="text-2xl font-black">Admin Dashboard</h1>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <Crown className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <div className="mb-5 rounded-[2rem] border border-yellow-400/20 bg-white/[0.06] p-5 backdrop-blur-xl">
          <p className="text-sm text-white/50">Logged in as</p>
          <h2 className="mt-1 text-2xl font-black">
            {profile.display_name || "Admin"}
          </h2>
          <p className="mt-2 text-sm text-yellow-300">
            Golden Axis 60 Admin Control
          </p>
        </div>

        {errorText && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="h-4 w-4" />
            {errorText}
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3">
          <StatBox label="Users" value={loading ? "..." : String(stats.users)} />
          <StatBox label="Tasks" value={loading ? "..." : String(stats.tasks)} />
          <StatBox
            label="Pending"
            value={loading ? "..." : String(stats.pendingRequests)}
          />
          <StatBox
            label="Completed"
            value={loading ? "..." : String(stats.completedTasks)}
          />
        </div>

        <div className="space-y-4 pb-6">
          {adminCards.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.title}
                onClick={() => router.push(item.href)}
                className="w-full rounded-[1.7rem] border border-white/10 bg-white/[0.06] p-4 text-left backdrop-blur-xl transition hover:border-yellow-400/40 hover:bg-yellow-400/10"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-300">
                      <Icon className="h-6 w-6" />
                    </div>

                    <div>
                      <h3 className="font-black">{item.title}</h3>
                      <p className="mt-1 text-sm text-white/50">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="h-5 w-5 shrink-0 text-white/35" />
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-1 text-2xl font-black text-yellow-300">{value}</p>
    </div>
  );
}