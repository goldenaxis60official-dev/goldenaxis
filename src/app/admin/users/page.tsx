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
  id?: string;
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
  lucky_profit_rate_percent: number | null;
  lucky_profit_amount: number;
  campaign_base_amount: number | null;
  normal_task_rate: number | null;
  order_type: "normal" | "lucky";
  status: "pending" | "completed" | "cancelled";
  is_lucky_bonus: boolean;
  created_at: string;
  completed_at: string | null;
  user_generated_order_items?: GeneratedOrderItemPreview[];
};

type UserOrderSummary = {
  totalOrders: number;
  maxStep: number;
  completedOrders: number;
  pendingOrders: number;
  luckySteps: number[];
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
const [generateProfitRate, setGenerateProfitRate] = useState(0.008);
const [generateResetExisting, setGenerateResetExisting] = useState(false);
const [luckyUser, setLuckyUser] = useState<ManagedUser | null>(null);
const [luckyProducts, setLuckyProducts] = useState<LuckyProductOption[]>([]);
const [luckyStepNumber, setLuckyStepNumber] = useState(25);
const [luckyProductId, setLuckyProductId] = useState("");
const [luckyAmount, setLuckyAmount] = useState(2800);
const [luckyProfitRate, setLuckyProfitRate] = useState(5);
const [viewOrdersUser, setViewOrdersUser] = useState<ManagedUser | null>(null);
const [viewOrders, setViewOrders] = useState<GeneratedOrderPreview[]>([]);
const [viewOrdersLoading, setViewOrdersLoading] = useState(false);
const [orderStatsByUser, setOrderStatsByUser] = useState<
  Record<string, UserOrderSummary>
>({});
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
const isStaffControlRole = isFullControlRole || isSupportRole;

// Support can control orders, balance, referral bonus, and security reset
const canManageOrders = isStaffControlRole;
const canManageMoney = isStaffControlRole;
const canManageSecurity = isStaffControlRole;

// Keep these locked for support
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

  const userIds = mergedUsers.map((user) => user.id);

  const summaryMap: Record<string, UserOrderSummary> = {};

  if (userIds.length > 0) {
    const { data: orderRows, error: orderError } = await supabase
      .from("user_generated_orders")
      .select("user_id, step_number, status, is_lucky_bonus")
      .in("user_id", userIds);

    if (orderError) {
      setErrorText(orderError.message);
      setUsers(mergedUsers);
      setOrderStatsByUser({});
      setLoading(false);
      return;
    }

    ((orderRows || []) as {
      user_id: string;
      step_number: number | null;
      status: string | null;
      is_lucky_bonus: boolean | null;
    }[]).forEach((order) => {
      const userId = order.user_id;
      const stepNumber = Number(order.step_number || 0);

      if (!summaryMap[userId]) {
        summaryMap[userId] = {
          totalOrders: 0,
          maxStep: 0,
          completedOrders: 0,
          pendingOrders: 0,
          luckySteps: [],
        };
      }

      summaryMap[userId].totalOrders += 1;
      summaryMap[userId].maxStep = Math.max(summaryMap[userId].maxStep, stepNumber);

      if (order.status === "completed") {
        summaryMap[userId].completedOrders += 1;
      }

      if (order.status === "pending") {
        summaryMap[userId].pendingOrders += 1;
      }

      if (order.is_lucky_bonus && stepNumber > 0) {
        summaryMap[userId].luckySteps.push(stepNumber);
      }
    });

    Object.values(summaryMap).forEach((summary) => {
      summary.luckySteps.sort((a, b) => a - b);
    });
  }

  setUsers(mergedUsers);
  setOrderStatsByUser(summaryMap);
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

function pickRecommendedLuckyProduct(
  products: LuckyProductOption[],
  amount: number
) {
  if (products.length === 0) return null;

  const cleanAmount = Number(amount || 0);

  if (cleanAmount <= 0) {
    return [...products].sort(
      (a, b) => Number(a.price || 0) - Number(b.price || 0)
    )[0];
  }

  const affordableProducts = products.filter(
    (product) => Number(product.price || 0) <= cleanAmount
  );

  const productPool =
    affordableProducts.length > 0 ? affordableProducts : products;

  return [...productPool].sort((a, b) => {
    const aPrice = Number(a.price || 0);
    const bPrice = Number(b.price || 0);

    const aGap = Math.abs(aPrice - cleanAmount);
    const bGap = Math.abs(bPrice - cleanAmount);

    if (aGap !== bGap) return aGap - bGap;

    return bPrice - aPrice;
  })[0];
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

function getAutoOrderAmount(user: ManagedUser) {
  const availableBalance = getDisplayBalance(user);

  if (availableBalance <= 0) return 0;

  // Product pool max is currently $10,000.
  // If user balance is higher, still keep order amount inside product pool range.
  return Number(Math.min(availableBalance, 10000).toFixed(2));
}

async function openGenerateOrdersModal(user: ManagedUser) {
  setGenerateUser(user);
  setGenerateTaskCount(60);
  setGenerateProfitRate(0.008);
  setGenerateResetExisting(false);
  setSuccessText("");
  setErrorText("");
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

  if (generateTaskCount < 1) {
  setErrorText("Task count must be at least 1.");
  return;
}

  const autoCapitalAmount = getAutoOrderAmount(generateUser);

  if (autoCapitalAmount <= 0) {
    setErrorText("This user has no available balance for auto order generation.");
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
    p_capital_amount: autoCapitalAmount,
    p_profit_rate_percent: generateProfitRate,
    p_reset_existing: generateResetExisting,
  });

  if (error) {
    setErrorText(error.message);
    setActionLoading(false);
    return;
  }

  setSuccessText(
  `${generateResetExisting ? "Reset and generated" : "Added"} ${generateTaskCount} auto orders for ${
    generateUser.display_name || generateUser.email || "user"
  } using ${generateProfitRate} campaign rate and base amount ${formatMoney(
    autoCapitalAmount
  )}.`
);

  setGenerateUser(null);
  setGenerateTaskCount(60);
  setGenerateProfitRate(0.008);
  setGenerateResetExisting(false);
  setActionLoading(false);
  loadUsers();
}

async function openLuckyOrderModal(user: ManagedUser) {
  const defaultLuckyAmount = Math.max(
    1,
    Math.min(100, Math.floor(Number(user.balance || 100)))
  );

  setLuckyUser(user);
  setLuckyStepNumber(25);
  setLuckyAmount(defaultLuckyAmount);
  setLuckyProfitRate(5);
  setLuckyProductId("");
  setSuccessText("");
  setErrorText("");

  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, category, main_image")
    .in("product_type", ["normal", "lucky"])
    .eq("is_active", true)
    .eq("stock_status", "in_stock")
    .order("price", { ascending: true });

  if (error) {
    setErrorText(error.message);
    return;
  }

  const products = (data || []) as LuckyProductOption[];
  setLuckyProducts(products);

// Keep empty for Auto mode.
// The modal still previews the recommended product,
// and handleInjectLuckyOrder will use the closest product automatically.
setLuckyProductId("");
}

async function handleInjectLuckyOrder() {
  if (!luckyUser) return;

  const selectedLuckyProduct =
  luckyProducts.find((product) => product.id === luckyProductId) ||
  pickRecommendedLuckyProduct(luckyProducts, luckyAmount);

if (!selectedLuckyProduct) {
  setErrorText("No available product found for this lucky amount.");
  return;
}

  if (luckyStepNumber < 1) {
  setErrorText("Lucky step must be at least 1.");
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
    p_lucky_product_id: selectedLuckyProduct.id,
    p_lucky_amount: luckyAmount,
    p_profit_rate_percent: luckyProfitRate,
  });

  if (error) {
    setErrorText(error.message);
    setActionLoading(false);
    return;
  }

  setSuccessText(
    `Lucky order injected at step ${luckyStepNumber} using ${selectedLuckyProduct.name} for ${
      luckyUser.display_name || luckyUser.email || "user"
    }.`
  );

  setLuckyUser(null);
  setLuckyProducts([]);
  setLuckyProductId("");
  setLuckyStepNumber(25);
  setLuckyAmount(100);
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
      lucky_profit_rate_percent,
      lucky_profit_amount,
      campaign_base_amount,
      normal_task_rate,
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

async function openEditLuckyOrderModal(order: GeneratedOrderPreview) {
  if (!viewOrdersUser) return;

  if (order.status !== "pending") {
    setErrorText("Only pending lucky orders can be edited.");
    return;
  }

  const firstItem = order.user_generated_order_items?.[0];
  const snapshotProductId = firstItem?.product_snapshot?.id;

  setLuckyUser(viewOrdersUser);
  setLuckyStepNumber(order.step_number);
  setLuckyAmount(Number(order.order_total || 0));
  setLuckyProfitRate(
  Number(order.lucky_profit_rate_percent ?? order.profit_rate ?? 0)
);
  setLuckyProductId("");
  setSuccessText("");
  setErrorText("");

  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, category, main_image")
    .in("product_type", ["normal", "lucky"])
    .eq("is_active", true)
    .eq("stock_status", "in_stock")
    .order("price", { ascending: true });

  if (error) {
    setErrorText(error.message);
    return;
  }

  const products = (data || []) as LuckyProductOption[];
  setLuckyProducts(products);

  const existingProductStillAvailable =
    snapshotProductId &&
    products.some((product) => product.id === snapshotProductId);

  if (existingProductStillAvailable) {
    setLuckyProductId(snapshotProductId);
    return;
  }

setLuckyProductId("");
}

async function handleDeleteGeneratedOrder(order: GeneratedOrderPreview) {
  if (!viewOrdersUser) return;

  if (order.status !== "pending") {
    setErrorText("Only pending orders can be deleted.");
    return;
  }

  const confirmed = window.confirm(
    `Delete Step ${order.step_number}? Completed orders cannot be deleted.`
  );

  if (!confirmed) return;

  setActionLoading(true);
  setSuccessText("");
  setErrorText("");

  const remainingPendingOrders = viewOrders
    .filter((item) => item.id !== order.id && item.status === "pending")
    .sort((a, b) => a.step_number - b.step_number);

  const nextStep =
    viewOrdersUser.current_step === order.step_number
      ? remainingPendingOrders[0]?.step_number || viewOrdersUser.current_step
      : viewOrdersUser.current_step;

  const { error: itemError } = await supabase
    .from("user_generated_order_items")
    .delete()
    .eq("order_id", order.id);

  if (itemError) {
    setErrorText(itemError.message);
    setActionLoading(false);
    return;
  }

  const { error: orderError } = await supabase
    .from("user_generated_orders")
    .delete()
    .eq("id", order.id)
    .eq("user_id", viewOrdersUser.id)
    .eq("status", "pending");

  if (orderError) {
    setErrorText(orderError.message);
    setActionLoading(false);
    return;
  }

  if (nextStep !== viewOrdersUser.current_step) {
    await supabase
      .from("profiles")
      .update({ current_step: nextStep })
      .eq("id", viewOrdersUser.id);
  }

  setViewOrders((current) => current.filter((item) => item.id !== order.id));

  setUsers((currentUsers) =>
    currentUsers.map((user) =>
      user.id === viewOrdersUser.id
        ? { ...user, current_step: nextStep }
        : user
    )
  );

  setViewOrdersUser({ ...viewOrdersUser, current_step: nextStep });

  setSuccessText(`Step ${order.step_number} deleted.`);
  setActionLoading(false);
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

  if (cleanCode === referralUser.referral_code) {
    setReferralUser(null);
    setReferralValue("");
    return;
  }

  setActionLoading(true);
  setSuccessText("");
  setErrorText("");

  const { data: existingUser, error: checkError } = await supabase
    .from("profiles")
    .select("id")
    .eq("referral_code", cleanCode)
    .neq("id", referralUser.id)
    .maybeSingle();

  if (checkError) {
    setErrorText(checkError.message);
    setActionLoading(false);
    return;
  }

  if (existingUser) {
    setErrorText(t.messages.referralCodeDuplicate);
    setActionLoading(false);
    return;
  }

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
<section className="overflow-hidden rounded-[28px] border border-yellow-400/20 bg-white text-slate-950 shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
  <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#171006] px-5 py-5 text-white">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-300">
          {t.panel.tag}
        </p>

        <h2 className="mt-1 text-2xl font-black tracking-tight">
          {t.panel.title}
        </h2>

        <p className="mt-1 max-w-2xl text-sm font-medium text-white/55">
          Clean user control, wallet balance, campaign progress, and account tools.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-xs font-black text-yellow-200">
          {filteredUsers.length} shown / {users.length} total
        </div>

        <button
          type="button"
          onClick={loadUsers}
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-white/80 transition hover:bg-white/15"
        >
          Refresh
        </button>

        <button
          type="button"
          onClick={exportUsersToCsv}
          className="rounded-xl border border-emerald-400/25 bg-emerald-400/15 px-4 py-2 text-xs font-black text-emerald-200 transition hover:bg-emerald-400/20"
        >
          Export CSV
        </button>
      </div>
    </div>

    <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
        <p className="text-[11px] font-black uppercase tracking-wide text-white/45">
          Users
        </p>
        <p className="mt-1 text-2xl font-black text-white">
          {users.length}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
        <p className="text-[11px] font-black uppercase tracking-wide text-white/45">
          Active
        </p>
        <p className="mt-1 text-2xl font-black text-emerald-200">
          {users.filter((item) => item.status === "active").length}
        </p>
      </div>

      <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
        <p className="text-[11px] font-black uppercase tracking-wide text-yellow-100/70">
          Visible Balance
        </p>
        <p className="mt-1 text-2xl font-black text-yellow-200">
          {formatMoney(
            filteredUsers.reduce(
              (total, item) => total + getDisplayBalance(item),
              0
            )
          )}
        </p>
      </div>

      <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 p-4">
        <p className="text-[11px] font-black uppercase tracking-wide text-fuchsia-100/70">
          Lucky Steps
        </p>
        <p className="mt-1 text-2xl font-black text-fuchsia-200">
          {Object.values(orderStatsByUser).reduce(
            (total, item) => total + item.luckySteps.length,
            0
          )}
        </p>
      </div>
    </div>

    <div className="mt-5 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-[1.4fr_0.7fr_0.8fr_0.9fr_0.55fr]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder={t.filters.searchPlaceholder}
          className="h-11 w-full rounded-xl border border-white/10 bg-black/35 py-2 pl-10 pr-3 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-yellow-400/60"
        />
      </div>

      <select
        value={roleFilter}
        onChange={(event) =>
          setRoleFilter(
            event.target.value as "all" | "user" | "admin" | "super" | "support"
          )
        }
        className="h-11 rounded-xl border border-white/10 bg-black/35 px-3 text-sm font-black text-white outline-none focus:border-yellow-400/60"
      >
        <option className="bg-slate-950" value="all">
          {t.filters.allRoles}
        </option>
        <option className="bg-slate-950" value="user">
          {t.filters.users}
        </option>
        <option className="bg-slate-950" value="admin">
          {t.filters.admin}
        </option>
        <option className="bg-slate-950" value="super">
          {t.filters.super}
        </option>
        <option className="bg-slate-950" value="support">
          {t.filters.support}
        </option>
      </select>

      <select
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value)}
        className="h-11 rounded-xl border border-white/10 bg-black/35 px-3 text-sm font-black text-white outline-none focus:border-yellow-400/60"
      >
        <option className="bg-slate-950" value="all">
          {t.filters.allStatus}
        </option>
        {userStatuses.map((status) => (
          <option key={status} className="bg-slate-950" value={status}>
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
        className="h-11 rounded-xl border border-white/10 bg-black/35 px-3 text-sm font-black text-white outline-none focus:border-yellow-400/60"
      >
        <option className="bg-slate-950" value="newest">
          {t.filters.newestFirst}
        </option>
        <option className="bg-slate-950" value="name">
          {t.filters.nameAz}
        </option>
        <option className="bg-slate-950" value="balance_high">
          {t.filters.balanceHigh}
        </option>
        <option className="bg-slate-950" value="today_high">
          {t.filters.todayHigh}
        </option>
        <option className="bg-slate-950" value="step_high">
          {t.filters.stepHigh}
        </option>
      </select>

      <select
        value={pageSize}
        onChange={(event) => setPageSize(Number(event.target.value))}
        className="h-11 rounded-xl border border-white/10 bg-black/35 px-3 text-sm font-black text-white outline-none focus:border-yellow-400/60"
      >
        <option className="bg-slate-950" value={10}>10 rows</option>
        <option className="bg-slate-950" value={25}>25 rows</option>
        <option className="bg-slate-950" value={50}>50 rows</option>
        <option className="bg-slate-950" value={100}>100 rows</option>
      </select>
    </div>

    <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-[0.7fr_0.7fr_0.7fr_0.7fr_auto]">
      <input
        value={minBalanceFilter}
        onChange={(event) => setMinBalanceFilter(event.target.value)}
        type="number"
        placeholder={t.filters.minBalance}
        className="h-10 rounded-xl border border-white/10 bg-black/25 px-3 text-xs font-bold text-white outline-none placeholder:text-white/30 focus:border-yellow-400/60"
      />

      <input
        value={maxBalanceFilter}
        onChange={(event) => setMaxBalanceFilter(event.target.value)}
        type="number"
        placeholder={t.filters.maxBalance}
        className="h-10 rounded-xl border border-white/10 bg-black/25 px-3 text-xs font-bold text-white outline-none placeholder:text-white/30 focus:border-yellow-400/60"
      />

      <input
        value={minStepFilter}
        onChange={(event) => setMinStepFilter(event.target.value)}
        type="number"
        placeholder={t.filters.minStep}
        className="h-10 rounded-xl border border-white/10 bg-black/25 px-3 text-xs font-bold text-white outline-none placeholder:text-white/30 focus:border-yellow-400/60"
      />

      <input
        value={maxStepFilter}
        onChange={(event) => setMaxStepFilter(event.target.value)}
        type="number"
        placeholder={t.filters.maxStep}
        className="h-10 rounded-xl border border-white/10 bg-black/25 px-3 text-xs font-bold text-white outline-none placeholder:text-white/30 focus:border-yellow-400/60"
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
        className="h-10 rounded-xl border border-red-300/25 bg-red-400/10 px-4 text-xs font-black text-red-100 transition hover:bg-red-400/15"
      >
        Clear
      </button>
    </div>
  </div>

  {loading && (
    <div className="p-10 text-center text-sm font-bold text-slate-500">
      {t.loadingUsers}
    </div>
  )}

  {!loading && filteredUsers.length === 0 && (
    <div className="p-12 text-center">
      <Users className="mx-auto mb-3 h-10 w-10 text-yellow-500" />
      <p className="text-lg font-black text-slate-950">{t.noUsersFound}</p>
      <p className="mt-2 text-sm font-medium text-slate-500">
        {t.noUsersNote}
      </p>
    </div>
  )}

  {!loading && filteredUsers.length > 0 && (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1380px] border-collapse text-left text-xs">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="border-b border-slate-200 px-5 py-4">
                User
              </th>
              <th className="border-b border-slate-200 px-4 py-4">
                Wallet
              </th>
              <th className="border-b border-slate-200 px-4 py-4">
                Earnings
              </th>
              <th className="border-b border-slate-200 px-4 py-4">
                Campaign
              </th>
              <th className="border-b border-slate-200 px-4 py-4">
                Account
              </th>
              <th className="border-b border-slate-200 px-5 py-4 text-right">
                Controls
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
  {paginatedUsers.map((user) => {
    const isUserAdmin = user.role === "admin";
    const displayBalance = getDisplayBalance(user);
    const depositBalance = Number(user.deposited_balance || 0);
    const referralBalance = Number(user.referral_bonus_balance || 0);
    const profitBalance = Number(user.task_profit_balance || 0);
    const orderSummary = orderStatsByUser[user.id];

    const campaignTotal = orderSummary?.maxStep || 0;
    const completedOrders = orderSummary?.completedOrders || 0;
    const pendingOrders = orderSummary?.pendingOrders || 0;
    const luckySteps = orderSummary?.luckySteps || [];

    const progressPercent =
      campaignTotal > 0
        ? Math.min(100, Math.round((completedOrders / campaignTotal) * 100))
        : 0;

    return (
      <tr
        key={user.id}
        className={`bg-white transition hover:bg-yellow-50/50 ${
          user.status === "active" ? "border-l-4 border-l-emerald-400" : "border-l-4 border-l-red-400"
        }`}
      >
        <td className="px-5 py-3 align-middle">
          <div className="flex min-w-[340px] items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                isUserAdmin
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-blue-100 bg-blue-50 text-blue-700"
              }`}
            >
              {isUserAdmin ? (
                <Crown className="h-4 w-4" />
              ) : (
                <Users className="h-4 w-4" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="max-w-[170px] truncate text-sm font-black text-slate-950">
                  {user.display_name || t.row.noName}
                </p>

                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                    user.status === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {user.status}
                </span>

                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase text-slate-600">
                  {user.role}
                </span>
              </div>

              <p className="mt-0.5 truncate text-xs font-semibold text-slate-600">
                {user.email || t.row.noEmail}
              </p>

              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold text-slate-500">
                <span>
                  ID:{" "}
                  <b className="text-slate-900">
                    {user.member_id || shortId(user.id)}
                  </b>
                </span>

                <span>
                  Phone:{" "}
                  <b className="text-slate-900">{user.phone || "-"}</b>
                </span>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setNicknameUser(user);
                    setNicknameValue(user.admin_nickname || "");
                  }}
                  disabled={!canEditUserInfo}
                  className="rounded-md border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-[10px] font-black text-yellow-700 hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Note: {user.admin_nickname || "None"}
                </button>

                <button
                  onClick={() => {
                    setReferralUser(user);
                    setReferralValue(user.referral_code || "");
                  }}
                  disabled={!canEditUserInfo}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-black text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Code: {user.referral_code || "-"}
                </button>
              </div>
            </div>
          </div>
        </td>

        <td className="px-4 py-3 align-middle">
          <div className="min-w-[210px]">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              Total Balance
            </p>

            <p className="text-2xl font-black leading-tight tracking-tight text-slate-950">
              {formatMoney(displayBalance)}
            </p>

            <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-black uppercase text-blue-700">
                  Deposit
                </span>
                <span className="font-black text-slate-950">
                  {formatMoney(depositBalance)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="font-black uppercase text-amber-700">
                  Referral
                </span>
                <span className="font-black text-slate-950">
                  {formatMoney(referralBalance)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="font-black uppercase text-emerald-700">
                  Profit
                </span>
                <span className="font-black text-slate-950">
                  {formatMoney(profitBalance)}
                </span>
              </div>
            </div>
          </div>
        </td>

        <td className="px-4 py-3 align-middle">
          <div className="min-w-[150px] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-400">
                Today
              </span>
              <span className="text-sm font-black text-slate-950">
                {formatMoney(user.today_earnings)}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
              <span className="text-[10px] font-black uppercase text-slate-400">
                Total
              </span>
              <span className="text-sm font-black text-slate-950">
                {formatMoney(user.total_earnings)}
              </span>
            </div>
          </div>
        </td>

        <td className="px-4 py-3 align-middle">
          <div className="min-w-[260px]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                  Campaign
                </p>

                <p className="text-lg font-black text-slate-950">
                  {campaignTotal > 0
                    ? `${completedOrders}/${campaignTotal}`
                    : "No orders"}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-slate-400">
                  Step
                </p>

                <p className="text-xl font-black text-slate-950">
                  {user.current_step}
                </p>
              </div>
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-emerald-400"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                Done {completedOrders}
              </span>

              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">
                Left {pendingOrders}
              </span>

              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-700">
                {progressPercent}%
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2">
              <span className="text-[10px] font-black uppercase text-slate-400">
                Lucky:
              </span>

              {luckySteps.length > 0 ? (
                <>
                  {luckySteps.slice(0, 5).map((step) => (
                    <span
                      key={step}
                      className="rounded-md bg-fuchsia-100 px-2 py-0.5 text-[10px] font-black text-fuchsia-700"
                    >
                      {step}/{campaignTotal || step}
                    </span>
                  ))}

                  {luckySteps.length > 5 && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">
                      +{luckySteps.length - 5}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[10px] font-bold text-slate-400">
                  No lucky bonus
                </span>
              )}
            </div>
          </div>
        </td>

        <td className="px-4 py-3 align-middle">
          <div className="min-w-[145px] space-y-1 text-[11px] font-bold text-slate-500">
            <div>
              <span
                className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                  user.status === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {user.status}
              </span>
            </div>

            <p>
              Role:{" "}
              <b className="text-slate-950">{user.role}</b>
            </p>

            <p>
              Created:{" "}
              <b className="text-slate-950">{formatDate(user.created_at)}</b>
            </p>

            <p>
              Lang:{" "}
              <b className="text-slate-950">{user.language || "en"}</b>
            </p>
          </div>
        </td>

        <td className="px-5 py-3 align-middle">
          <div className="flex min-w-[270px] flex-wrap justify-end gap-1.5">
            <button
              onClick={() => openGenerateOrdersModal(user)}
              disabled={!canManageOrders || user.role !== "user"}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-yellow-400 px-2.5 py-1.5 text-[11px] font-black text-slate-950 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <PackagePlus className="h-3.5 w-3.5" />
              Generate
            </button>

            <button
              onClick={() => openViewOrdersModal(user)}
              disabled={!canManageOrders || user.role !== "user"}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Eye className="h-3.5 w-3.5" />
              Orders
            </button>

            <button
              onClick={() => openLuckyOrderModal(user)}
              disabled={!canManageOrders || user.role !== "user"}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-fuchsia-500 px-2.5 py-1.5 text-[11px] font-black text-white hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Lucky
            </button>

            <button
              onClick={() => {
                setSelectedUser(user);
                setAdjustAmount(100);
                setAdjustNote("");
              }}
              disabled={!canManageMoney}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-black text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Pencil className="h-3.5 w-3.5" />
              Balance
            </button>

            <button
              onClick={() => {
                setReferralBonusUser(user);
                setReferralBonusAmount(Number(user.referral_bonus_balance || 0));
              }}
              disabled={!canManageMoney || user.role !== "user"}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-black text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Referral
            </button>

            <button
              onClick={() => openSecurityReset(user)}
              disabled={!canManageSecurity}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-black text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Security
            </button>

            <button
              onClick={() => {
                setResetOrdersUser(user);
                setResetOrdersConfirmText("");
                setResetOrdersResetStep(true);
              }}
              disabled={!canManageOrders || user.role !== "user"}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-[11px] font-black text-orange-700 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>

            <button
              onClick={() => {
                setDeleteUser(user);
                setDeleteConfirmText("");
              }}
              disabled={
                !canDeleteUsers ||
                user.id === profile.id ||
                user.role !== "user"
              }
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-black text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </td>
      </tr>
    );
  })}
</tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 text-xs font-bold text-slate-500 md:flex-row md:items-center md:justify-between">
        <p>
          Showing{" "}
          <span className="font-black text-slate-950">{firstResult}</span>
          {" - "}
          <span className="font-black text-slate-950">{lastResult}</span>
          {" of "}
          <span className="font-black text-yellow-700">
            {filteredUsers.length}
          </span>{" "}
          users
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </button>

          <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2 text-[11px] font-black text-yellow-700">
            Page {currentPage} / {totalPages}
          </div>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
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
    profitRate={generateProfitRate}
    resetExisting={generateResetExisting}
    actionLoading={actionLoading}
    t={t.generateModal}
    onTaskCountChange={setGenerateTaskCount}
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
    recommendedProduct={pickRecommendedLuckyProduct(
      luckyProducts,
      luckyAmount
    )}
    selectedProductId={luckyProductId}
    stepNumber={luckyStepNumber}
    luckyAmount={luckyAmount}
    profitRate={luckyProfitRate}
    actionLoading={actionLoading}
    t={t.luckyModal}
    onProductChange={setLuckyProductId}
    onStepNumberChange={setLuckyStepNumber}
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
  onDeleteOrder={handleDeleteGeneratedOrder}
  onEditLuckyOrder={openEditLuckyOrderModal}
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
