import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LOGIN_PATH } from "./routes";

export type AuthenticatedIdentity = {
  userId: string;
};

/**
 * Identidade mínima da sessão, verificada no servidor com `getClaims()`
 * (assinatura do JWT validada). Retorna `null` para anônimo ou sessão inválida.
 * Não usa `getSession()` como fundamento de autorização.
 */
export async function getAuthenticatedIdentity(): Promise<AuthenticatedIdentity | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || typeof data?.claims?.sub !== "string") {
    return null;
  }

  return { userId: data.claims.sub };
}

/** Exige sessão autenticada; caso contrário redireciona para o login. */
export async function requireAuthenticatedIdentity(): Promise<AuthenticatedIdentity> {
  const identity = await getAuthenticatedIdentity();

  if (!identity) {
    redirect(LOGIN_PATH);
  }

  return identity;
}
