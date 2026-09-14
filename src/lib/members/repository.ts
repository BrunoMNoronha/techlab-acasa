import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Member, MemberInput, MembershipCategory } from "./types";
import { isValidUuid } from "./validation";

/**
 * Consulta a lista de categorias estatutárias diretamente do banco de dados.
 * A tabela `membership_categories` é a fonte oficial do catálogo (Estatuto 2025).
 */
export async function getMembershipCategories(): Promise<MembershipCategory[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("membership_categories")
    .select("code, name")
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as MembershipCategory[];
}

/**
 * Consulta a listagem simples de associados cadastrados.
 * Ordenação determinística por nome.
 */
export async function listMembers(): Promise<Member[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("members")
    .select("id, person_type, name, membership_category_code, email, phone, created_at, updated_at")
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as Member[];
}

/**
 * Consulta um associado específico pelo seu identificador UUID.
 * Se o identificador não for um UUID válido ou o registro não existir, retorna `null`.
 */
export async function getMemberById(id: string): Promise<Member | null> {
  if (!isValidUuid(id)) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("members")
    .select("id, person_type, name, membership_category_code, email, phone, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Member;
}

/**
 * Insere um novo associado no banco de dados sob a sessão do operador autenticado.
 * Grava exclusivamente as cinco colunas de negócio autorizadas.
 */
export async function insertMember(input: MemberInput): Promise<Member> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("members")
    .insert({
      person_type: input.person_type,
      name: input.name,
      membership_category_code: input.membership_category_code,
      email: input.email,
      phone: input.phone,
    })
    .select("id, person_type, name, membership_category_code, email, phone, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Falha ao cadastrar associado.");
  }

  return data as Member;
}

/**
 * Atualiza um associado existente sob a sessão do operador autenticado.
 * Modifica exclusivamente as cinco colunas de negócio autorizadas.
 */
export async function updateMember(id: string, input: MemberInput): Promise<Member> {
  if (!isValidUuid(id)) {
    throw new Error("Identificador inválido.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("members")
    .update({
      person_type: input.person_type,
      name: input.name,
      membership_category_code: input.membership_category_code,
      email: input.email,
      phone: input.phone,
    })
    .eq("id", id)
    .select("id, person_type, name, membership_category_code, email, phone, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Falha ao atualizar associado.");
  }

  return data as Member;
}
