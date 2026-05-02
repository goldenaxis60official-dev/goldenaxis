import BottomNav from "./BottomNav";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto min-h-screen max-w-md overflow-x-hidden border-x border-white/10 bg-[radial-gradient(circle_at_top,#3a2a08_0%,#111005_28%,#050505_58%,#000_100%)] pb-28 shadow-[0_0_80px_rgba(0,0,0,0.65)]">
        {children}

        <BottomNav />
      </div>
    </main>
  );
}