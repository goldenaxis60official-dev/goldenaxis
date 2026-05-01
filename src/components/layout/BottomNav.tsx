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
    <nav className="fixed bottom-0 left-1/2 z-50 grid w-full max-w-md -translate-x-1/2 grid-cols-3 border-t border-white/10 bg-black/90 px-6 pb-5 pt-3 backdrop-blur-xl">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 transition ${
              active ? "text-yellow-300" : "text-white/55"
            }`}
          >
            <Icon className="h-6 w-6" />
            <span className="text-xs">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}