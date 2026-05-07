//app>admin>users>page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { en } from "@/i18n/en";
import { zh } from "@/i18n/zh";
import RequireAuth from "@/components/auth/RequireAuth";
import GenerateOrdersModal from "./components/GenerateOrdersModal";
import LuckyOrderModal from "./components/LuckyOrderModal";
import ViewOrdersModal from "./components/ViewOrdersModal";
import ResetOrdersModal from "./components/ResetOrdersModal";
import SecurityResetModal from "./components/SecurityResetModal";
import AdjustBalanceModal from "./components/AdjustBalanceModal";
import DeleteUserModal from "./components/DeleteUserModal";
import NicknameModal from "./components/NicknameModal";
import ReferralCodeModal from "./components/ReferralCodeModal";
import ReferralBonusModal from "./components/ReferralBonusModal";
import AdminNav from "../AdminNav";
import { supabase } from "@/lib/supabaseClient";
import { canAccessAdminPath } from "@/lib/adminPermissions";
import type { Profile } from "@/types/profile";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Crown,
  Eye,
  RotateCcw,
  PackagePlus,
  Pencil,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";

type ManagedUser = Profile & {
  admin_nickname: string | null;
};

type LuckyProductOption = {
  id: string;
  name: string;
  price: number;
  category: string;
  main_image: string | null;
};

type GeneratedOrderItemPreview = {
  id: string;
  product_snapshot: {
    name?: string;
    main_image?: string | null;
    category?: string;
    custom_lucky_amount?: string | number;
  };
  unit_price: number;
  quantity: number;
  subtotal: number;
};

type GeneratedOrderPreview = {
  id: string;
  step_number: number;
  order_total: number;
  profit_rate: number;
  profit_amount: number;
  order_type: "normal" | "lucky";
  status: "pending" | "completed" | "cancelled";
  is_lucky_bonus: boolean;
  created_at: string;
  completed_at: string | null;
  user_generated_order_items?: GeneratedOrderItemPreview[];
};

type AdminUsersText = typeof en.adminUsers;

export default function AdminUsersPage() {
  return (
    <RequireAuth>
      {(profile) => <AdminUsersContent profile={profile} />}
    </RequireAuth>
  );
}

