#!/usr/bin/env node
/**
 * Integração Auth + Data API do cadastro e consulta de associados (P2-02 e P2-03).
 *
 * Valida autorização seletiva, isolamento por RLS, CRUD de dados mínimos, pesquisa
 * textual, filtros, paginação server-side e revogação imediata com Auth real,
 * JWT assinado, chave publicável e Data API (não é E2E de navegador/interface).
 */
import { spawnSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { sanitizeIlikePattern } from "../src/lib/members/validation.ts";

function readLocalSupabaseEnvironment() {
  const supabaseCli = fileURLToPath(
    new URL("../node_modules/supabase/dist/supabase.js", import.meta.url),
  );
  const result = spawnSync(process.execPath, [supabaseCli, "status", "-o", "env"], {
    encoding: "utf8",
    windowsHide: true,
  });

  if (result.status !== 0) {
    throw new Error("A stack Supabase local não está disponível.");
  }

  const environment = Object.fromEntries(
    result.stdout
      .split(/\r?\n/)
      .map((line) => line.match(/^([A-Z0-9_]+)="(.*)"$/))
      .filter(Boolean)
      .map((match) => [match[1], match[2]]),
  );

  if (!environment.API_URL || !environment.PUBLISHABLE_KEY || !environment.SECRET_KEY) {
    throw new Error("A CLI local não forneceu API_URL, PUBLISHABLE_KEY e SECRET_KEY.");
  }

  return environment;
}

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
};

let checks = 0;

function check(condition, message) {
  if (!condition) {
    throw new Error(message);
  }

  checks += 1;
}

function checkNoError(result, message) {
  check(!result.error, `${message}: ${result.error?.message ?? "erro desconhecido"}`);
}

function checkPermissionDenied(result, message) {
  check(result.error?.code === "42501", `${message}: esperado erro de permissão 42501, recebido: ${result.error?.code}`);
}

