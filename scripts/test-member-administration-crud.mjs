#!/usr/bin/env node
/**
 * Integração ponta-a-ponta local do CRUD de associados (P2-02, incremento 3).
 *
 * Valida autorização seletiva, isolamento, CRUD de dados mínimos e revogação
 * imediata com Auth real, JWT assinado, chave publicável e Data API.
 */
import { spawnSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

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
      `Integração CRUD de Associados: ${checks} verificações passaram com fixtures locais efêmeras.`,
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
