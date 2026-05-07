//src>app>admin>AdminNav.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { en } from "@/i18n/en";
import { zh } from "@/i18n/zh";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import { canAccessAdminPath } from "@/lib/adminPermissions";
import {
  AlertCircle,
  Headphones,
  KeyRound,
  Landmark,
  Languages,
  Loader2,
  LogOut,
  Save,
  Users,
  Wallet,
  X,
} from "lucide-react";

type Language = "en" | "zh";
type AdminNavText = typeof en.adminNav;

type AdminNavProps = {
  language?: Language;
  profile?: Profile | null;
};

function getAdminLinks(t: AdminNavText) {
  return [
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

export default function AdminNav({ language, profile }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    language || "en"
  );

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountLoading, setAccountLoading] = useState(false);
  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");

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

  const actionText =
    currentLanguage === "zh"
      ? {
          changePassword: "修改密码",
          newPassword: "新密码",
          confirmPassword: "确认密码",
          newPasswordPlaceholder: "输入新密码",
          confirmPasswordPlaceholder: "再次输入新密码",
          passwordMinError: "密码至少需要 6 个字符。",
          passwordMismatchError: "两次输入的密码不一致。",
          passwordUpdated: "密码已更新。",
          languageUpdated: "语言已更新。",
          updatePassword: "更新密码",
          updating: "更新中...",
          security: "安全设置",
          logout: "退出登录",
          english: "English",
          chinese: "中文",
        }
      : {
          changePassword: "Change Password",
          newPassword: "New Password",
          confirmPassword: "Confirm Password",
          newPasswordPlaceholder: "Enter new password",
          confirmPasswordPlaceholder: "Repeat new password",
          passwordMinError: "Password must be at least 6 characters.",
          passwordMismatchError: "Passwords do not match.",
          passwordUpdated: "Password updated successfully.",
          languageUpdated: "Language updated.",
          updatePassword: "Update Password",
          updating: "Updating...",
          security: "Security",
          logout: "Logout",
          english: "English",
          chinese: "中文",
        };

  const adminLinks = getAdminLinks(t);

  const visibleLinks = profile
    ? adminLinks.filter((item) => canAccessAdminPath(profile.role, item.href))
    : adminLinks;

  async function handleLanguageChange(nextLanguage: Language) {
    setErrorText("");
    setSuccessText("");
    setCurrentLanguage(nextLanguage);

    localStorage.setItem("golden-axis-language", nextLanguage);
    window.dispatchEvent(new Event("golden-axis-language-change"));

    if (!profile) return;

    const { error } = await supabase
      .from("profiles")
      .update({ language: nextLanguage })
      .eq("id", profile.id);

    if (error) {
      setErrorText(error.message);
      return;
    }

    setSuccessText(actionText.languageUpdated);
  }

  async function handleChangePassword() {
    setErrorText("");
    setSuccessText("");

    if (newPassword.length < 6) {
      setErrorText(actionText.passwordMinError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorText(actionText.passwordMismatchError);
      return;
    }

    setAccountLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setErrorText(error.message);
      setAccountLoading(false);
      return;
    }

    setSuccessText(actionText.passwordUpdated);
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordModal(false);
    setAccountLoading(false);
  }

  async function handleLogout() {
    setAccountLoading(true);
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <>
      <div className="mb-8 rounded-[1.7rem] border border-yellow-400/20 bg-white/[0.045] p-3 shadow-[0_0_35px_rgba(212,175,55,0.08)]">
        <div className="mb-3 flex flex-col gap-3 px-2 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-300">
              Golden Axis 60
            </p>
            <h2 className="text-lg font-black text-white">{t.title}</h2>

            {profile && (
              <p className="mt-1 text-xs text-white/40">
                {profile.email || profile.display_name || "Control account"} •{" "}
                {profile.role}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-2 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-xs font-black text-yellow-300 hover:bg-yellow-400/15"
            >
              <KeyRound className="h-4 w-4" />
              {actionText.changePassword}
            </button>

            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
              <Languages className="h-4 w-4 text-yellow-300" />

              <select
                value={currentLanguage}
                onChange={(event) =>
                  handleLanguageChange(event.target.value as Language)
                }
                className="bg-transparent text-xs font-black text-yellow-200 outline-none"
              >
                <option className="bg-[#090909] text-white" value="en">
                  {actionText.english}
                </option>
                <option className="bg-[#090909] text-white" value="zh">
                  {actionText.chinese}
                </option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={accountLoading}
              className="flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs font-black text-red-300 hover:bg-red-500/15 disabled:opacity-60"
            >
              {accountLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              {actionText.logout}
            </button>
          </div>
        </div>

        {(errorText || successText) && (
          <div
            className={`mb-3 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${
              errorText
                ? "border-red-400/30 bg-red-500/10 text-red-200"
                : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
            }`}
          >
            {errorText ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {errorText || successText}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {visibleLinks.map((item) => {
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

      {showPasswordModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-yellow-400/20 bg-[#090909] p-6 shadow-[0_0_60px_rgba(212,175,55,0.16)]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-200/80">
                  {actionText.security}
                </p>
                <h2 className="text-2xl font-black text-white">
                  {actionText.changePassword}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="rounded-2xl bg-white/10 p-3 text-white/70"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-bold text-white/80">
                  {actionText.newPassword}
                </p>
                <input
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  type="password"
                  placeholder={actionText.newPasswordPlaceholder}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-bold text-white/80">
                  {actionText.confirmPassword}
                </p>
                <input
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type="password"
                  placeholder={actionText.confirmPasswordPlaceholder}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
                />
              </div>

              <button
                type="button"
                onClick={handleChangePassword}
                disabled={accountLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:opacity-60"
              >
                <Save className="h-5 w-5" />
                {accountLoading ? actionText.updating : actionText.updatePassword}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}