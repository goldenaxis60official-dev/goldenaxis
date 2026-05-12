// src/lib/adminPermissions.ts

export type AdminRole = "admin" | "leader" | "support";

const ADMIN_ROOT_PATH = "/admin";

const SCOPED_STAFF_BLOCKED_PATHS = ["/admin/wallet-addresses"];

export function isAdminRole(role?: string | null): role is AdminRole {
  return role === "admin" || role === "leader" || role === "support";
}

function pathMatches(pathname: string, basePath: string) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function isAdminArea(pathname: string) {
  return pathname === ADMIN_ROOT_PATH || pathname.startsWith(`${ADMIN_ROOT_PATH}/`);
}

function isScopedStaff(role: string | null | undefined) {
  return role === "leader" || role === "support";
}

export function canAccessAdminPath(
  role: string | null | undefined,
  pathname: string
) {
  if (role === "admin") {
    return isAdminArea(pathname);
  }

  if (isScopedStaff(role)) {
    return (
      isAdminArea(pathname) &&
      !SCOPED_STAFF_BLOCKED_PATHS.some((path) =>
        pathMatches(pathname, path)
      )
    );
  }

  return false;
}