function AdminUsersContent({ profile }: { profile: Profile }) {
  const currentLanguage = profile.language === "zh" ? "zh" : "en";

  const t: AdminUsersText =
    currentLanguage === "zh"
      ? (zh.adminUsers as unknown as AdminUsersText)
      : en.adminUsers;

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState<
  "all" | "user" | "admin" | "super" | "support"
>("all");
const [statusFilter, setStatusFilter] = useState("all");
const [sortBy, setSortBy] = useState<
  "newest" | "name" | "balance_high" | "today_high" | "step_high"
>("newest");
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(10);
const [minBalanceFilter, setMinBalanceFilter] = useState("");
const [maxBalanceFilter, setMaxBalanceFilter] = useState("");
const [minStepFilter, setMinStepFilter] = useState("");
const [maxStepFilter, setMaxStepFilter] = useState("");
const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
const [nicknameUser, setNicknameUser] = useState<ManagedUser | null>(null);
const [nicknameValue, setNicknameValue] = useState("");

const [referralUser, setReferralUser] = useState<ManagedUser | null>(null);
const [referralValue, setReferralValue] = useState("");
const [referralBonusUser, setReferralBonusUser] =
  useState<ManagedUser | null>(null);
const [referralBonusAmount, setReferralBonusAmount] = useState(0);

const [deleteUser, setDeleteUser] = useState<ManagedUser | null>(null);
const [deleteConfirmText, setDeleteConfirmText] = useState("");
const [securityUser, setSecurityUser] = useState<ManagedUser | null>(null);
const [resetPassword, setResetPassword] = useState("");
const [resetPasscode, setResetPasscode] = useState("");
const [resetResult, setResetResult] = useState("");
const [generateUser, setGenerateUser] = useState<ManagedUser | null>(null);
const [generateTaskCount, setGenerateTaskCount] = useState(60);
const [generateCapitalAmount, setGenerateCapitalAmount] = useState(500);
const [generateProfitRate, setGenerateProfitRate] = useState(0.08);
const [generateResetExisting, setGenerateResetExisting] = useState(true);
const [luckyUser, setLuckyUser] = useState<ManagedUser | null>(null);
const [luckyProducts, setLuckyProducts] = useState<LuckyProductOption[]>([]);
const [luckyStepNumber, setLuckyStepNumber] = useState(25);
const [luckyProductId, setLuckyProductId] = useState("");
const [luckyAmount, setLuckyAmount] = useState(2800);
const [luckyProfitRate, setLuckyProfitRate] = useState(5);
const [viewOrdersUser, setViewOrdersUser] = useState<ManagedUser | null>(null);
const [viewOrders, setViewOrders] = useState<GeneratedOrderPreview[]>([]);
const [viewOrdersLoading, setViewOrdersLoading] = useState(false);
const [resetOrdersUser, setResetOrdersUser] = useState<ManagedUser | null>(null);
const [resetOrdersConfirmText, setResetOrdersConfirmText] = useState("");
const [resetOrdersResetStep, setResetOrdersResetStep] = useState(true);

  const [adjustAmount, setAdjustAmount] = useState(100);
  const [adjustNote, setAdjustNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");

  const hasPageAccess = canAccessAdminPath(profile.role, "/admin/users");
const isFullControlRole = profile.role === "admin" || profile.role === "super";
const isSupportRole = profile.role === "support";
const canUseUserTools = isFullControlRole || isSupportRole;

const canManageOrders = canUseUserTools;
const canManageMoney = canUseUserTools;
const canManageSecurity = canUseUserTools;

const canDeleteUsers = isFullControlRole;
const canEditUserInfo = isFullControlRole;

  async function loadUsers() {
  setLoading(true);
  setErrorText("");

  const [profilesResult, notesResult] = await Promise.all([
    supabase
  .from("profiles")
  .select("*")
  .neq("status", "deleted")
  .order("created_at", { ascending: false }),

    supabase.from("admin_user_notes").select("user_id, nickname"),
  ]);

  if (profilesResult.error) {
    setErrorText(profilesResult.error.message);
    setLoading(false);
    return;
  }

  if (notesResult.error) {
    setErrorText(notesResult.error.message);
    setLoading(false);
    return;
  }

  const noteMap = new Map(
    ((notesResult.data || []) as { user_id: string; nickname: string | null }[]).map(
      (note) => [note.user_id, note.nickname]
    )
  );

  const mergedUsers = ((profilesResult.data || []) as Profile[]).map((user) => ({
    ...user,
    admin_nickname: noteMap.get(user.id) || null,
  }));

  setUsers(mergedUsers);
  setLoading(false);
}

  useEffect(() => {
    if (hasPageAccess) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [hasPageAccess]);

  const userStatuses = useMemo(() => {
  return Array.from(
    new Set(users.map((user) => user.status).filter(Boolean))
  );
}, [users]);

const filteredUsers = useMemo(() => {
  const keyword = searchText.toLowerCase().trim();

  const result = users.filter((user) => {
    const matchesSearch =
      !keyword ||
      user.display_name?.toLowerCase().includes(keyword) ||
      user.email?.toLowerCase().includes(keyword) ||
      user.admin_nickname?.toLowerCase().includes(keyword) ||
      user.referral_code?.toLowerCase().includes(keyword) ||
user.member_id?.toLowerCase().includes(keyword) ||
user.id.toLowerCase().includes(keyword);

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    const matchesStatus =
  statusFilter === "all" || user.status === statusFilter;

const displayBalance = getDisplayBalance(user);
const currentStep = Number(user.current_step || 0);

const matchesMinBalance =
  !minBalanceFilter || displayBalance >= Number(minBalanceFilter);

const matchesMaxBalance =
  !maxBalanceFilter || displayBalance <= Number(maxBalanceFilter);

const matchesMinStep =
  !minStepFilter || currentStep >= Number(minStepFilter);

const matchesMaxStep =
  !maxStepFilter || currentStep <= Number(maxStepFilter);

return (
  matchesSearch &&
  matchesRole &&
  matchesStatus &&
  matchesMinBalance &&
  matchesMaxBalance &&
  matchesMinStep &&
  matchesMaxStep
);
  });

  return [...result].sort((a, b) => {
    if (sortBy === "name") {
      return (a.display_name || "").localeCompare(b.display_name || "");
    }

    if (sortBy === "balance_high") {
      return Number(b.balance || 0) - Number(a.balance || 0);
    }

    if (sortBy === "today_high") {
      return Number(b.today_earnings || 0) - Number(a.today_earnings || 0);
    }

    if (sortBy === "step_high") {
      return Number(b.current_step || 0) - Number(a.current_step || 0);
    }

    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
}, [
  users,
  searchText,
  roleFilter,
  statusFilter,
  sortBy,
  minBalanceFilter,
  maxBalanceFilter,
  minStepFilter,
  maxStepFilter,
]);

const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

const paginatedUsers = useMemo(() => {
  const start = (currentPage - 1) * pageSize;
  return filteredUsers.slice(start, start + pageSize);
}, [filteredUsers, currentPage, pageSize]);

const firstResult =
  filteredUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;

const lastResult = Math.min(currentPage * pageSize, filteredUsers.length);

useEffect(() => {
  setCurrentPage(1);
}, [
  searchText,
  roleFilter,
  statusFilter,
  sortBy,
  pageSize,
  minBalanceFilter,
  maxBalanceFilter,
  minStepFilter,
  maxStepFilter,
]);

useEffect(() => {
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }
}, [currentPage, totalPages]);

function formatMoney(value: number | null | undefined) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function shortId(value: string) {
  if (!value) return "-";
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function getDisplayBalance(user: ManagedUser) {
  const separatedBalance =
    Number(user.deposited_balance || 0) +
    Number(user.referral_bonus_balance || 0) +
    Number(user.task_profit_balance || 0);

  return separatedBalance > 0 ? separatedBalance : Number(user.balance || 0);
}

function escapeCsv(value: string | number | null | undefined) {
  const cleanValue = String(value ?? "").replaceAll('"', '""');
  return `"${cleanValue}"`;
}

function exportUsersToCsv() {
  const headers = [
    "Name",
    "Email",
    "ID",
    "Phone",
    "Nickname",
    "Role",
    "Status",
    "Total Balance",
    "Deposited Balance",
    "Referral Bonus",
    "Task Profit",
    "Today Earnings",
    "Total Earnings",
    "Current Step",
    "Credit Score",
    "Referral Code",
    "Language",
    "Created At",
  ];

  const rows = filteredUsers.map((user) => [
    user.display_name || "",
    user.email || "",
    user.member_id || user.id,
    user.phone || "",
    user.admin_nickname || "",
    user.role,
    user.status,
    getDisplayBalance(user).toFixed(2),
    Number(user.deposited_balance || 0).toFixed(2),
    Number(user.referral_bonus_balance || 0).toFixed(2),
    Number(user.task_profit_balance || 0).toFixed(2),
    Number(user.today_earnings || 0).toFixed(2),
    Number(user.total_earnings || 0).toFixed(2),
    user.current_step,
    user.credit_score,
    user.referral_code || "",
    user.language || "en",
    user.created_at,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `golden-axis-users-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function generateSixDigitPasscode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateTemporaryPassword() {
  return `GA60-${Math.floor(100000 + Math.random() * 900000)}`;
}

function openSecurityReset(user: ManagedUser) {
  setSecurityUser(user);
  setResetPassword(generateTemporaryPassword());
  setResetPasscode(generateSixDigitPasscode());
  setResetResult("");
  setErrorText("");
  setSuccessText("");
}

async function handleResetLoginPassword() {
  if (!securityUser) return;

  if (resetPassword.length < 6) {
    setErrorText("Password must be at least 6 characters.");
    return;
  }

  setActionLoading(true);
  setErrorText("");
  setSuccessText("");
  setResetResult("");

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    setErrorText("Admin session expired. Please login again.");
    setActionLoading(false);
    return;
  }

  const response = await fetch("/api/admin/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      userId: securityUser.id,
      newPassword: resetPassword,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    setErrorText(result.error || "Failed to reset login password.");
    setActionLoading(false);
    return;
  }

  setResetResult(
    `Login password reset successfully. Give this new password to the user: ${resetPassword}`
  );
  setSuccessText("Login password reset successfully.");
  setActionLoading(false);
}

async function handleResetWithdrawPasscode() {
  if (!securityUser) return;

  if (!/^[0-9]{6}$/.test(resetPasscode)) {
    setErrorText("Withdraw passcode must be exactly 6 digits.");
    return;
  }

  setActionLoading(true);
  setErrorText("");
  setSuccessText("");
  setResetResult("");

  const { error } = await supabase.rpc("admin_reset_withdraw_passcode", {
    p_user_id: securityUser.id,
    p_passcode: resetPasscode,
  });

  if (error) {
    setErrorText(error.message);
    setActionLoading(false);
    return;
  }

  setResetResult(
    `Withdraw passcode reset successfully. Give this new code to the user: ${resetPasscode}`
  );
  setSuccessText("Withdraw passcode reset successfully.");
  setActionLoading(false);
}

async function handleGenerateOrders() {
  if (!generateUser) return;

  if (generateTaskCount < 1 || generateTaskCount > 80) {
    setErrorText("Task count must be between 1 and 80.");
    return;
  }

  if (generateCapitalAmount <= 0) {
    setErrorText("Capital amount must be greater than 0.");
    return;
  }

  if (generateProfitRate < 0) {
    setErrorText("Profit rate cannot be negative.");
    return;
  }

  setActionLoading(true);
  setSuccessText("");
  setErrorText("");

  const { error } = await supabase.rpc("generate_user_orders", {
    p_user_id: generateUser.id,
    p_task_count: generateTaskCount,
    p_capital_amount: generateCapitalAmount,
    p_profit_rate_percent: generateProfitRate,
    p_reset_existing: generateResetExisting,
  });

  if (error) {
    setErrorText(error.message);
    setActionLoading(false);
    return;
  }

  setSuccessText(
    `Generated ${generateTaskCount} auto orders for ${
      generateUser.display_name || generateUser.email || "user"
    }.`
  );

  setGenerateUser(null);
  setGenerateTaskCount(60);
  setGenerateCapitalAmount(500);
  setGenerateProfitRate(0.08);
  setGenerateResetExisting(true);
  setActionLoading(false);
  loadUsers();
}

async function openLuckyOrderModal(user: ManagedUser) {
  setLuckyUser(user);
  setLuckyStepNumber(25);
  setLuckyAmount(2800);
  setLuckyProfitRate(5);
  setLuckyProductId("");
  setSuccessText("");
  setErrorText("");

  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, category, main_image")
    .eq("product_type", "lucky")
    .eq("is_active", true)
    .eq("stock_status", "in_stock")
    .order("created_at", { ascending: false });

  if (error) {
    setErrorText(error.message);
    return;
  }

  const products = (data || []) as LuckyProductOption[];
  setLuckyProducts(products);

  if (products.length > 0) {
    setLuckyProductId(products[0].id);
  }
}

async function handleInjectLuckyOrder() {
  if (!luckyUser) return;

  if (!luckyProductId) {
    setErrorText("Please choose a lucky product.");
    return;
  }

  if (luckyStepNumber < 1 || luckyStepNumber > 80) {
    setErrorText("Lucky step must be between 1 and 80.");
    return;
  }

  if (luckyAmount <= 0) {
    setErrorText("Lucky amount must be greater than 0.");
    return;
  }

  if (luckyProfitRate < 0) {
    setErrorText("Lucky profit rate cannot be negative.");
    return;
  }

  setActionLoading(true);
  setSuccessText("");
  setErrorText("");

  const { error } = await supabase.rpc("inject_lucky_order", {
    p_user_id: luckyUser.id,
    p_step_number: luckyStepNumber,
    p_lucky_product_id: luckyProductId,
    p_lucky_amount: luckyAmount,
    p_profit_rate_percent: luckyProfitRate,
  });

  if (error) {
    setErrorText(error.message);
    setActionLoading(false);
    return;
  }

  setSuccessText(
    `Lucky order injected at step ${luckyStepNumber} for ${
      luckyUser.display_name || luckyUser.email || "user"
    }.`
  );

  setLuckyUser(null);
  setLuckyProducts([]);
  setLuckyProductId("");
  setLuckyStepNumber(25);
  setLuckyAmount(2800);
  setLuckyProfitRate(5);
  setActionLoading(false);
  loadUsers();
}

async function openViewOrdersModal(user: ManagedUser) {
  setViewOrdersUser(user);
  setViewOrders([]);
  setViewOrdersLoading(true);
  setSuccessText("");
  setErrorText("");

  const { data, error } = await supabase
    .from("user_generated_orders")
    .select(
      `
      id,
      step_number,
      order_total,
      profit_rate,
      profit_amount,
      order_type,
      status,
      is_lucky_bonus,
      created_at,
      completed_at,
      user_generated_order_items (
        id,
        product_snapshot,
        unit_price,
        quantity,
        subtotal
      )
    `
    )
    .eq("user_id", user.id)
    .order("step_number", { ascending: true });

  if (error) {
    setErrorText(error.message);
    setViewOrdersLoading(false);
    return;
  }

  setViewOrders((data || []) as unknown as GeneratedOrderPreview[]);
  setViewOrdersLoading(false);
}

async function handleResetGeneratedOrders() {
  if (!resetOrdersUser) return;

  if (resetOrdersConfirmText !== "RESET") {
    setErrorText("Type RESET to confirm.");
    return;
  }

  setActionLoading(true);
  setSuccessText("");
  setErrorText("");

  const { error } = await supabase.rpc("reset_user_generated_orders", {
    p_user_id: resetOrdersUser.id,
    p_reset_step: resetOrdersResetStep,
  });

  if (error) {
    setErrorText(error.message);
    setActionLoading(false);
    return;
  }

  setSuccessText(
    `Generated orders reset for ${
      resetOrdersUser.display_name || resetOrdersUser.email || "user"
    }.`
  );

  setResetOrdersUser(null);
  setResetOrdersConfirmText("");
  setResetOrdersResetStep(true);
  setViewOrdersUser(null);
  setViewOrders([]);
  setActionLoading(false);
  loadUsers();
}

  async function handleAdjustBalance() {
    if (!selectedUser) return;

    setActionLoading(true);
    setSuccessText("");
    setErrorText("");

    const { error } = await supabase.rpc("admin_adjust_user_balance", {
      input_user_id: selectedUser.id,
      input_amount: adjustAmount,
      input_note: adjustNote || t.adjustModal.defaultNote,
    });

    if (error) {
      setErrorText(error.message);
      setActionLoading(false);
      return;
    }

    setSuccessText(t.messages.balanceAdjusted);
    setSelectedUser(null);
    setAdjustAmount(100);
    setAdjustNote("");
    setActionLoading(false);
    loadUsers();
  }

  async function handleSaveNickname() {
  if (!nicknameUser) return;

  setActionLoading(true);
  setSuccessText("");
  setErrorText("");

  const cleanNickname = nicknameValue.trim();

  const { error } = await supabase.from("admin_user_notes").upsert(
    {
      user_id: nicknameUser.id,
      nickname: cleanNickname || null,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    setErrorText(error.message);
    setActionLoading(false);
    return;
  }

  setUsers((currentUsers) =>
    currentUsers.map((user) =>
      user.id === nicknameUser.id
        ? { ...user, admin_nickname: cleanNickname || null }
        : user
    )
  );

  setSuccessText(t.messages.nicknameSaved);
  setNicknameUser(null);
  setNicknameValue("");
  setActionLoading(false);
}

async function handleSaveReferralCode() {
  if (!referralUser) return;

  const cleanCode = referralValue
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 20);

  if (cleanCode.length < 4) {
    setErrorText(t.messages.referralCodeInvalid);
    return;
  }

  setActionLoading(true);
  setSuccessText("");
  setErrorText("");

  const { error } = await supabase
    .from("profiles")
    .update({ referral_code: cleanCode })
    .eq("id", referralUser.id);

  if (error) {
    if (
      error.code === "23505" ||
      error.message.toLowerCase().includes("duplicate") ||
      error.message.toLowerCase().includes("unique")
    ) {
      setErrorText(t.messages.referralCodeDuplicate);
    } else {
      setErrorText(error.message);
    }

    setActionLoading(false);
    return;
  }

  setUsers((currentUsers) =>
    currentUsers.map((user) =>
      user.id === referralUser.id
        ? { ...user, referral_code: cleanCode }
        : user
    )
  );

  setSuccessText(t.messages.referralCodeSaved);
  setReferralUser(null);
  setReferralValue("");
  setActionLoading(false);
}

async function handleSaveReferralBonus() {
  if (!referralBonusUser) return;

  if (referralBonusAmount < 0) {
    setErrorText("Referral bonus cannot be negative.");
    return;
  }

  setActionLoading(true);
  setSuccessText("");
  setErrorText("");

  const { data, error } = await supabase.rpc(
    "admin_set_user_referral_bonus_balance",
    {
      input_user_id: referralBonusUser.id,
      input_referral_bonus_balance: referralBonusAmount,
    }
  );

  if (error) {
    setErrorText(error.message);
    setActionLoading(false);
    return;
  }

  const newReferral = Number(
    data?.new_referral_bonus_balance ?? referralBonusAmount
  );

  const newBalance = Number(
    data?.balance_after ??
      Number(referralBonusUser.deposited_balance || 0) +
        newReferral +
        Number(referralBonusUser.task_profit_balance || 0)
  );

  setUsers((currentUsers) =>
    currentUsers.map((user) =>
      user.id === referralBonusUser.id
        ? {
            ...user,
            referral_bonus_balance: newReferral,
            balance: newBalance,
          }
        : user
    )
  );

  setSuccessText(t.messages.referralBonusUpdated);
  setReferralBonusUser(null);
  setReferralBonusAmount(0);
  setActionLoading(false);
}

async function handleDeleteUser() {
  if (!deleteUser) return;

  if (deleteUser.id === profile.id) {
    setErrorText(t.messages.cannotDeleteSelf);
    return;
  }

  if (deleteUser.role === "admin") {
    setErrorText(t.messages.cannotDeleteAdmin);
    return;
  }

  if (deleteConfirmText !== "DELETE") {
    setErrorText(t.messages.typeDelete);
    return;
  }

  setActionLoading(true);
  setSuccessText("");
  setErrorText("");

  const { error } = await supabase
    .from("profiles")
    .update({ status: "deleted" })
    .eq("id", deleteUser.id);

  if (error) {
    setErrorText(error.message);
    setActionLoading(false);
    return;
  }

  setUsers((currentUsers) =>
    currentUsers.filter((user) => user.id !== deleteUser.id)
  );

  setSuccessText(t.messages.userRemoved);
  setDeleteUser(null);
  setDeleteConfirmText("");
  setActionLoading(false);
}

  if (!hasPageAccess) {
    return (
      <main className="min-h-screen bg-[#050505] p-6 text-white">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-red-400/30 bg-red-500/10 p-8 text-center">
          <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-red-300" />
          <h1 className="text-2xl font-black">{t.accessRequiredTitle}</h1>
<p className="mt-2 text-sm text-white/55">
  {t.accessRequiredDescription}
</p>
        </div>
      </main>
    );
  }

  return (
  <main className="min-h-screen overflow-x-hidden bg-[#050505] text-white">
  <div className="w-full px-3 py-4 sm:px-5">
        <AdminNav language={currentLanguage} profile={profile} />

        <div className="mb-5 flex items-center justify-between gap-5">
          <div>
            <p className="text-sm font-bold text-yellow-200/80">
  {t.pageTag}
</p>
<h1 className="mt-1 text-3xl font-black">{t.title}</h1>
<p className="mt-2 max-w-2xl text-sm text-white/50">
  {t.description}
</p>
          </div>

        </div>

        {successText && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle className="h-4 w-4" />
            {successText}
          </div>
        )}

        {errorText && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="h-4 w-4" />
            {errorText}
          </div>
        )}
<style>{`
  .users-white-card {
    background: #ffffff !important;
    color: #0f172a !important;
    border-color: #e2e8f0 !important;
  }

  .users-white-card [class*="bg-[#101010]"],
  .users-white-card [class*="bg-[#181818]"],
  .users-white-card [class*="bg-black"],
  .users-white-card [class*="bg-white/"] {
    background: #ffffff !important;
  }

  .users-white-card [class*="border-white"] {
    border-color: #e2e8f0 !important;
  }

  .users-white-card [class*="text-white"] {
    color: #334155 !important;
  }

  .users-white-card h2,
  .users-white-card .font-black {
    color: #0f172a !important;
  }

  .users-white-card input,
  .users-white-card select {
    background: #ffffff !important;
    color: #0f172a !important;
    border-color: #cbd5e1 !important;
  }

  .users-white-card input::placeholder {
    color: #94a3b8 !important;
  }

  .users-white-card thead {
    background: #f8fafc !important;
    color: #475569 !important;
  }

  .users-white-card tbody tr {
    background: #ffffff !important;
  }

  .users-white-card tbody tr:hover {
    background: #fff7ed !important;
  }

  .users-white-card button[class*="bg-blue"],
  .users-white-card button[class*="bg-fuchsia"],
  .users-white-card button[class*="bg-orange"],
  .users-white-card button[class*="bg-red"] {
    color: #ffffff !important;
  }

  .users-white-card button[class*="bg-yellow"] {
    color: #111827 !important;
  }

  .users-white-card button[class*="bg-emerald"] {
    color: #022c22 !important;
  }
`}</style>

<section className="users-white-card overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
  <div className="border-b border-white/10 bg-[#101010] px-4 py-3">
    <div className="mb-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <p className="text-xs font-bold text-yellow-300">{t.panel.tag}</p>
        <h2 className="text-xl font-black text-white">{t.panel.title}</h2>
        <p className="mt-1 text-xs text-white/45">{t.panel.description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="rounded-lg border border-yellow-400/25 bg-yellow-400/10 px-3 py-2 text-xs font-black text-yellow-300">
          {filteredUsers.length} {t.panel.shown} / {users.length} {t.panel.total}
        </div>

        <button
          type="button"
          onClick={loadUsers}
          className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white/70 hover:bg-white/[0.1]"
        >
          {t.panel.refresh}
        </button>

        <button
          type="button"
          onClick={exportUsersToCsv}
          className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-300 hover:bg-emerald-500/15"
        >
          {t.panel.exportCsv}
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-[1.5fr_0.7fr_0.8fr_0.9fr_0.6fr]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder={t.filters.searchPlaceholder}
          className="h-10 w-full rounded-lg border border-white/10 bg-black/40 py-2 pl-10 pr-3 text-xs text-white outline-none placeholder:text-white/30 focus:border-yellow-400/50"
        />
      </div>

      <select
        value={roleFilter}
        onChange={(event) =>
          setRoleFilter(
            event.target.value as "all" | "user" | "admin" | "super" | "support"
          )
        }
        className="h-10 rounded-lg border border-white/10 bg-black/40 px-3 text-xs font-bold text-white outline-none focus:border-yellow-400/50"
      >
        <option className="bg-black" value="all">
          {t.filters.allRoles}
        </option>
        <option className="bg-black" value="user">
          {t.filters.users}
        </option>
        <option className="bg-black" value="admin">
          {t.filters.admin}
        </option>
        <option className="bg-black" value="super">
          {t.filters.super}
        </option>
        <option className="bg-black" value="support">
          {t.filters.support}
        </option>
      </select>

      <select
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value)}
        className="h-10 rounded-lg border border-white/10 bg-black/40 px-3 text-xs font-bold text-white outline-none focus:border-yellow-400/50"
      >
        <option className="bg-black" value="all">
          {t.filters.allStatus}
        </option>
        {userStatuses.map((status) => (
          <option key={status} className="bg-black" value={status}>
            {status}
          </option>
        ))}
      </select>

      <select
        value={sortBy}
        onChange={(event) =>
          setSortBy(
            event.target.value as
              | "newest"
              | "name"
              | "balance_high"
              | "today_high"
              | "step_high"
          )
        }
        className="h-10 rounded-lg border border-white/10 bg-black/40 px-3 text-xs font-bold text-white outline-none focus:border-yellow-400/50"
      >
        <option className="bg-black" value="newest">
          {t.filters.newestFirst}
        </option>
        <option className="bg-black" value="name">
          {t.filters.nameAz}
        </option>
        <option className="bg-black" value="balance_high">
          {t.filters.balanceHigh}
        </option>
        <option className="bg-black" value="today_high">
          {t.filters.todayHigh}
        </option>
        <option className="bg-black" value="step_high">
          {t.filters.stepHigh}
        </option>
      </select>

      <select
        value={pageSize}
        onChange={(event) => setPageSize(Number(event.target.value))}
        className="h-10 rounded-lg border border-white/10 bg-black/40 px-3 text-xs font-bold text-white outline-none focus:border-yellow-400/50"
      >
        <option className="bg-black" value={10}>10</option>
        <option className="bg-black" value={25}>25</option>
        <option className="bg-black" value={50}>50</option>
        <option className="bg-black" value={100}>100</option>
      </select>
    </div>

    <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-[0.7fr_0.7fr_0.7fr_0.7fr_auto]">
      <input
        value={minBalanceFilter}
        onChange={(event) => setMinBalanceFilter(event.target.value)}
        type="number"
        placeholder={t.filters.minBalance}
        className="h-10 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-white outline-none placeholder:text-white/30 focus:border-yellow-400/50"
      />

      <input
        value={maxBalanceFilter}
        onChange={(event) => setMaxBalanceFilter(event.target.value)}
        type="number"
        placeholder={t.filters.maxBalance}
        className="h-10 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-white outline-none placeholder:text-white/30 focus:border-yellow-400/50"
      />

      <input
        value={minStepFilter}
        onChange={(event) => setMinStepFilter(event.target.value)}
        type="number"
        placeholder={t.filters.minStep}
        className="h-10 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-white outline-none placeholder:text-white/30 focus:border-yellow-400/50"
      />

      <input
        value={maxStepFilter}
        onChange={(event) => setMaxStepFilter(event.target.value)}
        type="number"
        placeholder={t.filters.maxStep}
        className="h-10 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-white outline-none placeholder:text-white/30 focus:border-yellow-400/50"
      />

      <button
        type="button"
        onClick={() => {
          setSearchText("");
          setRoleFilter("all");
          setStatusFilter("all");
          setSortBy("newest");
          setMinBalanceFilter("");
          setMaxBalanceFilter("");
          setMinStepFilter("");
          setMaxStepFilter("");
        }}
        className="h-10 rounded-lg border border-red-400/25 bg-red-500/10 px-3 text-xs font-black text-red-300 hover:bg-red-500/15"
      >
        {t.filters.clearFilters}
      </button>
    </div>
  </div>

  {loading && (
    <div className="p-8 text-center text-sm text-white/60">
      {t.loadingUsers}
    </div>
  )}

  {!loading && filteredUsers.length === 0 && (
    <div className="p-10 text-center">
      <Users className="mx-auto mb-3 h-10 w-10 text-yellow-300" />
      <p className="font-black text-white">{t.noUsersFound}</p>
      <p className="mt-2 text-sm text-white/45">{t.noUsersNote}</p>
    </div>
  )}

  {!loading && filteredUsers.length > 0 && (
    <>
      <div className="overflow-auto rounded-b-xl">
        <table className="w-full min-w-[1780px] border-collapse text-left text-[12px]">
          <thead className="sticky top-0 z-10 bg-[#181818] text-[11px] uppercase tracking-wide text-white/45">
            <tr>
              <th className="border-b border-white/10 px-4 py-3">{t.table.userInfo}</th>
              <th className="border-b border-white/10 px-3 py-3">{t.table.loginId}</th>
              <th className="border-b border-white/10 px-3 py-3">{t.table.nickname}</th>
              <th className="border-b border-white/10 px-3 py-3">{t.table.role}</th>
              <th className="border-b border-white/10 px-3 py-3">{t.table.balance}</th>
              <th className="border-b border-white/10 px-3 py-3">{t.table.splitBalance}</th>
              <th className="border-b border-white/10 px-3 py-3">{t.table.earnings}</th>
              <th className="border-b border-white/10 px-3 py-3">{t.table.campaign}</th>
              <th className="border-b border-white/10 px-3 py-3">{t.table.referralCode}</th>
              <th className="border-b border-white/10 px-3 py-3">{t.table.account}</th>
              <th className="border-b border-white/10 px-3 py-3">{t.table.created}</th>
              <th className="border-b border-white/10 px-3 py-3 text-right">{t.table.actions}</th>
            </tr>
          </thead>

          <tbody>
            {paginatedUsers.map((user) => {
              const isUserAdmin = user.role === "admin";
              const displayBalance = getDisplayBalance(user);

              return (
                <tr
                  key={user.id}
                  className="border-b border-white/10 bg-black/20 hover:bg-yellow-400/[0.04]"
                >
                  <td className="px-3 py-3 align-top">
                    <div className="flex min-w-[220px] items-start gap-2">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          isUserAdmin
                            ? "bg-yellow-400/10 text-yellow-300"
                            : "bg-blue-400/10 text-blue-300"
                        }`}
                      >
                        {isUserAdmin ? (
                          <Crown className="h-5 w-5" />
                        ) : (
                          <Users className="h-5 w-5" />
                        )}
                      </div>

                      <div>
                        <p className="font-black text-white">
                          {user.display_name || t.row.noName}
                        </p>
                        <p className="mt-1 text-white/45">
                          {user.email || t.row.noEmail}
                        </p>
                        <p className="mt-1 text-[10px] text-white/25">
                          ID: {user.member_id || shortId(user.id)}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3 align-top">
                    <div className="min-w-[180px]">
                      <p className="text-white/70">{user.email || "-"}</p>
                      <p className="mt-1 text-[10px] text-white/35">
                        {t.row.uid}: {user.member_id || shortId(user.id)}
                      </p>
                      <p className="mt-1 text-[10px] text-white/35">
                        {t.row.phone}: {user.phone || "-"}
                      </p>
                    </div>
                  </td>

                  <td className="px-3 py-3 align-top">
                    <div className="min-w-[140px]">
                      <p className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white/70">
                        {user.admin_nickname || t.row.noNickname}
                      </p>

                      <button
  onClick={() => {
    setNicknameUser(user);
    setNicknameValue(user.admin_nickname || "");
  }}
  disabled={!canEditUserInfo}
  className="mt-2 text-[11px] font-bold text-yellow-300 hover:text-yellow-200 disabled:cursor-not-allowed disabled:opacity-35"
>
  {t.row.edit}
</button>
                    </div>
                  </td>

                  <td className="px-3 py-3 align-top">
                    <span
                      className={`rounded-md px-2 py-1 text-[11px] font-black ${
                        isUserAdmin
                          ? "bg-yellow-300 text-black"
                          : user.role === "support"
                            ? "bg-blue-400/15 text-blue-300"
                            : user.role === "super"
                              ? "bg-fuchsia-400/15 text-fuchsia-300"
                              : "bg-white/10 text-white/70"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>

                  <td className="px-3 py-3 align-top">
                    <p className="font-black text-yellow-300">
                      {formatMoney(displayBalance)}
                    </p>
                    <p className="mt-1 text-[10px] text-white/35">
                      {t.row.legacy}: {formatMoney(user.balance)}
                    </p>
                  </td>

                  <td className="px-3 py-3 align-top">
                    <div className="min-w-[145px] space-y-1 text-[11px]">
                      <p className="text-white/55">
                        {t.row.deposit}:{" "}
                        <span className="font-bold text-white">
                          {formatMoney(user.deposited_balance)}
                        </span>
                      </p>
                      <p className="text-white/55">
                        {t.row.referral}:{" "}
                        <span className="font-bold text-yellow-300">
                          {formatMoney(user.referral_bonus_balance)}
                        </span>
                      </p>
                      <p className="text-white/55">
                        {t.row.profit}:{" "}
                        <span className="font-bold text-emerald-300">
                          {formatMoney(user.task_profit_balance)}
                        </span>
                      </p>
                    </div>
                  </td>

                  <td className="px-3 py-3 align-top">
                    <div className="min-w-[125px] space-y-1 text-[11px]">
                      <p className="text-white/55">
                        {t.row.today}:{" "}
                        <span className="font-bold text-emerald-300">
                          {formatMoney(user.today_earnings)}
                        </span>
                      </p>
                      <p className="text-white/55">
                        {t.row.total}:{" "}
                        <span className="font-bold text-white">
                          {formatMoney(user.total_earnings)}
                        </span>
                      </p>
                    </div>
                  </td>

                  <td className="px-3 py-3 align-top">
                    <div className="min-w-[110px] space-y-1 text-[11px]">
                      <p className="font-black text-white">
                        {t.row.step} {user.current_step}
                      </p>
                      <p className="text-white/45">
                        {t.row.credit}: {user.credit_score}
                      </p>
                      <p className="text-white/45">
                        {t.row.terms}: {user.terms_accepted ? t.row.yes : t.row.no}
                      </p>
                    </div>
                  </td>

                  <td className="px-3 py-3 align-top">
                    <div className="min-w-[120px]">
                      <p className="font-black text-yellow-200">
                        {user.referral_code || "-"}
                      </p>

                      <button
  onClick={() => {
    setReferralUser(user);
    setReferralValue(user.referral_code || "");
  }}
  disabled={!canEditUserInfo}
  className="mt-2 text-[11px] font-bold text-yellow-300 hover:text-yellow-200 disabled:cursor-not-allowed disabled:opacity-35"
>
  {t.row.edit}
</button>
                    </div>
                  </td>

                  <td className="px-3 py-3 align-top">
                    <span
                      className={`rounded-md px-2 py-1 text-[11px] font-black ${
                        user.status === "active"
                          ? "bg-emerald-400/15 text-emerald-300"
                          : "bg-red-500/15 text-red-300"
                      }`}
                    >
                      {user.status}
                    </span>

                    <p className="mt-2 text-[10px] text-white/35">
                      {t.row.lang}: {user.language || "en"}
                    </p>
                  </td>

                  <td className="px-3 py-3 align-top">
                    <p className="min-w-[90px] text-white/45">
                      {formatDate(user.created_at)}
                    </p>
                  </td>

                  <td className="px-3 py-3 align-top">
                    <div className="flex min-w-[310px] flex-wrap justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setGenerateUser(user);
                          setGenerateTaskCount(60);
                          setGenerateCapitalAmount(500);
                          setGenerateProfitRate(0.08);
                          setGenerateResetExisting(true);
                        }}
                        disabled={!canManageOrders || user.role !== "user"}
                        className="rounded-md bg-yellow-400 px-2.5 py-1.5 text-[11px] font-black text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        {t.actions.generate}
                      </button>

                      <button
                        onClick={() => openLuckyOrderModal(user)}
                        disabled={!canManageOrders || user.role !== "user"}
                        className="rounded-md bg-fuchsia-500 px-2.5 py-1.5 text-[11px] font-black text-white hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        {t.actions.lucky}
                      </button>

                      <button
                        onClick={() => openViewOrdersModal(user)}
                        disabled={!canManageOrders || user.role !== "user"}
                        className="rounded-md bg-blue-500 px-2.5 py-1.5 text-[11px] font-black text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        {t.actions.orders}
                      </button>

                      <button
                        onClick={() => {
                          setResetOrdersUser(user);
                          setResetOrdersConfirmText("");
                          setResetOrdersResetStep(true);
                        }}
                        disabled={!canManageOrders || user.role !== "user"}
                        className="rounded-md bg-orange-500 px-2.5 py-1.5 text-[11px] font-black text-white hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        {t.actions.reset}
                      </button>

                      <button
  onClick={() => {
    setSelectedUser(user);
    setAdjustAmount(100);
    setAdjustNote("");
  }}
  disabled={!canManageMoney}
  className="rounded-md border border-white/15 bg-white/[0.08] px-2.5 py-1.5 text-[11px] font-black text-white/80 hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-35"
>
                        {t.actions.balance}
                      </button>

                      <button
  onClick={() => {
    setReferralBonusUser(user);
    setReferralBonusAmount(Number(user.referral_bonus_balance || 0));
  }}
  disabled={!canManageMoney || user.role !== "user"}
  className="rounded-md border border-yellow-400/25 bg-yellow-400/10 px-2.5 py-1.5 text-[11px] font-black text-yellow-300 hover:bg-yellow-400/15 disabled:cursor-not-allowed disabled:opacity-35"
>
  {t.actions.referralBonus}
</button>

                      <button
                        onClick={() => openSecurityReset(user)}
                        disabled={!canManageSecurity}
                        className="rounded-md bg-emerald-500 px-2.5 py-1.5 text-[11px] font-black text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        {t.actions.security}
                      </button>

                      <button
                        onClick={() => {
                          setDeleteUser(user);
                          setDeleteConfirmText("");
                        }}
                        disabled={!canDeleteUsers || user.id === profile.id || user.role !== "user"}
                        className="rounded-md bg-red-500 px-2.5 py-1.5 text-[11px] font-black text-white hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        {t.actions.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 bg-[#101010] px-4 py-3 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
        <p>
          {t.pagination.showing}{" "}
          <span className="font-black text-white">{firstResult}</span>
          {" - "}
          <span className="font-black text-white">{lastResult}</span>
          {" "}
          {t.pagination.of}{" "}
          <span className="font-black text-yellow-300">
            {filteredUsers.length}
          </span>{" "}
          {t.pagination.users}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-[11px] font-black text-white/70 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {t.pagination.prev}
          </button>

          <div className="rounded-md border border-yellow-400/20 bg-yellow-400/10 px-3 py-2 text-[11px] font-black text-yellow-300">
            {t.pagination.page} {currentPage} / {totalPages}
          </div>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
            className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-[11px] font-black text-white/70 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t.pagination.next}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  )}
</section>

{generateUser && (
  <GenerateOrdersModal
    user={generateUser}
    fallbackName={t.list.fallbackName}
    taskCount={generateTaskCount}
    capitalAmount={generateCapitalAmount}
    profitRate={generateProfitRate}
    resetExisting={generateResetExisting}
    actionLoading={actionLoading}
    t={t.generateModal}
    onTaskCountChange={setGenerateTaskCount}
    onCapitalAmountChange={setGenerateCapitalAmount}
    onProfitRateChange={setGenerateProfitRate}
    onResetExistingChange={setGenerateResetExisting}
    onClose={() => setGenerateUser(null)}
    onSubmit={handleGenerateOrders}
  />
)}

{luckyUser && (
  <LuckyOrderModal
    user={luckyUser}
    fallbackName={t.list.fallbackName}
    luckyProducts={luckyProducts}
    stepNumber={luckyStepNumber}
    productId={luckyProductId}
    luckyAmount={luckyAmount}
    profitRate={luckyProfitRate}
    actionLoading={actionLoading}
        t={t.luckyModal}
    onStepNumberChange={setLuckyStepNumber}
    onProductIdChange={setLuckyProductId}
    onLuckyAmountChange={setLuckyAmount}
    onProfitRateChange={setLuckyProfitRate}
    onClose={() => {
      setLuckyUser(null);
      setLuckyProducts([]);
      setLuckyProductId("");
    }}
    onSubmit={handleInjectLuckyOrder}
  />
)}

{viewOrdersUser && (
  <ViewOrdersModal
    user={viewOrdersUser}
    fallbackName={t.list.fallbackName}
    orders={viewOrders}
    loading={viewOrdersLoading}
      t={t.viewOrdersModal}
    onClose={() => {
      setViewOrdersUser(null);
      setViewOrders([]);
    }}
  />
)}

{resetOrdersUser && (
  <ResetOrdersModal
    user={resetOrdersUser}
    fallbackName={t.list.fallbackName}
    confirmText={resetOrdersConfirmText}
    resetStep={resetOrdersResetStep}
    actionLoading={actionLoading}
      t={t.resetOrdersModal}
    onConfirmTextChange={setResetOrdersConfirmText}
    onResetStepChange={setResetOrdersResetStep}
    onClose={() => {
      setResetOrdersUser(null);
      setResetOrdersConfirmText("");
      setResetOrdersResetStep(true);
    }}
    onSubmit={handleResetGeneratedOrders}
  />
)}

{selectedUser && (
  <AdjustBalanceModal
    user={selectedUser}
    fallbackName={t.list.fallbackName}
    amount={adjustAmount}
    note={adjustNote}
    actionLoading={actionLoading}
    t={t.adjustModal}
    onAmountChange={setAdjustAmount}
    onNoteChange={setAdjustNote}
    onClose={() => setSelectedUser(null)}
    onSubmit={handleAdjustBalance}
  />
)}

{securityUser && (
  <SecurityResetModal
    user={securityUser}
    fallbackName={t.list.fallbackName}
    noEmailText={t.list.noEmail}
    resetPassword={resetPassword}
    resetPasscode={resetPasscode}
    resetResult={resetResult}
    actionLoading={actionLoading}
      t={t.securityModal}
    onPasswordChange={setResetPassword}
    onPasscodeChange={setResetPasscode}
    onGeneratePassword={() => setResetPassword(generateTemporaryPassword())}
    onGeneratePasscode={() => setResetPasscode(generateSixDigitPasscode())}
    onResetLoginPassword={handleResetLoginPassword}
    onResetWithdrawPasscode={handleResetWithdrawPasscode}
    onClose={() => {
      setSecurityUser(null);
      setResetPassword("");
      setResetPasscode("");
      setResetResult("");
    }}
  />
)}

{deleteUser && (
  <DeleteUserModal
    user={deleteUser}
    fallbackName={t.list.fallbackName}
    noEmailText={t.list.noEmail}
    confirmText={deleteConfirmText}
    actionLoading={actionLoading}
    t={t.deleteModal}
    onConfirmTextChange={setDeleteConfirmText}
    onClose={() => {
      setDeleteUser(null);
      setDeleteConfirmText("");
    }}
    onSubmit={handleDeleteUser}
  />
)}

{nicknameUser && (
  <NicknameModal
    user={nicknameUser}
    fallbackName={t.list.fallbackName}
    noEmailText={t.list.noEmail}
    nicknameValue={nicknameValue}
    actionLoading={actionLoading}
    t={t.nicknameModal}
    onNicknameChange={setNicknameValue}
    onClose={() => {
      setNicknameUser(null);
      setNicknameValue("");
    }}
    onSubmit={handleSaveNickname}
  />
)}
      </div>

{referralUser && (
  <ReferralCodeModal
    user={referralUser}
    fallbackName={t.list.fallbackName}
    referralValue={referralValue}
    actionLoading={actionLoading}
    t={t.referralModal}
    onReferralChange={setReferralValue}
    onClose={() => {
      setReferralUser(null);
      setReferralValue("");
    }}
    onSubmit={handleSaveReferralCode}
  />
)}
{referralBonusUser && (
  <ReferralBonusModal
    user={referralBonusUser}
    fallbackName={t.list.fallbackName}
    amount={referralBonusAmount}
    actionLoading={actionLoading}
    t={t.referralBonusModal}
    onAmountChange={setReferralBonusAmount}
    onClose={() => {
      setReferralBonusUser(null);
      setReferralBonusAmount(0);
    }}
    onSubmit={handleSaveReferralBonus}
  />
)}

    </main>
  );
}
