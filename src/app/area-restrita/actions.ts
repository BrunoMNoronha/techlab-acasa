"use server";

import { redirect } from "next/navigation";
import type { AuthFormState } from "@/lib/auth/form-state";
import { authMessages } from "@/lib/auth/messages";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { logger } from "@/lib/observability/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function logout(): Promise<AuthFormState> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    // Sem confirmação do Auth server a sessão local pode continuar válida:
    // informar a falha em vez de anunciar um logout que não ocorreu.
    // Falha técnica (não é fluxo esperado): registrar somente código/status.
    logger.warn("auth.logout_failed", { errorCode: error.code, status: error.status });

    return { status: "error", message: authMessages.logoutFailed };
  }

  redirect(`${LOGIN_PATH}?status=sessao-encerrada`);
}
