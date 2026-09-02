import type { JwtPayload } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LOGIN_PATH } from "./routes";

export type AuthenticatedIdentity = {
  userId: string;
};

/**
 * Métodos de autenticação (claim `amr`) que comprovam posse do link/código
 * enviado por e-mail. O Supabase Auth registra `otp` para sessões iniciadas por
 * link de recuperação (verificado empiricamente na CLI 2.116.0); `recovery` é
 * aceito por compatibilidade com versões que usem esse identificador.
 */
const RECOVERY_AUTHENTICATION_METHODS = new Set(["otp", "recovery"]);

/** Janela máxima entre a verificação do link de recuperação e a troca de senha. */
export const RECOVERY_PROOF_MAX_AGE_SECONDS = 15 * 60;

type ClaimsWithAuthenticationMethods = {
  amr?: unknown;
  [claim: string]: unknown;
};

function toIdentity(claims: JwtPayload | null | undefined): AuthenticatedIdentity | null {
  return typeof claims?.sub === "string" ? { userId: claims.sub } : null;
}

function isFreshRecoveryMethod(entry: unknown, nowInSeconds: number): boolean {
  if (typeof entry !== "object" || entry === null) {
    return false;
  }

  const { method, timestamp } = entry as { method?: unknown; timestamp?: unknown };

  return (
    typeof method === "string" &&
    RECOVERY_AUTHENTICATION_METHODS.has(method) &&
    typeof timestamp === "number" &&
    nowInSeconds - timestamp <= RECOVERY_PROOF_MAX_AGE_SECONDS
  );
}

/**
 * Indica se a sessão foi iniciada recentemente por um link de recuperação de
 * senha, usando a claim `amr` (Authentication Methods References) do JWT
 * verificado. Uma sessão comum (método `password`) não serve como prova.
 */
export function hasPasswordRecoveryProof(
  claims: ClaimsWithAuthenticationMethods | null | undefined,
  nowInSeconds: number = Math.floor(Date.now() / 1000),
): boolean {
  const methods = claims?.amr;

  return (
    Array.isArray(methods) && methods.some((entry) => isFreshRecoveryMethod(entry, nowInSeconds))
  );
}

/**
 * Identidade mínima da sessão, verificada no servidor com `getClaims()`
 * (assinatura do JWT validada). Retorna `null` para anônimo ou sessão inválida.
 * Não usa `getSession()` como fundamento de autorização.
 */
export async function getAuthenticatedIdentity(): Promise<AuthenticatedIdentity | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    return null;
  }

  return toIdentity(data?.claims);
}

/**
 * Identidade de uma sessão de recuperação de senha. Uma sessão comum
 * (login por senha) não é aceita: a troca de senha sem senha atual exige
 * prova de posse do link de recuperação.
 */
export async function getPasswordRecoveryIdentity(): Promise<AuthenticatedIdentity | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !hasPasswordRecoveryProof(data?.claims)) {
    return null;
  }

  return toIdentity(data?.claims);
}

/** Exige sessão autenticada; caso contrário redireciona para o login. */
export async function requireAuthenticatedIdentity(): Promise<AuthenticatedIdentity> {
  const identity = await getAuthenticatedIdentity();

  if (!identity) {
    redirect(LOGIN_PATH);
  }

  return identity;
}
