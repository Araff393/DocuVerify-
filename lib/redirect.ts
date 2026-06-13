export const DEFAULT_ADMIN_REDIRECT = "/admin/dashboard";

const BASE_URL = "https://docuverify.local";

export function getSafeAdminRedirect(
  redirect: string | null | undefined
): string {
  const value = redirect?.trim();
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_ADMIN_REDIRECT;
  }

  try {
    const url = new URL(value, BASE_URL);
    if (url.origin !== BASE_URL) {
      return DEFAULT_ADMIN_REDIRECT;
    }

    const decodedPath = decodeURIComponent(url.pathname);
    const pathSegments = decodedPath.split("/");
    const hasUnsafeSegment =
      decodedPath.includes("\\") ||
      pathSegments.includes("..") ||
      pathSegments.includes(".");

    if (
      hasUnsafeSegment ||
      !url.pathname.startsWith("/admin/") ||
      url.pathname === "/admin/login" ||
      url.pathname.startsWith("/admin/login/")
    ) {
      return DEFAULT_ADMIN_REDIRECT;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_ADMIN_REDIRECT;
  }
}
