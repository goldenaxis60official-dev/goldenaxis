"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RequireAuth from "@/components/auth/RequireAuth";
import AdminNav from "./AdminNav";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import {
  AlertCircle,
  ArrowRight,
  ClipboardList,
  Crown,
  Headphones,
  KeyRound,
  ListChecks,
  LogOut,
  Package,
  Save,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";

type AdminStats = {
  users: number;
  activeTasks: number;
  products: number;
  assignedTasks: number;
  pendingRequests: number;
  completedTasks: number;
};

const adminCards = [
  {
    title: "Product Catalog",
    description:
      "Create and manage gold/jewel products, gallery images, prices, ratings, reviews, and descriptions.",
    href: "/admin/products",
    icon: Package,
    tag: "Catalog",
  },
  {
    title: "Task Library",
    description:
      "Connect product templates to task logic, reward rules, commission rate, and lucky bonus type.",
    href: "/admin/tasks",
    icon: ClipboardList,
    tag: "Templates",
  },
  {
    title: "User Task Assignment",
    description:
      "Assign custom campaign mission lists to each user from 1 to 80 tasks.",
    href: "/admin/user-tasks",
    icon: ListChecks,
    tag: "Personalized",
  },
  {
    title: "User Manager",
    description:
      "View users, balances, invite codes, account status, and current campaign progress.",
    href: "/admin/users",
    icon: Users,
    tag: "Members",
  },
  {
    title: "Wallet Requests",
    description:
      "Approve or reject user deposit credit and withdrawal requests.",
    href: "/admin/wallet-requests",
    icon: Wallet,
    tag: "Finance",
  },
  {
    title: "Support Messages",
    description:
      "Read user support tickets",
    href: "/admin/support",
    icon: Headphones,
    tag: "Support",
  },
  {
    title: "Sequence Builder",
    description:
      "Legacy global task generator. Use carefully because product catalog is now the main system.",
    href: "/admin/sequence-builder",
    icon: Crown,
    tag: "Legacy",
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

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountLoading, setAccountLoading] = useState(false);
  const [successText, setSuccessText] = useState("");
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

  const isAdmin = profile.role === "admin";

  useEffect(() => {
    async function loadStats() {
      if (!isAdmin) {
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
  }, [isAdmin]);

    async function handleChangePassword() {
    setErrorText("");
    setSuccessText("");

    if (newPassword.length < 6) {
      setErrorText("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorText("Passwords do not match.");
      return;
    }

    setAccountLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setErrorText(error.message);
      setAccountLoading(false);
      return;
    }

    setSuccessText("Password updated successfully.");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordModal(false);
    setAccountLoading(false);
  }

  async function handleLogout() {
    setAccountLoading(true);
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#050505] p-6 text-white">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-red-400/30 bg-red-500/10 p-8 text-center">
          <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-red-300" />
          <h1 className="text-2xl font-black">Admin Access Required</h1>
          <p className="mt-2 text-sm text-white/55">
            This page is only available for admin accounts.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <AdminNav />

        <div className="mb-8 flex items-center justify-between gap-5">
          <div>
            <p className="text-sm font-bold text-yellow-200/80">
              Control Center
            </p>
            <h1 className="mt-1 text-3xl font-black">Admin Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Web control panel for product catalog, task library, user task
              assignment, wallet requests, and support messages.
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4">
            <Crown className="h-7 w-7 text-yellow-300" />
          </div>
        </div>

        <div className="mb-6 rounded-[2rem] border border-yellow-400/20 bg-white/[0.045] p-5">
  <p className="text-sm text-white/45">Logged in as</p>

  <div className="mt-2 flex items-center justify-between gap-4">
    <div>
      <h2 className="text-2xl font-black">
        {profile.display_name || "Admin"}
      </h2>
      <p className="mt-1 text-sm text-yellow-300">
        Golden Axis 60 Admin Control
      </p>
      <p className="mt-1 text-xs text-white/40">
        {profile.email || "No email"} • {profile.role}
      </p>
    </div>

    <div className="flex items-center gap-3">
      <button
        onClick={() => setShowPasswordModal(true)}
        className="flex items-center gap-2 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-3 text-sm font-black text-yellow-300 hover:bg-yellow-400/15"
      >
        <KeyRound className="h-4 w-4" />
        Change Password
      </button>

      <button
        onClick={handleLogout}
        disabled={accountLoading}
        className="flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-3 text-sm font-black text-red-300 hover:bg-red-500/15 disabled:opacity-60"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </div>
  </div>
</div>

        {errorText && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="h-4 w-4" />
            {errorText}
          </div>
        )}

        {successText && (
  <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
    <Save className="h-4 w-4" />
    {successText}
  </div>
)}

        <div className="mb-8 grid grid-cols-6 gap-4">
          <StatCard label="Users" value={loading ? "..." : String(stats.users)} />
          <StatCard
            label="Products"
            value={loading ? "..." : String(stats.products)}
          />
          <StatCard
            label="Task Library"
            value={loading ? "..." : String(stats.activeTasks)}
          />
          <StatCard
            label="Assigned"
            value={loading ? "..." : String(stats.assignedTasks)}
          />
          <StatCard
            label="Pending Wallet"
            value={loading ? "..." : String(stats.pendingRequests)}
          />
          <StatCard
            label="Completed"
            value={loading ? "..." : String(stats.completedTasks)}
          />
        </div>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-200/80">Admin Modules</p>
              <h2 className="text-2xl font-black">Control Pages</h2>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {adminCards.map((item) => {
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
                      Open Page
                    </span>
                    <ArrowRight className="h-5 w-5 text-white/35 transition group-hover:translate-x-1 group-hover:text-yellow-300" />
                  </div>
                </Link>
              );
            })}
          </div>
                </section>

        {showPasswordModal && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-[2rem] border border-yellow-400/20 bg-[#090909] p-6 shadow-[0_0_60px_rgba(212,175,55,0.16)]">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-200/80">Admin Security</p>
                  <h2 className="text-2xl font-black">Change Password</h2>
                </div>

                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="rounded-2xl bg-white/10 p-3 text-white/70"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-bold text-white/80">
                    New Password
                  </p>
                  <input
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    type="password"
                    placeholder="Enter new password"
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm font-bold text-white/80">
                    Confirm Password
                  </p>
                  <input
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
                  />
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={accountLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:opacity-60"
                >
                  <Save className="h-5 w-5" />
                  {accountLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </div>
          </div>
        )}
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