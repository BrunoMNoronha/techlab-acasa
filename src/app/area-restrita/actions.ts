"use server";

import { redirect } from "next/navigation";
import type { AuthFormState } from "@/lib/auth/form-state";
import { authMessages } from "@/lib/auth/messages";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function logout(): Promise<AuthFormState> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    // Sem confirmação do Auth server a sessão local pode continuar válida:
    // informar a falha em vez de anunciar um logout que não ocorreu.
    return { status: "error", message: authMessages.logoutFailed };
  }

  redirect(`${LOGIN_PATH}?status=sessao-encerrada`);
}
