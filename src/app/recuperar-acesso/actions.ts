"use server";

import type { AuthFormState } from "@/lib/auth/form-state";
import { authMessages } from "@/lib/auth/messages";
import { getRequestOrigin } from "@/lib/auth/request-origin";
import { AUTH_CALLBACK_PATH, PASSWORD_RESET_PATH } from "@/lib/auth/routes";
import { isValidEmail, normalizeEmail, readFormString } from "@/lib/auth/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requestPasswordRecovery(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = normalizeEmail(readFormString(formData, "email"));

  if (!isValidEmail(email)) {
    return { status: "error", message: authMessages.invalidEmail };
  }

  const supabase = await createSupabaseServerClient();
  const origin = await getRequestOrigin();
  const redirectTo = origin
    ? `${origin}${AUTH_CALLBACK_PATH}?next=${encodeURIComponent(PASSWORD_RESET_PATH)}`
    : undefined;

  const { error } = await supabase.auth.resetPasswordForEmail(
    email,
    redirectTo ? { redirectTo } : undefined,
  );

  if (error) {
    // Registro sem e-mail nem token; a resposta ao usuário continua genérica.
    console.error("[auth] Falha ao solicitar recuperação de acesso.", {
      code: error.code,
      status: error.status,
    });
  }

  return { status: "success", message: authMessages.recoveryRequested };
}
