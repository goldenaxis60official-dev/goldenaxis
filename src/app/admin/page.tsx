//src>app>admin>page.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/components/auth/RequireAuth";
import { canAccessAdminPath } from "@/lib/adminPermissions";
import type { Profile } from "@/types/profile";

export default function AdminPage() {
  return (
    <RequireAuth>
      {(profile) => <AdminRedirect profile={profile} />}
    </RequireAuth>
  );
}

function AdminRedirect({ profile }: { profile: Profile }) {
  const router = useRouter();

  useEffect(() => {
    if (canAccessAdminPath(profile.role, "/admin/users")) {
      router.replace("/admin/users");
      return;
    }

    if (canAccessAdminPath(profile.role, "/admin/wallet-requests")) {
      router.replace("/admin/wallet-requests");
      return;
    }

    if (canAccessAdminPath(profile.role, "/admin/wallet-addresses")) {
      router.replace("/admin/wallet-addresses");
      return;
    }

    if (canAccessAdminPath(profile.role, "/admin/support")) {
      router.replace("/admin/support");
      return;
    }

    router.replace("/login");
  }, [profile.role, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
      <div className="rounded-2xl border border-yellow-400/20 bg-white/[0.05] px-6 py-5 text-center">
        <p className="text-sm font-bold text-yellow-300">Golden Axis 60</p>
        <p className="mt-2 text-sm text-white/55">Opening admin control...</p>
      </div>
    </main>
  );
}