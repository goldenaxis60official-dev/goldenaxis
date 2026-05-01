import BottomNav from "./BottomNav";
import { ShieldCheck } from "lucide-react";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto min-h-screen max-w-md overflow-hidden border-x border-white/10 bg-[radial-gradient(circle_at_top,#2b2107_0%,#050505_45%,#000_100%)] pb-24">
        <div className="mx-5 mt-4 flex items-center gap-2 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-xs text-yellow-100/80">
          <ShieldCheck className="h-4 w-4 shrink-0 text-yellow-300" />
          <span>
            Campaign credit simulation. Wallet requests require admin review.
          </span>
        </div>

        {children}

        <BottomNav />
      </div>
    </main>
  );
}