//admin>AdminNav.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ListChecks,
  Users,
  Wallet,
  Headphones,
  Crown,
  ClipboardList,
  Landmark,
} from "lucide-react";

const adminLinks = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    label: "Task Library",
    href: "/admin/tasks",
    icon: ClipboardList,
  },
  {
    label: "User Tasks",
    href: "/admin/user-tasks",
    icon: ListChecks,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Wallet",
    href: "/admin/wallet-requests",
    icon: Wallet,
  },
  {
  label: "Wallet Addresses",
  href: "/admin/wallet-addresses",
  icon: Landmark,
  },
  {
    label: "Support",
    href: "/admin/support",
    icon: Headphones,
  },
  {
    label: "Sequence",
    href: "/admin/sequence-builder",
    icon: Crown,
  },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="mb-8 rounded-[1.7rem] border border-yellow-400/20 bg-white/[0.045] p-3 shadow-[0_0_35px_rgba(212,175,55,0.08)]">
      <div className="mb-3 px-2">
  <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-300">
    Golden Axis 60
  </p>
  <h2 className="text-lg font-black text-white">Admin Control</h2>
</div>

      <div className="grid grid-cols-4 gap-2 xl:grid-cols-9">
        {adminLinks.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-black transition ${
                active
                  ? "border-yellow-400/40 bg-yellow-400/15 text-yellow-300"
                  : "border-white/10 bg-black/25 text-white/55 hover:bg-white/[0.07] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}