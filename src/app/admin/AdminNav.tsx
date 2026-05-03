"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { en } from "@/i18n/en";
import { zh } from "@/i18n/zh";
import {
  LayoutDashboard,
  Package,
  ListChecks,
  Users,
  Wallet,
  Headphones,
  ClipboardList,
  Landmark,
} from "lucide-react";

type Language = "en" | "zh";
type AdminNavText = typeof en.adminNav;

type AdminNavProps = {
  language?: Language;
};

function getAdminLinks(t: AdminNavText) {
  return [
    {
      label: t.dashboard,
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: t.products,
      href: "/admin/products",
      icon: Package,
    },
    {
      label: t.taskLibrary,
      href: "/admin/tasks",
      icon: ClipboardList,
    },
    {
      label: t.userTasks,
      href: "/admin/user-tasks",
      icon: ListChecks,
    },
    {
      label: t.users,
      href: "/admin/users",
      icon: Users,
    },
    {
      label: t.wallet,
      href: "/admin/wallet-requests",
      icon: Wallet,
    },
    {
      label: t.walletAddresses,
      href: "/admin/wallet-addresses",
      icon: Landmark,
    },
    {
      label: t.support,
      href: "/admin/support",
      icon: Headphones,
    },
  ];
}

export default function AdminNav({ language }: AdminNavProps) {
  const pathname = usePathname();

  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    language || "en"
  );

  useEffect(() => {
    if (language) {
      setCurrentLanguage(language);
      return;
    }

    const savedLanguage = localStorage.getItem("golden-axis-language");

    if (savedLanguage === "zh" || savedLanguage === "en") {
      setCurrentLanguage(savedLanguage);
    }

    function handleLanguageChange() {
      const updatedLanguage = localStorage.getItem("golden-axis-language");

      if (updatedLanguage === "zh" || updatedLanguage === "en") {
        setCurrentLanguage(updatedLanguage);
      }
    }

    window.addEventListener(
      "golden-axis-language-change",
      handleLanguageChange
    );

    return () => {
      window.removeEventListener(
        "golden-axis-language-change",
        handleLanguageChange
      );
    };
  }, [language]);

  const t: AdminNavText =
    currentLanguage === "zh"
      ? (zh.adminNav as unknown as AdminNavText)
      : en.adminNav;

  const adminLinks = getAdminLinks(t);

  return (
    <div className="mb-8 rounded-[1.7rem] border border-yellow-400/20 bg-white/[0.045] p-3 shadow-[0_0_35px_rgba(212,175,55,0.08)]">
      <div className="mb-3 px-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-300">
          Golden Axis 60
        </p>
        <h2 className="text-lg font-black text-white">{t.title}</h2>
      </div>

      <div className="grid grid-cols-4 gap-2 xl:grid-cols-8">
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