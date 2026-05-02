//src>components>layout>BottomNav.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gem, User } from "lucide-react";

const navItems = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    label: "Missions",
    href: "/missions",
    icon: Gem,
    premium: true,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: User,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
      <div className="rounded-[2rem] border border-white/10 bg-black/80 p-2 shadow-[0_-18px_55px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl">
        <div className="grid grid-cols-3 gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "relative flex flex-col items-center justify-center gap-1 rounded-[1.35rem] px-3 py-3 transition active:scale-[0.96]",
                  active
                    ? "bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 text-black shadow-[0_0_30px_rgba(234,179,8,0.4)]"
                    : item.premium
                    ? "border border-yellow-400/20 bg-yellow-400/[0.06] text-yellow-200/70 hover:bg-yellow-400/10 hover:text-yellow-200"
                    : "text-white/45 hover:bg-white/[0.06] hover:text-white/80",
                ].join(" ")}
              >
                {item.premium && active && (
                  <span className="absolute inset-0 rounded-[1.35rem] bg-yellow-300/20 blur-xl" />
                )}

                <Icon
                  className={[
                    "relative z-10",
                    item.premium ? "h-6 w-6" : "h-5 w-5",
                    active && item.premium ? "drop-shadow-[0_0_8px_rgba(0,0,0,0.35)]" : "",
                  ].join(" ")}
                />

                <span className="relative z-10 text-[11px] font-black tracking-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}