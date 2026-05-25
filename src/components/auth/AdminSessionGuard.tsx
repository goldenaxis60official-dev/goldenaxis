"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { isAdminRole } from "@/lib/adminPermissions";
import type { Profile } from "@/types/profile";

const ADMIN_SESSION_STARTED_AT_KEY = "golden-axis-admin-session-started-at";
const ADMIN_SESSION_LIMIT_MS = 12 * 60 * 60 * 1000;

type AdminSessionGuardProps = {
  profile: Profile;
  children: React.ReactNode;
};

export default function AdminSessionGuard({
  profile,
  children,
}: AdminSessionGuardProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    async function checkAdminSession() {
      if (!isAdminRole(profile.role)) {
        router.replace("/login");
        return;
      }

      const now = Date.now();
      const savedStartedAt = localStorage.getItem(
        ADMIN_SESSION_STARTED_AT_KEY
      );

      const startedAt = savedStartedAt ? Number(savedStartedAt) : NaN;

      if (!Number.isFinite(startedAt) || startedAt <= 0) {
        localStorage.setItem(ADMIN_SESSION_STARTED_AT_KEY, String(now));

        if (!cancelled) {
          setChecking(false);
        }

        timeoutId = setTimeout(async () => {
          localStorage.removeItem(ADMIN_SESSION_STARTED_AT_KEY);
          await supabase.auth.signOut();
          router.replace("/login");
        }, ADMIN_SESSION_LIMIT_MS);

        return;
      }

      const sessionAge = now - startedAt;

      if (sessionAge >= ADMIN_SESSION_LIMIT_MS) {
        localStorage.removeItem(ADMIN_SESSION_STARTED_AT_KEY);
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      const remainingTime = ADMIN_SESSION_LIMIT_MS - sessionAge;

      timeoutId = setTimeout(async () => {
        localStorage.removeItem(ADMIN_SESSION_STARTED_AT_KEY);
        await supabase.auth.signOut();
        router.replace("/login");
      }, remainingTime);

      if (!cancelled) {
        setChecking(false);
      }
    }

    checkAdminSession();

    return () => {
      cancelled = true;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [profile.role, router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="rounded-2xl border border-yellow-400/20 bg-white/[0.05] px-6 py-5 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-yellow-300 border-t-transparent" />
          <p className="text-sm font-bold text-yellow-300">Golden Axis 60</p>
          <p className="mt-2 text-sm text-white/55">
            Checking admin session...
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}