//components>layout>BottomNav.tsx

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Home, Gem, User } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { getLanguage, messages, type Language } from "@/i18n";

const navItems = [
  {
    key: "home",
    href: "/",
    icon: Home,
    premium: false,
  },
  {
    key: "missions",
    href: "/missions",
    icon: Gem,
    premium: true,
  },
  {
    key: "profile",
    href: "/profile",
    icon: User,
    premium: false,
  },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    let mounted = true;

    const cachedLanguage = localStorage.getItem("golden_axis_language");
    if (cachedLanguage) {
      setLanguage(getLanguage(cachedLanguage));
    }

    async function loadLanguage() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !mounted) return;

      const { data } = await supabase
        .from("profiles")
        .select("language")
        .eq("id", user.id)
        .single();

      if (!mounted) return;

      const nextLanguage = getLanguage(data?.language);
      setLanguage(nextLanguage);
      localStorage.setItem("golden_axis_language", nextLanguage);
    }

    function handleLanguageChange(event: Event) {
      const customEvent = event as CustomEvent<Language>;
      const nextLanguage = getLanguage(customEvent.detail);

      setLanguage(nextLanguage);
      localStorage.setItem("golden_axis_language", nextLanguage);
    }

    loadLanguage();

    window.addEventListener(
      "golden-axis-language-change",
      handleLanguageChange
    );

    return () => {
      mounted = false;
      window.removeEventListener(
        "golden-axis-language-change",
        handleLanguageChange
      );
    };
  }, []);

  const t = messages[language];

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
                    active && item.premium
                      ? "drop-shadow-[0_0_8px_rgba(0,0,0,0.35)]"
                      : "",
                  ].join(" ")}
                />

                <span className="relative z-10 text-[11px] font-black tracking-tight">
                  {t.bottomNav[item.key]}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}