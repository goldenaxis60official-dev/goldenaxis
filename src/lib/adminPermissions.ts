// src/lib/adminPermissions.ts

export type AdminRole = "admin" | "super" | "support";

const ADMIN_ROOT_PATH = "/admin";

const SUPER_BLOCKED_PATHS = ["/admin/wallet-addresses"];

const SUPPORT_ALLOWED_PATHS = ["/admin/users", "/admin/support"];

export function isAdminRole(role?: string | null): role is AdminRole {
  return role === "admin" || role === "super" || role === "support";
}

function pathMatches(pathname: string, basePath: string) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function isAdminArea(pathname: string) {
  return pathname === ADMIN_ROOT_PATH || pathname.startsWith(`${ADMIN_ROOT_PATH}/`);
}

export function canAccessAdminPath(
  role: string | null | undefined,
  pathname: string
) {
  if (role === "admin") {
    return isAdminArea(pathname);
  }

  if (role === "super") {
    return (
      isAdminArea(pathname) &&
      !SUPER_BLOCKED_PATHS.some((path) => pathMatches(pathname, path))
    );
  }

  if (role === "support") {
    return SUPPORT_ALLOWED_PATHS.some((path) => pathMatches(pathname, path));
  }

  return false;
}