import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import {
  PASSWORD_RECOVERY_PATH,
  PROTECTED_HOME_PATH,
  resolveSafeRedirectPath,
} from "@/lib/auth/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Callback PKCE: troca o `code` recebido do Supabase Auth por uma sessão
 * (cookies gravados via `@supabase/ssr`) e redireciona para um caminho interno.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = resolveSafeRedirectPath(searchParams.get("next"), PROTECTED_HOME_PATH);

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      redirect(next);
    }
  }

  redirect(`${PASSWORD_RECOVERY_PATH}?erro=link-invalido`);
}
