import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Member,
  MemberInput,
  MemberListParams,
  MembershipCategory,
  PaginatedMembersResult,
} from "./types";
import { isValidUuid, sanitizeIlikePattern } from "./validation";

export const DEFAULT_PAGE_SIZE = 25;

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
 * Consulta a listagem paginada de associados com filtros e pesquisa no banco (P2-03).
 *
 * Requisitos atendidos:
 * - RF-003 / RNF-008: busca textual por nome/razão social (`members.name`), filtros
 *   por `person_type` e `membership_category_code`, e paginação server-side.
 * - Ordenação determinística: `name ASC`, com desempate por `id ASC`.
 * - Segurança: parâmetros de ILIKE são sanitizados contra injeção de wildcards;
 *   filtros são aplicados via API tipada do PostgREST; RLS ativo com sessão do operador.
 */
export async function listMembers(
  params: MemberListParams = {},
): Promise<PaginatedMembersResult> {
  const pageSize = DEFAULT_PAGE_SIZE;
  const page = params.page && params.page >= 1 ? Math.floor(params.page) : 1;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("members")
    .select(
      "id, person_type, name, membership_category_code, email, phone, created_at, updated_at",
      { count: "exact" },
    );

  // 1. Pesquisa textual por nome / razão social
  if (params.q) {
    const escaped = sanitizeIlikePattern(params.q);
    query = query.ilike("name", `%${escaped}%`);
  }

  // 2. Filtro por tipo de pessoa (PF / PJ)
  if (params.personType) {
    query = query.eq("person_type", params.personType);
  }

  // 3. Filtro por categoria estatutária
  if (params.category) {
    query = query.eq("membership_category_code", params.category);
  }

  // 4. Ordenação determinística e paginação server-side
  query = query
    .order("name", { ascending: true })
    .order("id", { ascending: true })
    .range(from, to);

  const { data, count, error } = await query;

  if (error || !data) {
    return {
      items: [],
      page,
      pageSize,
      totalCount: 0,
      totalPages: 1,
    };
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    items: data as Member[],
    page,
    pageSize,
    totalCount,
    totalPages,
  };
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
