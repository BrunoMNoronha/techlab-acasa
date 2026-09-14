# Operação local da capacidade `manage_members`

Este procedimento é exclusivo da stack Supabase local e implementa a operação técnica da DT-015A. Ele não autoriza destinatários reais, não cria endpoint/tela e não usa a chave `service_role` da aplicação.

> **DP-015B (Aprovada em 2026-09-14):** A capacidade `manage_members` é concedida exclusivamente a pessoas individualmente designadas pela ACASA para manutenção cadastral, dependendo de autorização da Diretoria devidamente referenciada. O executor técnico realiza a concessão ou revogação, mas não possui autoridade para decidir destinatários.

Use somente conta fictícia local e uma conexão PostgreSQL administrativa controlada. Não copie UUIDs para Preview/Production, não procure conta por e-mail e não selecione automaticamente o primeiro usuário.

## Preparação

1. Inicie e recrie a stack com `pnpm run db:start` e `pnpm run db:reset`.
2. Crie a conta fictícia no Supabase Studio local, em `http://127.0.0.1:54323`.
3. Copie explicitamente o UUID exibido em Authentication → Users.
4. Abra um cliente PostgreSQL administrativo contra `postgresql://postgres:postgres@127.0.0.1:54322/postgres`. Essa credencial é somente da stack local efêmera.
5. No `psql`, defina o alvo explicitamente:

```sql
\set member_admin_user_id '00000000-0000-4000-8000-000000000000'
select set_config('app.member_admin_user_id', :'member_admin_user_id', false);
```

Substitua o UUID fictício pelo UUID local escolhido. Os blocos abaixo falham se o UUID não existir, se a concessão estiver duplicada ou se a revogação não encontrar exatamente o alvo.

## Conceder

```sql
begin;

do $$
declare
  target_user_id uuid := current_setting('app.member_admin_user_id')::uuid;
begin
  if not exists (select 1 from auth.users where id = target_user_id) then
    raise exception 'Auth user % does not exist', target_user_id;
  end if;

  if exists (select 1 from public.member_administrators where user_id = target_user_id) then
    raise exception 'manage_members is already granted to %', target_user_id;
  end if;

  insert into public.member_administrators (user_id) values (target_user_id);
end;
$$;

commit;
```

Confira a linha corrente sem expor e-mail:

```sql
select user_id, granted_at
from public.member_administrators
where user_id = current_setting('app.member_admin_user_id')::uuid;
```

Confira também o predicado sob a identidade fictícia, em transação descartável:

```sql
begin;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', current_setting('app.member_admin_user_id'),
    'role', 'authenticated'
  )::text,
  true
);
select public.can_manage_members(); -- esperado: true
rollback;
```

## Revogar

Antes de revogar, confira explicitamente se este é o último operador. Isso é uma precaução operacional, não uma regra de negócio: o banco não impede remover a última concessão.

```sql
select count(*) as current_grant_count from public.member_administrators;

begin;

do $$
declare
  target_user_id uuid := current_setting('app.member_admin_user_id')::uuid;
  affected_rows integer;
begin
  delete from public.member_administrators where user_id = target_user_id;
  get diagnostics affected_rows = row_count;

  if affected_rows <> 1 then
    raise exception 'expected one grant for %, removed %', target_user_id, affected_rows;
  end if;
end;
$$;

commit;
```

Confira que a linha não existe:

```sql
select not exists (
  select 1
  from public.member_administrators
  where user_id = current_setting('app.member_admin_user_id')::uuid
) as revoked;
```

Execute novamente o bloco transacional de identidade acima; `public.can_manage_members()` deve retornar `false` em uma operação posterior ao commit. A integração automatizada `pnpm run test:integration:member-admin-auth` comprova adicionalmente essa revogação com Auth real, JWT assinado e Data API, sem renovar o JWT.

## Limites

- a pessoa com `manage_members` não pode conceder, alterar ou revogar permissões pela aplicação/Data API;
- `public.members` e `public.membership_categories` continuam fechadas nesta fundação;
- o timestamp da concessão não substitui a auditoria de runtime da P2-06;
- ambientes remotos e contas reais exigem decisão DP-015B e procedimento próprio aprovado.
