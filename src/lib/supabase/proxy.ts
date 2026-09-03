import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import {
  LOGIN_PATH,
  PROTECTED_HOME_PATH,
  isAnonymousOnlyPath,
  isProtectedPath,
} from "@/lib/auth/routes";
import { describeError, logger } from "@/lib/observability/logger";
import { getSupabasePublicConfig } from "./env";

/**
 * Renova a sessão Supabase a partir dos cookies da requisição e devolve uma
 * resposta com os cookies atualizados. Faz apenas redirecionamento otimista:
 * páginas e handlers protegidos revalidam a identidade no servidor.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });
  const { url, publishableKey } = getSupabasePublicConfig();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Não executar código entre createServerClient e getClaims(): isso pode
  // impedir a renovação da sessão e causar logout inesperado do usuário.
  const isAuthenticated = await hasVerifiedClaims(supabase);
  const { pathname } = request.nextUrl;

  if (!isAuthenticated && isProtectedPath(pathname)) {
    return redirectPreservingCookies(request, LOGIN_PATH, supabaseResponse);
  }

  if (isAuthenticated && isAnonymousOnlyPath(pathname)) {
    return redirectPreservingCookies(request, PROTECTED_HOME_PATH, supabaseResponse);
  }

  return supabaseResponse;
}

async function hasVerifiedClaims(supabase: SupabaseClient): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getClaims();

    return !error && typeof data?.claims?.sub === "string";
  } catch (error) {
    // Exceção (não um resultado de "sessão inválida", que é fluxo normal):
    // tratar como anônimo (negação por padrão) e registrar sem cookies/claims.
    logger.warn("auth.session_check_failed", { ...describeError(error), routeType: "proxy" });

    return false;
  }
}

function redirectPreservingCookies(
  request: NextRequest,
  pathname: string,
  sessionResponse: NextResponse,
): NextResponse {
  const target = request.nextUrl.clone();
  target.pathname = pathname;
  target.search = "";

  const redirect = NextResponse.redirect(target);
  sessionResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));

  return redirect;
}
