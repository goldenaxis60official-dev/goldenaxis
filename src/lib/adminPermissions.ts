export type AdminRole = "admin" | "super" | "support";

const SUPPORT_ALLOWED_PATHS = ["/admin/support", "/admin/user-tasks"];

const SUPER_BLOCKED_PATHS = ["/admin/wallet-addresses"];

export function isAdminRole(role?: string | null): role is AdminRole {
  return role === "admin" || role === "super" || role === "support";
}

function pathMatches(pathname: string, basePath: string) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export function canAccessAdminPath(
  role: string | null | undefined,
  pathname: string
) {
  if (role === "admin") return true;

  if (role === "super") {
    return !SUPER_BLOCKED_PATHS.some((path) => pathMatches(pathname, path));
  }

  if (role === "support") {
    return SUPPORT_ALLOWED_PATHS.some((path) => pathMatches(pathname, path));
  }

  return false;
}