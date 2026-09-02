export const LOGIN_PATH = "/login";
export const PROTECTED_HOME_PATH = "/area-restrita";
export const PASSWORD_RECOVERY_PATH = "/recuperar-acesso";
export const PASSWORD_RESET_PATH = "/redefinir-senha";
export const AUTH_CALLBACK_PATH = "/auth/callback";

const PROTECTED_PREFIXES = [PROTECTED_HOME_PATH];
const ANONYMOUS_ONLY_PATHS = [LOGIN_PATH];

/** Rotas que exigem sessão autenticada. A própria rota revalida no servidor. */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Rotas públicas de autenticação que não fazem sentido para quem já está autenticado. */
export function isAnonymousOnlyPath(pathname: string): boolean {
  return ANONYMOUS_ONLY_PATHS.includes(pathname);
}

/**
 * Aceita somente caminhos relativos internos (`/algo`), rejeitando URLs
 * absolutas, protocolo-relativas (`//host`) e variações com barra invertida,
 * para evitar open redirect.
 */
export function resolveSafeRedirectPath(
  candidate: string | null | undefined,
  fallback: string,
): string {
  if (!candidate || !candidate.startsWith("/")) {
    return fallback;
  }

  if (candidate.startsWith("//") || /[\\\s]/.test(candidate)) {
    return fallback;
  }

  try {
    const base = "http://internal.invalid";
    const parsed = new URL(candidate, base);

    if (parsed.origin !== base) {
      return fallback;
    }
  } catch {
    return fallback;
  }

  return candidate;
}
