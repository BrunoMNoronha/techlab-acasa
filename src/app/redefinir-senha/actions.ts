"use server";

import { redirect } from "next/navigation";
import type { AuthFormState } from "@/lib/auth/form-state";
import { hasPasswordRecoveryProof } from "@/lib/auth/identity";
import { authMessages } from "@/lib/auth/messages";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { isValidPassword, readFormString } from "@/lib/auth/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updatePassword(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = readFormString(formData, "password");
  const confirmation = readFormString(formData, "passwordConfirmation");

  if (!isValidPassword(password)) {
    return { status: "error", message: authMessages.passwordTooShort };
  }

  if (password !== confirmation) {
    return { status: "error", message: authMessages.passwordMismatch };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error: claimsError } = await supabase.auth.getClaims();

  // Somente sessões iniciadas por link de recuperação podem definir nova senha
  // sem informar a senha atual; uma sessão comum é recusada.
  if (claimsError || !hasPasswordRecoveryProof(data?.claims)) {
    return { status: "error", message: authMessages.recoverySessionInvalid };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { status: "error", message: describePasswordUpdateError(error.code) };
  }

  // Encerra a sessão iniciada pelo link de recuperação; o usuário entra com a nova senha.
  await supabase.auth.signOut();

  redirect(`${LOGIN_PATH}?status=senha-atualizada`);
}

function describePasswordUpdateError(code: string | undefined): string {
  switch (code) {
    case "same_password":
      return authMessages.passwordSameAsCurrent;
    case "weak_password":
      return authMessages.passwordTooShort;
    default:
      return authMessages.passwordUpdateFailed;
  }
}
