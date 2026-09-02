"use server";

import { redirect } from "next/navigation";
import type { AuthFormState } from "@/lib/auth/form-state";
import { authMessages } from "@/lib/auth/messages";
import { PROTECTED_HOME_PATH } from "@/lib/auth/routes";
import { isValidEmail, normalizeEmail, readFormString } from "@/lib/auth/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function login(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = normalizeEmail(readFormString(formData, "email"));
  const password = readFormString(formData, "password");

  if (!isValidEmail(email) || password.length === 0) {
    return { status: "error", message: authMessages.missingCredentials };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Mensagem única para qualquer falha: evita enumeração de contas.
    return { status: "error", message: authMessages.loginFailed };
  }

  redirect(PROTECTED_HOME_PATH);
}
