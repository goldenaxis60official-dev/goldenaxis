"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlayCircle, User } from "lucide-react";

const navItems = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    label: "Missions",
    href: "/missions",
    icon: PlayCircle,
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
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-yellow-400/10 bg-black/90 px-5 pb-5 pt-3 shadow-[0_-20px_45px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
      <div className="grid grid-cols-3 gap-2 rounded-[1.7rem] border border-white/10 bg-white/[0.045] p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-2 transition ${
                active
                  ? "bg-gradient-to-br from-yellow-300 to-yellow-600 text-black shadow-[0_0_22px_rgba(250,204,21,0.28)]"
                  : "text-white/50 hover:bg-white/[0.06] hover:text-white/80"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}