//src>lib>adminPermissions.ts

export type AdminRole = "admin" | "super" | "support";

const ADMIN_ROOT_PATH = "/admin";

const ADMIN_ALLOWED_PATHS = [
  "/admin/users",
  "/admin/wallet-requests",
  "/admin/wallet-addresses",
  "/admin/support",
];

const SUPPORT_ALLOWED_PATHS = ["/admin/support"];

export function isAdminRole(role?: string | null): role is AdminRole {
  return role === "admin" || role === "super" || role === "support";
}

function pathMatches(pathname: string, basePath: string) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function isAllowedAdminPath(pathname: string) {
  if (pathname === ADMIN_ROOT_PATH) {
    return true;
  }

  return ADMIN_ALLOWED_PATHS.some((path) => pathMatches(pathname, path));
}

export function canAccessAdminPath(
  role: string | null | undefined,
  pathname: string
) {
  if (role === "admin" || role === "super") {
    return isAllowedAdminPath(pathname);
  }

  if (role === "support") {
    return SUPPORT_ALLOWED_PATHS.some((path) => pathMatches(pathname, path));
  }

  return false;
}