import "server-only";

import type { AuthenticatedIdentity } from "./identity";
import { requireAuthenticatedIdentity } from "./identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Erro genérico para não revelar dados nem detalhes da concessão. */
export class MemberAdministrationAccessDeniedError extends Error {
  constructor() {
    super("Acesso negado.");
    this.name = "MemberAdministrationAccessDeniedError";
  }
}

function denyAccess(): never {
  throw new MemberAdministrationAccessDeniedError();
}

/**
 * Exige a capacidade corrente `manage_members` para a identidade da requisição.
 *
 * A identidade é verificada pelo fluxo de autenticação existente. O RPC não
 * recebe identificador, papel ou decisão do cliente e é consultado novamente a
 * cada chamada. Qualquer falha ou resposta diferente do booleano `true` nega.
 */
export async function requireMemberAdministration(): Promise<AuthenticatedIdentity> {
  const identity = await requireAuthenticatedIdentity();

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("can_manage_members");

    if (error || data !== true) {
      return denyAccess();
    }

    return identity;
  } catch {
    return denyAccess();
  }
}
