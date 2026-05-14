//src>components>layout>AppShell.tsx

"use client";

import { useEffect, type ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import BottomNav from "./BottomNav";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  useEffect(() => {
    let mounted = true;

    async function touchLastSeen() {
      if (!mounted) return;
      await supabase.rpc("touch_last_seen");
    }

    touchLastSeen();

    const interval = window.setInterval(() => {
      touchLastSeen();
    }, 60000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <main className="min-h-dvh bg-[#050505] text-[#f8f5ea]">
      <div className="relative mx-auto min-h-dvh max-w-md overflow-x-hidden border-x border-yellow-400/10 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.22)_0%,rgba(58,42,8,0.42)_24%,rgba(5,5,5,0.96)_58%,#000_100%)] pb-[calc(7rem+env(safe-area-inset-bottom))] shadow-[0_0_90px_rgba(0,0,0,0.75)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),transparent_22%,rgba(0,0,0,0.35)_100%)]" />
        <div className="relative z-10">{children}</div>

        <BottomNav />
      </div>
    </main>
  );
}