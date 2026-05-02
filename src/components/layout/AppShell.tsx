import BottomNav from "./BottomNav";
import { ShieldCheck } from "lucide-react";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto min-h-screen max-w-md overflow-x-hidden border-x border-white/10 bg-[radial-gradient(circle_at_top,#3a2a08_0%,#111005_28%,#050505_58%,#000_100%)] pb-28 shadow-[0_0_80px_rgba(0,0,0,0.65)]">
        <div className="mx-5 mt-4 rounded-[1.4rem] border border-yellow-400/20 bg-gradient-to-r from-yellow-400/10 to-white/[0.035] px-4 py-3 shadow-[0_0_25px_rgba(212,175,55,0.08)] backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-300">
              <ShieldCheck className="h-4 w-4" />
            </div>

            <div>
              <p className="text-xs font-black text-yellow-100">
                Secure Campaign Review
              </p>
              <p className="mt-0.5 text-[11px] leading-4 text-yellow-100/55">
                Campaign credits and wallet requests require admin review.
              </p>
            </div>
          </div>
        </div>

        {children}

        <BottomNav />
      </div>
    </main>
  );
}