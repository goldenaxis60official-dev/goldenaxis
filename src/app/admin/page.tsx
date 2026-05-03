//src>app>admin>page.tsx

"use client";

import { useEffect, useState } from "react";
import { en } from "@/i18n/en";
import { zh } from "@/i18n/zh";
import Link from "next/link";
import RequireAuth from "@/components/auth/RequireAuth";
import AdminNav from "./AdminNav";
import { supabase } from "@/lib/supabaseClient";
import { canAccessAdminPath } from "@/lib/adminPermissions";
import type { Profile } from "@/types/profile";
import {
  AlertCircle,
  ArrowRight,
  ClipboardList,
  Crown,
  Headphones,
  ListChecks,
  Package,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

type AdminStats = {
  users: number;
  activeTasks: number;
  products: number;
  assignedTasks: number;
  pendingRequests: number;
  completedTasks: number;
};

type AdminDashboardText = (typeof en)["adminDashboard"];

function getAdminCards(t: AdminDashboardText) {
  return [
    {
      title: t.cards.productCatalog.title,
      description: t.cards.productCatalog.description,
      href: "/admin/products",
      icon: Package,
      tag: t.cards.productCatalog.tag,
    },
    {
      title: t.cards.taskLibrary.title,
      description: t.cards.taskLibrary.description,
      href: "/admin/tasks",
      icon: ClipboardList,
      tag: t.cards.taskLibrary.tag,
    },
    {
      title: t.cards.userTaskAssignment.title,
      description: t.cards.userTaskAssignment.description,
      href: "/admin/user-tasks",
      icon: ListChecks,
      tag: t.cards.userTaskAssignment.tag,
    },
    {
      title: t.cards.userManager.title,
      description: t.cards.userManager.description,
      href: "/admin/users",
      icon: Users,
      tag: t.cards.userManager.tag,
    },
    {
      title: t.cards.walletRequests.title,
      description: t.cards.walletRequests.description,
      href: "/admin/wallet-requests",
      icon: Wallet,
      tag: t.cards.walletRequests.tag,
    },
    {
      title: t.cards.supportMessages.title,
      description: t.cards.supportMessages.description,
      href: "/admin/support",
      icon: Headphones,
      tag: t.cards.supportMessages.tag,
    },
  ];
}

export default function AdminPage() {
  return (
    <RequireAuth>
      {(profile) => <AdminContent profile={profile} />}
    </RequireAuth>
  );
}

function AdminContent({ profile }: { profile: Profile }) {

  const currentLanguage = profile.language === "zh" ? "zh" : "en";
  const [stats, setStats] = useState<AdminStats>({
    users: 0,
    activeTasks: 0,
    products: 0,
    assignedTasks: 0,
    pendingRequests: 0,
    completedTasks: 0,
  });

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const hasDashboardAccess = canAccessAdminPath(profile.role, "/admin");

const t: AdminDashboardText =
  currentLanguage === "zh"
    ? (zh.adminDashboard as unknown as AdminDashboardText)
    : en.adminDashboard;

const adminCards = getAdminCards(t);

const visibleAdminCards = adminCards.filter((item) =>
  canAccessAdminPath(profile.role, item.href)
);

  useEffect(() => {
    async function loadStats() {
      if (!hasDashboardAccess) {
  setLoading(false);
  return;
}

      setLoading(true);
      setErrorText("");

      const [
        usersResult,
        tasksResult,
        productsResult,
        assignmentsResult,
        requestsResult,
        historyResult,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),

        supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),

        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),

        supabase
          .from("user_task_assignments")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),

        supabase
          .from("wallet_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),

        supabase.from("task_history").select("id", {
          count: "exact",
          head: true,
        }),
      ]);

      const firstError =
        usersResult.error ||
        tasksResult.error ||
        productsResult.error ||
        assignmentsResult.error ||
        requestsResult.error ||
        historyResult.error;

      if (firstError) {
        setErrorText(firstError.message);
        setLoading(false);
        return;
      }

      setStats({
        users: usersResult.count || 0,
        activeTasks: tasksResult.count || 0,
        products: productsResult.count || 0,
        assignedTasks: assignmentsResult.count || 0,
        pendingRequests: requestsResult.count || 0,
        completedTasks: historyResult.count || 0,
      });

      setLoading(false);
    }

    loadStats();
  }, [hasDashboardAccess]);

  if (!hasDashboardAccess) {
    return (
      <main className="min-h-screen bg-[#050505] p-6 text-white">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-red-400/30 bg-red-500/10 p-8 text-center">
          <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-red-300" />
          <h1 className="text-2xl font-black">{t.accessRequiredTitle}</h1>
<p className="mt-2 text-sm text-white/55">
  {t.accessRequiredDescription}
</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <AdminNav profile={profile} language={currentLanguage} />

        <div className="mb-8 flex items-center justify-between gap-5">
          <div>
            <p className="text-sm font-bold text-yellow-200/80">
  {t.controlCenter}
</p>
<h1 className="mt-1 text-3xl font-black">{t.title}</h1>
<p className="mt-2 max-w-2xl text-sm text-white/50">
  {t.description}
</p>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4">
            <Crown className="h-7 w-7 text-yellow-300" />
          </div>
        </div>

        <div className="mb-6 rounded-[2rem] border border-yellow-400/20 bg-white/[0.045] p-5">
  <p className="text-sm text-white/45">{t.loggedInAs}</p>

  <div className="mt-2 flex items-center justify-between gap-4">
  <div>
    <h2 className="text-2xl font-black">
      {profile.display_name || t.fallbackName}
    </h2>

    <p className="mt-1 text-sm text-yellow-300">
      {t.adminControl}
    </p>

    <p className="mt-1 text-xs text-white/40">
      {profile.email || t.noEmail} • {profile.role}
    </p>
  </div>

</div>
</div>

        {errorText && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="h-4 w-4" />
            {errorText}
          </div>
        )}

        <div className="mb-8 grid grid-cols-6 gap-4">
          <StatCard label={t.stats.users} value={loading ? "..." : String(stats.users)} />
          <StatCard
            label={t.stats.products}
            value={loading ? "..." : String(stats.products)}
          />
          <StatCard
            label={t.stats.taskLibrary}
            value={loading ? "..." : String(stats.activeTasks)}
          />
          <StatCard
            label={t.stats.assigned}
            value={loading ? "..." : String(stats.assignedTasks)}
          />
          <StatCard
            label={t.stats.pendingWallet}
            value={loading ? "..." : String(stats.pendingRequests)}
          />
          <StatCard
            label={t.stats.completed}
            value={loading ? "..." : String(stats.completedTasks)}
          />
        </div>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-200/80">{t.modules}</p>
<h2 className="text-2xl font-black">{t.controlPages}</h2>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {visibleAdminCards.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-[1.7rem] border border-white/10 bg-black/25 p-5 transition hover:border-yellow-400/40 hover:bg-yellow-400/10"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-300">
                      <Icon className="h-6 w-6" />
                    </div>

                    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white/50">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-black">{item.title}</h3>

                  <p className="mt-2 min-h-[66px] text-sm leading-6 text-white/50">
                    {item.description}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="text-sm font-bold text-yellow-300">
                      {t.openPage}
                    </span>
                    <ArrowRight className="h-5 w-5 text-white/35 transition group-hover:translate-x-1 group-hover:text-yellow-300" />
                  </div>
                </Link>
              );
            })}
          </div>
                </section>

      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-1 truncate text-xl font-black text-yellow-300">
        {value}
      </p>
    </div>
  );
}