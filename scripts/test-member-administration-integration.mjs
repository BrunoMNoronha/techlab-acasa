#!/usr/bin/env node
/**
 * Integração local/CI da DT-015A.
 *
 * As contas e concessões são fixtures efêmeras. A credencial administrativa é
 * obtida da stack Supabase local somente para preparar/limpar fixtures; todos
 * os caminhos A/B exercitados usam Auth real, JWT real e PUBLISHABLE_KEY.
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
  check(result.error?.code === "42501", `${message}: a operação não foi negada por ACL/RLS`);
}

async function main() {
  const environment = readLocalSupabaseEnvironment();
  const admin = createClient(environment.API_URL, environment.SECRET_KEY, clientOptions);
  const suffix = randomUUID();
  const password = `Ficticia-${randomBytes(18).toString("base64url")}`;
  const createdUserIds = [];
  let authorizedUserId;

  try {
    const commonCreation = await admin.auth.admin.createUser({
      email: `usuario-a-${suffix}@example.invalid`,
      password,
      email_confirm: true,
    });
    checkNoError(commonCreation, "não foi possível criar a conta fictícia A");
    check(Boolean(commonCreation.data.user), "a criação da conta A não retornou usuário");
    const commonUserId = commonCreation.data.user.id;
    createdUserIds.push(commonUserId);

    const authorizedCreation = await admin.auth.admin.createUser({
      email: `usuario-b-${suffix}@example.invalid`,
      password,
      email_confirm: true,
    });
    checkNoError(authorizedCreation, "não foi possível criar a conta fictícia B");
    check(Boolean(authorizedCreation.data.user), "a criação da conta B não retornou usuário");
    authorizedUserId = authorizedCreation.data.user.id;
    createdUserIds.push(authorizedUserId);

    const grant = await admin
      .from("member_administrators")
      .insert({ user_id: authorizedUserId });
    checkNoError(grant, "não foi possível preparar a concessão fictícia B");

    const common = createClient(environment.API_URL, environment.PUBLISHABLE_KEY, clientOptions);
    const authorized = createClient(
      environment.API_URL,
      environment.PUBLISHABLE_KEY,
      clientOptions,
    );

    const commonLogin = await common.auth.signInWithPassword({
      email: `usuario-a-${suffix}@example.invalid`,
      password,
    });
    checkNoError(commonLogin, "a conta A não autenticou pelo Auth real");
    check(Boolean(commonLogin.data.session?.access_token), "a conta A não recebeu JWT");

    const authorizedLogin = await authorized.auth.signInWithPassword({
      email: `usuario-b-${suffix}@example.invalid`,
      password,
    });
    checkNoError(authorizedLogin, "a conta B não autenticou pelo Auth real");
    check(Boolean(authorizedLogin.data.session?.access_token), "a conta B não recebeu JWT");
    const authorizedJwt = authorizedLogin.data.session.access_token;

    const commonPredicate = await common.rpc("can_manage_members");
    checkNoError(commonPredicate, "o predicado falhou para A");
    check(commonPredicate.data === false, "a conta comum A foi autorizada");

    const authorizedPredicate = await authorized.rpc("can_manage_members");
    checkNoError(authorizedPredicate, "o predicado falhou para B");
    check(authorizedPredicate.data === true, "a conta autorizada B foi negada");

    const commonVisibleGrants = await common.from("member_administrators").select("user_id");
    checkNoError(commonVisibleGrants, "a leitura RLS de A falhou");
    check(commonVisibleGrants.data.length === 0, "A enxergou concessão de outra conta");

    const authorizedVisibleGrants = await authorized
      .from("member_administrators")
      .select("user_id");
    checkNoError(authorizedVisibleGrants, "a leitura RLS de B falhou");
    check(
      authorizedVisibleGrants.data.length === 1 &&
        authorizedVisibleGrants.data[0].user_id === authorizedUserId,
      "B não enxergou exclusivamente sua própria concessão",
    );

    checkPermissionDenied(
      await common.from("member_administrators").insert({ user_id: commonUserId }),
      "A conseguiu autoatribuir acesso",
    );
    checkPermissionDenied(
      await authorized.from("member_administrators").insert({ user_id: commonUserId }),
      "B conseguiu atribuir acesso a outra conta",
    );
    checkPermissionDenied(
      await authorized.from("member_administrators").delete().eq("user_id", authorizedUserId),
      "B conseguiu revogar a própria concessão",
    );
    checkPermissionDenied(
      await authorized
        .from("member_administrators")
        .update({ granted_at: "2000-01-01T00:00:00.000Z" })
        .eq("user_id", authorizedUserId),
      "B conseguiu alterar granted_at",
    );

    checkPermissionDenied(
      await authorized.from("members").select("id"),
      "B conseguiu consultar members",
    );
    checkPermissionDenied(
      await authorized.from("membership_categories").select("code"),
      "B conseguiu consultar membership_categories",
    );

    const revoke = await admin
      .from("member_administrators")
      .delete()
      .eq("user_id", authorizedUserId);
    checkNoError(revoke, "não foi possível revogar a fixture B");
    authorizedUserId = undefined;

    const sessionAfterRevocation = await authorized.auth.getSession();
    checkNoError(sessionAfterRevocation, "não foi possível reler a sessão B");
    check(
      sessionAfterRevocation.data.session?.access_token === authorizedJwt,
      "o JWT de B mudou durante o teste de revogação",
    );

    const revokedPredicate = await authorized.rpc("can_manage_members");
    checkNoError(revokedPredicate, "o predicado falhou após revogar B");
    check(
      revokedPredicate.data === false,
      "B continuou autorizado após revogação em nova operação com o mesmo JWT",
    );

    console.log(
      `Integração Auth/JWT/Data API: ${checks} verificações passaram com fixtures locais efêmeras.`,
    );
  } finally {
    if (authorizedUserId) {
      await admin.from("member_administrators").delete().eq("user_id", authorizedUserId);
    }

    for (const userId of createdUserIds) {
      await admin.auth.admin.deleteUser(userId);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Falha inesperada na integração local.");
  process.exitCode = 1;
});