async function main() {
  const environment = readLocalSupabaseEnvironment();
  const admin = createClient(environment.API_URL, environment.SECRET_KEY, clientOptions);
  const suffix = randomUUID();
  const password = `Ficticia-${randomBytes(18).toString("base64url")}`;
  const createdUserIds = [];
  const createdMemberIds = [];
  let authorizedUserId;

  try {
    // 1. Criar contas fictícias A e B
    const commonCreation = await admin.auth.admin.createUser({
      email: `usuario-a-${suffix}@example.invalid`,
      password,
      email_confirm: true,
    });
    checkNoError(commonCreation, "não foi possível criar a conta fictícia A");
    const commonUserId = commonCreation.data.user.id;
    createdUserIds.push(commonUserId);

    const authorizedCreation = await admin.auth.admin.createUser({
      email: `usuario-b-${suffix}@example.invalid`,
      password,
      email_confirm: true,
    });
    checkNoError(authorizedCreation, "não foi possível criar a conta fictícia B");
    authorizedUserId = authorizedCreation.data.user.id;
    createdUserIds.push(authorizedUserId);

    // 2. Conceder manage_members exclusivamente para B
    const grant = await admin
      .from("member_administrators")
      .insert({ user_id: authorizedUserId });
    checkNoError(grant, "não foi possível conceder manage_members a B");

    // 3. Autenticar clientes comuns e autorizados com chave publicável
    const common = createClient(environment.API_URL, environment.PUBLISHABLE_KEY, clientOptions);
    const authorized = createClient(environment.API_URL, environment.PUBLISHABLE_KEY, clientOptions);

    const commonLogin = await common.auth.signInWithPassword({
      email: `usuario-a-${suffix}@example.invalid`,
      password,
    });
    checkNoError(commonLogin, "login de A falhou");

    const authorizedLogin = await authorized.auth.signInWithPassword({
      email: `usuario-b-${suffix}@example.invalid`,
      password,
    });
    checkNoError(authorizedLogin, "login de B falhou");
    const authorizedJwt = authorizedLogin.data.session.access_token;

    // 4. Testes para Conta A (usuário autenticado sem manage_members)
    const commonPredicate = await common.rpc("can_manage_members");
    checkNoError(commonPredicate, "rpc can_manage_members falhou para A");
    check(commonPredicate.data === false, "conta A foi autorizada indevidamente");

    const commonMembersSelect = await common.from("members").select("*");
    checkNoError(commonMembersSelect, "select members de A falhou tecnicamente");
    check(commonMembersSelect.data.length === 0, "A enxergou membros no banco");

    const commonCategoriesSelect = await common.from("membership_categories").select("*");
    checkNoError(commonCategoriesSelect, "select categories de A falhou tecnicamente");
    check(commonCategoriesSelect.data.length === 0, "A enxergou categorias estatutárias");

    checkPermissionDenied(
      await common.from("members").insert({
        person_type: "PF",
        name: "Tentativa Invasora A",
        membership_category_code: "CONTRIBUINTE",
      }),
      "A conseguiu inserir membro",
    );

    checkPermissionDenied(
      await common.from("members").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      "A conseguiu deletar membros",
    );

    // 5. Testes para Conta B (operador autorizado com manage_members)
    const authorizedPredicate = await authorized.rpc("can_manage_members");
    checkNoError(authorizedPredicate, "rpc can_manage_members falhou para B");
    check(authorizedPredicate.data === true, "conta B não foi autorizada");

    // B pode ler categorias estatutárias (somente leitura)
    const categories = await authorized.from("membership_categories").select("code, name");
    checkNoError(categories, "B não conseguiu listar categorias");
    check(categories.data.length === 3, `B deveria ver 3 categorias, viu ${categories.data.length}`);

    checkPermissionDenied(
      await authorized.from("membership_categories").insert({ code: "TESTE", name: "Teste" }),
      "B conseguiu inserir categoria",
    );
    checkPermissionDenied(
      await authorized.from("membership_categories").update({ name: "Nome Mudado" }).eq("code", "FUNDADOR"),
      "B conseguiu alterar categoria",
    );
    checkPermissionDenied(
      await authorized.from("membership_categories").delete().eq("code", "FUNDADOR"),
      "B conseguiu excluir categoria",
    );

    // B pode criar um associado PF válido
    const insertPf = await authorized
      .from("members")
      .insert({
        person_type: "PF",
        name: `Associado Fictício PF ${suffix}`,
        membership_category_code: "CONTRIBUINTE",
        email: `ficticio-${suffix}@example.invalid`,
        phone: "+55 11 99999-0000",
      })
      .select()
      .single();
    checkNoError(insertPf, "B não conseguiu inserir associado PF");
    check(Boolean(insertPf.data?.id), "associado PF criado não possui ID");
    const memberPfId = insertPf.data.id;
    createdMemberIds.push(memberPfId);

    // B pode criar um associado PJ válido
    const insertPj = await authorized
      .from("members")
      .insert({
        person_type: "PJ",
        name: `Empresa Fictícia PJ ${suffix} LTDA`,
        membership_category_code: "FUNDADOR",
      })
      .select()
      .single();
    checkNoError(insertPj, "B não conseguiu inserir associado PJ");
    const memberPjId = insertPj.data.id;
    createdMemberIds.push(memberPjId);

    // B pode consultar os associados criados
    const listMembers = await authorized.from("members").select("id, name, person_type");
    checkNoError(listMembers, "B não conseguiu listar associados");
    check(listMembers.data.some((m) => m.id === memberPfId), "associado PF não encontrado na listagem");
    check(listMembers.data.some((m) => m.id === memberPjId), "associado PJ não encontrado na listagem");

    // B pode consultar um associado por ID
    const getPf = await authorized.from("members").select("*").eq("id", memberPfId).single();
    checkNoError(getPf, "B não conseguiu buscar associado PF por ID");
    check(getPf.data.name === `Associado Fictício PF ${suffix}`, "dados do associado PF divergem");

    // B pode editar os dados autorizados de um associado
    const updatePf = await authorized
      .from("members")
      .update({
        name: `Associado PF Renomeado ${suffix}`,
        phone: "+55 21 98888-7777",
        membership_category_code: "BENEMERITO",
      })
      .eq("id", memberPfId)
      .select()
      .single();
    checkNoError(updatePf, "B não conseguiu atualizar associado PF");
    check(updatePf.data.name === `Associado PF Renomeado ${suffix}`, "nome do associado PF não foi alterado");
    check(updatePf.data.membership_category_code === "BENEMERITO", "categoria do associado PF não foi alterada");

    // 5.1 P2-03: Pesquisa textual por nome, filtros e paginação server-side
    // Busca textual por nome/razão social
    const searchByName = await authorized
      .from("members")
      .select("id, name")
      .ilike("name", `%PF Renomeado ${suffix}%`);
    checkNoError(searchByName, "B não conseguiu pesquisar associado por nome via ilike");
    check(searchByName.data.length === 1, `esperado exatamente 1 resultado para busca textual, recebido: ${searchByName.data.length}`);
    check(searchByName.data[0].id === memberPfId, "resultado da busca por nome diverge do esperado");

    // Busca textual sem correspondência
    const searchNoMatch = await authorized
      .from("members")
      .select("id")
      .ilike("name", `%Inexistente-${suffix}%`);
    checkNoError(searchNoMatch, "B não conseguiu pesquisar com resultado vazio");
    check(searchNoMatch.data.length === 0, "busca por nome inexistente retornou linhas indevidas");

    // Validação real de busca literal com caracteres especiais % e _
    const specialName = `Associado com 100%_bonus ${suffix}`;
    const insertSpecial = await authorized
      .from("members")
      .insert({
        person_type: "PF",
        name: specialName,
        membership_category_code: "CONTRIBUINTE",
      })
      .select()
      .single();
    checkNoError(insertSpecial, "B não conseguiu inserir associado com caracteres especiais");
    const specialMemberId = insertSpecial.data.id;
    createdMemberIds.push(specialMemberId);

    // Busca literal usando sanitizeIlikePattern pelo trecho "100%_bonus"
    const escapedTerm = sanitizeIlikePattern(`100%_bonus ${suffix}`);
    const searchSpecialLiteral = await authorized
      .from("members")
      .select("id, name")
      .ilike("name", `%${escapedTerm}%`);
    checkNoError(searchSpecialLiteral, "B não conseguiu pesquisar por termo literal com wildcards");
    check(
      searchSpecialLiteral.data.length === 1 && searchSpecialLiteral.data[0].id === specialMemberId,
      "busca literal por 100%_bonus não encontrou exatamente o registro criado",
    );

    // Sem sanitização, "100X_bonus" casaria se "_" fosse tratado como wildcard;
    // com sanitização, a busca por "100X_bonus" não deve encontrar o registro com "%_"
    const escapedDifferentTerm = sanitizeIlikePattern(`100X_bonus ${suffix}`);
    const searchNegative = await authorized
      .from("members")
      .select("id")
      .ilike("name", `%${escapedDifferentTerm}%`);
    checkNoError(searchNegative, "pesquisa negativa com caractere divergente falhou");
    check(searchNegative.data.length === 0, "busca sem correspondência literal encontrou registros indevidos");

    // Filtro por tipo de pessoa (PF) - criados memberPfId e specialMemberId
    const filterPf = await authorized
      .from("members")
      .select("id")
      .eq("person_type", "PF")
      .ilike("name", `%${suffix}%`);
    checkNoError(filterPf, "B não conseguiu filtrar por person_type PF");
    check(
      filterPf.data.length === 2 &&
        filterPf.data.some((m) => m.id === memberPfId) &&
        filterPf.data.some((m) => m.id === specialMemberId),
      "filtro PF não retornou associados PF corretos",
    );

    // Filtro por tipo de pessoa (PJ)
    const filterPj = await authorized
      .from("members")
      .select("id")
      .eq("person_type", "PJ")
      .ilike("name", `%${suffix}%`);
    checkNoError(filterPj, "B não conseguiu filtrar por person_type PJ");
    check(filterPj.data.length === 1 && filterPj.data[0].id === memberPjId, "filtro PJ não retornou associado correto");

    // Filtro por categoria estatutária
    const filterCategory = await authorized
      .from("members")
      .select("id")
      .eq("membership_category_code", "FUNDADOR")
      .ilike("name", `%${suffix}%`);
    checkNoError(filterCategory, "B não conseguiu filtrar por categoria estatutária");
    check(filterCategory.data.length === 1 && filterCategory.data[0].id === memberPjId, "filtro por categoria não retornou registro esperado");

    // Combinação de pesquisa, tipo e categoria
    const filterCombined = await authorized
      .from("members")
      .select("id")
      .eq("person_type", "PJ")
      .eq("membership_category_code", "FUNDADOR")
      .ilike("name", `%Empresa Fictícia PJ ${suffix}%`);
    checkNoError(filterCombined, "B não conseguiu filtrar por combinação de critérios");
    check(filterCombined.data.length === 1 && filterCombined.data[0].id === memberPjId, "filtro combinado retornou registro incorreto");

    // Paginação server-side com range e count exact
    const paginatedQuery = await authorized
      .from("members")
      .select("id, name", { count: "exact" })
      .ilike("name", `%${suffix}%`)
      .order("name", { ascending: true })
      .order("id", { ascending: true })
      .range(0, 0); // apenas 1 item
    checkNoError(paginatedQuery, "B não conseguiu executar consulta paginada");
    check(paginatedQuery.data.length === 1, `paginação com range(0,0) deve trazer 1 item, trouxe: ${paginatedQuery.data.length}`);
    check(paginatedQuery.count === 3, `count exact deve ser 3 para as fixtures do teste, foi: ${paginatedQuery.count}`);

    // Usuário comum (A) tenta fazer a consulta paginada com filtro e recebe zero linhas por RLS
    const commonQuery = await common
      .from("members")
      .select("id, name", { count: "exact" })
      .ilike("name", `%${suffix}%`);
    checkNoError(commonQuery, "usuário comum A gerou erro técnico inesperado ao consultar");
    check(commonQuery.data.length === 0, "usuário comum A enxergou associados via consulta paginada");
    check(commonQuery.count === 0, "usuário comum A obteve contagem de associados via RLS");

    // Operações proibidas para B:
    // DELETE proibido por ACL
    checkPermissionDenied(
      await authorized.from("members").delete().eq("id", memberPfId),
      "B conseguiu deletar membro",
    );

    // Tentativa de alterar id proibida por ACL
    checkPermissionDenied(
      await authorized.from("members").update({ id: randomUUID() }).eq("id", memberPfId),
      "B conseguiu alterar id de membro",
    );

    // Tentativa de gravar updated_at manualmente proibida por ACL
    checkPermissionDenied(
      await authorized.from("members").update({ updated_at: "2000-01-01T00:00:00Z" }).eq("id", memberPfId),
      "B conseguiu alterar updated_at de membro",
    );

    // 6. Teste de Revogação imediata com o MESMO JWT
    const revocation = await admin
      .from("member_administrators")
      .delete()
      .eq("user_id", authorizedUserId);
    checkNoError(revocation, "falha ao revogar concessão de B");

    // Comprovar que o JWT de B continua o mesmo
    const sessionB = await authorized.auth.getSession();
    check(sessionB.data.session?.access_token === authorizedJwt, "JWT de B mudou durante o teste");

    // Após revogação, o predicado retorna false
    const predicateRevoked = await authorized.rpc("can_manage_members");
    checkNoError(predicateRevoked, "rpc can_manage_members falhou após revogação");
    check(predicateRevoked.data === false, "B continuou autorizado após revogação");

    // Após revogação, leitura de members retorna zero linhas
    const membersRevokedSelect = await authorized.from("members").select("id");
    checkNoError(membersRevokedSelect, "select members de B pós-revogação falhou");
    check(membersRevokedSelect.data.length === 0, "B enxergou membros após revogação com mesmo JWT");

    // Após revogação, leitura de categories retorna zero linhas
    const categoriesRevokedSelect = await authorized.from("membership_categories").select("code");
    checkNoError(categoriesRevokedSelect, "select categories de B pós-revogação falhou");
    check(categoriesRevokedSelect.data.length === 0, "B enxergou categories após revogação com mesmo JWT");

    // Após revogação, tentativa de inserção é rejeitada
    checkPermissionDenied(
      await authorized.from("members").insert({
        person_type: "PF",
        name: "Tentativa Pós Revogação",
        membership_category_code: "CONTRIBUINTE",
      }),
      "B conseguiu inserir membro após revogação",
    );

    // Após revogação, tentativa de atualização afeta zero linhas
    const updateRevoked = await authorized
      .from("members")
      .update({ name: "Tentativa Update Pós Revogação" })
      .eq("id", memberPfId)
      .select();
    checkNoError(updateRevoked, "update pós-revogação falhou tecnicamente");
    check(updateRevoked.data.length === 0, "B alterou linhas após revogação");

    console.log(
      `Integração Auth + Data API de Associados: ${checks} verificações passaram com fixtures locais efêmeras.`,
    );
  } finally {
    // Limpeza de fixtures criadas
    for (const memberId of createdMemberIds) {
      await admin.from("members").delete().eq("id", memberId);
    }

    if (authorizedUserId) {
      await admin.from("member_administrators").delete().eq("user_id", authorizedUserId);
    }

    for (const userId of createdUserIds) {
      await admin.auth.admin.deleteUser(userId);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Falha inesperada na integração de CRUD.");
  process.exitCode = 1;
});
