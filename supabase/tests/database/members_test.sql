-- Cadastro mínimo de associados (P2-02, incremento 1 — Issue #20).
--
-- Toda a suíte roda em uma única transação revertida ao final: nenhum dado
-- criado aqui persiste e o catálogo estatutário nunca é alterado de forma
-- permanente. Os valores usados são explicitamente fictícios; nenhum dado
-- pessoal real pode ser versionado.

begin;

create extension if not exists pgtap with schema extensions;

select plan(69);

-- ---------------------------------------------------------------------------
-- Estrutura
-- ---------------------------------------------------------------------------

select has_table(
  'public',
  'members',
  'members table exists'
);

select columns_are(
  'public',
  'members',
  array[
    'id',
    'person_type',
    'name',
    'membership_category_code',
    'email',
    'phone',
    'created_at',
    'updated_at'
  ],
  'members has only the approved minimal columns'
);

-- Guardas explícitas das decisões D1 (CPF/CNPJ), D12/DP-005 (situação
-- cadastral) e D13 (vínculo com auth.users): columns_are já as cobre, mas uma
-- asserção nomeada torna a regressão legível se alguém tentar reintroduzi-las.

select hasnt_column(
  'public',
  'members',
  'cpf',
  'no national identifier column was created (D1/DP-008)'
);

select hasnt_column(
  'public',
  'members',
  'status',
  'no membership status column was created (D12/DP-005, stays in P2-04)'
);

select hasnt_column(
  'public',
  'members',
  'auth_user_id',
  'members stays decoupled from auth.users (D13)'
);

select col_is_pk(
  'public',
  'members',
  'id',
  'id is the primary key'
);

select col_type_is(
  'public',
  'members',
  'id',
  'uuid',
  'the technical identifier is an opaque uuid (D14)'
);

select col_has_default(
  'public',
  'members',
  'id',
  'the database generates the identifier'
);

select col_not_null('public', 'members', 'person_type', 'person_type is mandatory');
select col_not_null('public', 'members', 'name', 'name is mandatory');
select col_not_null('public', 'members', 'membership_category_code', 'membership category is mandatory (D10/DP-014)');
select col_not_null('public', 'members', 'created_at', 'created_at is mandatory');
select col_not_null('public', 'members', 'updated_at', 'updated_at is mandatory');

select col_is_null('public', 'members', 'email', 'email is optional (D6)');
select col_is_null('public', 'members', 'phone', 'phone is optional (D6)');

select col_type_is(
  'public',
  'members',
  'created_at',
  'timestamp with time zone',
  'created_at is timezone aware'
);

select col_type_is(
  'public',
  'members',
  'updated_at',
  'timestamp with time zone',
  'updated_at is timezone aware'
);

select fk_ok(
  'public',
  'members',
  'membership_category_code',
  'public',
  'membership_categories',
  'code',
  'members references the statutory category catalogue'
);

-- ---------------------------------------------------------------------------
-- Fixture
--
-- Uma categoria fictícia isola os testes de comportamento da chave estrangeira,
-- para que o renomear de "on update cascade" e o bloqueio de "on delete
-- restrict" jamais incidam sobre um código estatutário.
-- ---------------------------------------------------------------------------

insert into public.membership_categories (code, name)
values ('CATEGORIA_FICTICIA', 'Categoria fictícia de teste');

-- ---------------------------------------------------------------------------
-- Regras de integridade
-- ---------------------------------------------------------------------------

select lives_ok(
  $$ insert into public.members (person_type, name, membership_category_code)
     values ('PF', 'Associado Ficticio de Teste', 'CONTRIBUINTE') $$,
  'a natural person can be registered'
);

select lives_ok(
  $$ insert into public.members (person_type, name, membership_category_code)
     values ('PJ', 'Empresa Ficticia de Teste LTDA', 'CONTRIBUINTE') $$,
  'a legal entity can be registered in the same table (D9/DP-013)'
);

select lives_ok(
  $$ insert into public.members (person_type, name, membership_category_code, email, phone)
     values ('PF', 'Associado Ficticio Com Contato', 'FUNDADOR', 'ficticio@example.invalid', '+55 00 00000-0000') $$,
  'optional contact channels are accepted when informed'
);

select throws_ok(
  $$ insert into public.members (person_type, name, membership_category_code)
     values ('OUTRO', 'Associado Ficticio', 'CONTRIBUINTE') $$,
  '23514',
  null,
  'an unknown person type is rejected'
);

select throws_ok(
  $$ insert into public.members (person_type, name, membership_category_code)
     values (null, 'Associado Ficticio', 'CONTRIBUINTE') $$,
  '23502',
  null,
  'a null person type is rejected'
);

select throws_ok(
  $$ insert into public.members (person_type, name, membership_category_code)
     values ('PF', '', 'CONTRIBUINTE') $$,
  '23514',
  null,
  'an empty name is rejected'
);

select throws_ok(
  $$ insert into public.members (person_type, name, membership_category_code)
     values ('PF', '   ', 'CONTRIBUINTE') $$,
  '23514',
  null,
  'a whitespace-only name is rejected'
);

select throws_ok(
  $$ insert into public.members (person_type, name, membership_category_code)
     values ('PF', null, 'CONTRIBUINTE') $$,
  '23502',
  null,
  'a null name is rejected'
);

select throws_ok(
  $$ insert into public.members (person_type, name, membership_category_code)
     values ('PF', 'Associado Ficticio', null) $$,
  '23502',
  null,
  'a null membership category is rejected'
);

select throws_ok(
  $$ insert into public.members (person_type, name, membership_category_code)
     values ('PF', 'Associado Ficticio', 'CATEGORIA_INEXISTENTE') $$,
  '23503',
  null,
  'a membership category outside the catalogue is rejected'
);

select throws_ok(
  $$ insert into public.members (person_type, name, membership_category_code, email)
     values ('PF', 'Associado Ficticio', 'CONTRIBUINTE', '') $$,
  '23514',
  null,
  'an empty email is rejected when the column is informed'
);

select throws_ok(
  $$ insert into public.members (person_type, name, membership_category_code, email)
     values ('PF', 'Associado Ficticio', 'CONTRIBUINTE', '   ') $$,
  '23514',
  null,
  'a whitespace-only email is rejected'
);

select throws_ok(
  $$ insert into public.members (person_type, name, membership_category_code, phone)
     values ('PF', 'Associado Ficticio', 'CONTRIBUINTE', '') $$,
  '23514',
  null,
  'an empty phone is rejected when the column is informed'
);

select throws_ok(
  $$ insert into public.members (person_type, name, membership_category_code, phone)
     values ('PF', 'Associado Ficticio', 'CONTRIBUINTE', '   ') $$,
  '23514',
  null,
  'a whitespace-only phone is rejected'
);

select is(
  (select count(*) from pg_constraint
    where conrelid = 'public.members'::regclass
      and contype = 'u'),
  0::bigint,
  'no uniqueness was imposed on name, email or phone'
);

-- ---------------------------------------------------------------------------
-- Comportamento da chave estrangeira
-- ---------------------------------------------------------------------------

select is(
  (select confupdtype from pg_constraint
    where conrelid = 'public.members'::regclass
      and contype = 'f'),
  'c'::"char",
  'the category foreign key is declared as on update cascade'
);

select is(
  (select confdeltype from pg_constraint
    where conrelid = 'public.members'::regclass
      and contype = 'f'),
  'r'::"char",
  'the category foreign key is declared as on delete restrict'
);

insert into public.members (person_type, name, membership_category_code)
values ('PF', 'Associado Ficticio Da Categoria Ficticia', 'CATEGORIA_FICTICIA');

select throws_ok(
  $$ delete from public.membership_categories where code = 'CATEGORIA_FICTICIA' $$,
  '23503',
  null,
  'deleting a category still in use is blocked (on delete restrict)'
);

update public.membership_categories
set code = 'CATEGORIA_FICTICIA_RENOMEADA'
where code = 'CATEGORIA_FICTICIA';

select is(
  (select membership_category_code from public.members
    where name = 'Associado Ficticio Da Categoria Ficticia'),
  'CATEGORIA_FICTICIA_RENOMEADA',
  'renaming a category code propagates to its members (on update cascade)'
);

-- ---------------------------------------------------------------------------
-- Timestamps
-- ---------------------------------------------------------------------------

select has_trigger(
  'public',
  'members',
  'members_set_updated_at',
  'members keeps updated_at through a database trigger'
);

-- now() é constante dentro da transação, portanto comparar instantes seria um
-- teste frágil. O que importa é que o banco imponha o valor: um UPDATE que
-- tente gravar updated_at diretamente deve ser sobrescrito pelo trigger.
update public.members
set name = 'Associado Ficticio Renomeado',
    updated_at = timestamptz '2000-01-01 00:00:00+00'
where name = 'Associado Ficticio de Teste';

select isnt(
  (select updated_at from public.members where name = 'Associado Ficticio Renomeado'),
  timestamptz '2000-01-01 00:00:00+00',
  'the database overrides any client supplied updated_at'
);

select is(
  (select updated_at from public.members where name = 'Associado Ficticio Renomeado'),
  (select created_at from public.members where name = 'Associado Ficticio Renomeado'),
  'updated_at is refreshed to the current transaction time on update'
);

-- ---------------------------------------------------------------------------
-- Imutabilidade do identificador técnico
--
-- A chave primária impede duplicidade, não alteração. Sem o trigger, um UPDATE
-- sobre id seria aceito e quebraria silenciosamente qualquer referência futura.
-- ---------------------------------------------------------------------------

select has_trigger(
  'public',
  'members',
  'members_reject_id_change',
  'members guards the technical identifier with a database trigger'
);

select throws_ok(
  $$ update public.members
     set id = '00000000-0000-4000-8000-000000000000'
     where name = 'Associado Ficticio Renomeado' $$,
  '23001',
  null,
  'changing the technical identifier is rejected (D14)'
);

select lives_ok(
  $$ update public.members
     set id = id
     where name = 'Associado Ficticio Renomeado' $$,
  'an update that leaves the identifier untouched is accepted'
);

-- ---------------------------------------------------------------------------
-- ---------------------------------------------------------------------------
-- Segurança, Grants de Coluna, RLS e Revogação (DP-015B / Issue #26)
-- ---------------------------------------------------------------------------

select ok(
  (select relrowsecurity from pg_class where oid = 'public.members'::regclass),
  'row level security is enabled'
);

select ok(
  not has_table_privilege(
    'anon',
    'public.members',
    'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'
  ),
  'anon has no direct table privilege'
);

select ok(
  has_table_privilege('authenticated', 'public.members', 'SELECT'),
  'authenticated has SELECT privilege on members'
);

select ok(
  has_column_privilege('authenticated', 'public.members', 'name', 'INSERT')
  and has_column_privilege('authenticated', 'public.members', 'person_type', 'INSERT')
  and has_column_privilege('authenticated', 'public.members', 'membership_category_code', 'INSERT')
  and has_column_privilege('authenticated', 'public.members', 'email', 'INSERT')
  and has_column_privilege('authenticated', 'public.members', 'phone', 'INSERT'),
  'authenticated has INSERT on approved business columns'
);

select ok(
  has_column_privilege('authenticated', 'public.members', 'name', 'UPDATE')
  and has_column_privilege('authenticated', 'public.members', 'person_type', 'UPDATE')
  and has_column_privilege('authenticated', 'public.members', 'membership_category_code', 'UPDATE')
  and has_column_privilege('authenticated', 'public.members', 'email', 'UPDATE')
  and has_column_privilege('authenticated', 'public.members', 'phone', 'UPDATE'),
  'authenticated has UPDATE on approved business columns'
);

select ok(
  not has_column_privilege('authenticated', 'public.members', 'id', 'INSERT')
  and not has_column_privilege('authenticated', 'public.members', 'id', 'UPDATE')
  and not has_column_privilege('authenticated', 'public.members', 'created_at', 'INSERT')
  and not has_column_privilege('authenticated', 'public.members', 'created_at', 'UPDATE')
  and not has_column_privilege('authenticated', 'public.members', 'updated_at', 'INSERT')
  and not has_column_privilege('authenticated', 'public.members', 'updated_at', 'UPDATE'),
  'authenticated has no write privilege on id, created_at, updated_at'
);

select ok(
  not has_table_privilege('authenticated', 'public.members', 'DELETE, TRUNCATE, REFERENCES, TRIGGER'),
  'authenticated has no DELETE, TRUNCATE, REFERENCES or TRIGGER privileges'
);

select is(
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'members'),
  3::bigint,
  'exactly 3 policies exist on members (SELECT, INSERT, UPDATE)'
);

select ok(
  (select qual ilike '%can_manage_members%'
   from pg_policies
   where schemaname = 'public' and tablename = 'members' and cmd = 'SELECT'),
  'SELECT policy requires can_manage_members()'
);

select ok(
  (select with_check ilike '%can_manage_members%'
   from pg_policies
   where schemaname = 'public' and tablename = 'members' and cmd = 'INSERT'),
  'INSERT policy requires can_manage_members()'
);

select ok(
  (select qual ilike '%can_manage_members%' and with_check ilike '%can_manage_members%'
   from pg_policies
   where schemaname = 'public' and tablename = 'members' and cmd = 'UPDATE'),
  'UPDATE policy requires can_manage_members() on both USING and WITH CHECK'
);

-- Fixtures de identidades para testes de RLS
insert into auth.users (id, email)
values
  ('11111111-1111-4111-8111-111111111111', 'usuario-a@example.invalid'),
  ('22222222-2222-4222-8222-222222222222', 'usuario-b@example.invalid');

insert into public.member_administrators (user_id)
values
  ('22222222-2222-4222-8222-222222222222');

-- Usuário comum A (sem manage_members)
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select is(
  (select count(*) from public.members),
  0::bigint,
  'unauthorized user A sees zero member rows'
);

select throws_ok(
  $$ insert into public.members (person_type, name, membership_category_code)
     values ('PF', 'Invasor A', 'CONTRIBUINTE') $$,
  '42501',
  null,
  'unauthorized user A insert is rejected'
);

update public.members set name = 'Alterado por A';

select is(
  (select count(*) from public.members where name = 'Alterado por A'),
  0::bigint,
  'unauthorized user A update alters zero rows'
);

select throws_ok(
  $$ delete from public.members $$,
  '42501',
  null,
  'unauthorized user A delete is rejected by ACL'
);

-- Usuário B (autorizado com manage_members)
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);

select ok(
  (select count(*) from public.members) > 0,
  'authorized user B can read member rows'
);

select lives_ok(
  $$ insert into public.members (person_type, name, membership_category_code, email)
     values ('PF', 'Associado Criado Por B', 'CONTRIBUINTE', 'b@example.invalid') $$,
  'authorized user B can insert a member'
);

select lives_ok(
  $$ update public.members
     set name = 'Associado Alterado Por B'
     where name = 'Associado Criado Por B' $$,
  'authorized user B can update an allowed column'
);

select throws_ok(
  $$ delete from public.members where name = 'Associado Alterado Por B' $$,
  '42501',
  null,
  'authorized user B cannot delete members (no DELETE privilege)'
);

select throws_ok(
  $$ truncate public.members $$,
  '42501',
  null,
  'authorized user B cannot truncate members (no TRUNCATE privilege)'
);

select throws_ok(
  $$ insert into public.members (id, person_type, name, membership_category_code)
     values ('99999999-9999-4999-8999-999999999999'::uuid, 'PF', 'Tentativa ID', 'CONTRIBUINTE') $$,
  '42501',
  null,
  'authorized user B has no insert privilege on id'
);

select throws_ok(
  $$ update public.members
     set id = '99999999-9999-4999-8999-999999999999'::uuid
     where name = 'Associado Alterado Por B' $$,
  '42501',
  null,
  'authorized user B has no update privilege on id'
);

select throws_ok(
  $$ update public.members
     set updated_at = now()
     where name = 'Associado Alterado Por B' $$,
  '42501',
  null,
  'authorized user B has no update privilege on updated_at'
);

-- Revogação administrativa e nova operação com o mesmo JWT de B
reset role;
delete from public.member_administrators
where user_id = '22222222-2222-4222-8222-222222222222';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);

select is(
  (select count(*) from public.members),
  0::bigint,
  'revoked user B sees zero member rows with same JWT'
);

select throws_ok(
  $$ insert into public.members (person_type, name, membership_category_code)
     values ('PF', 'Tentativa Pos Revogacao', 'CONTRIBUINTE') $$,
  '42501',
  null,
  'revoked user B insert is rejected with same JWT'
);

update public.members set name = 'Tentativa Update Pos Revogacao' where name = 'Associado Alterado Por B';

select is(
  (select count(*) from public.members where name = 'Tentativa Update Pos Revogacao'),
  0::bigint,
  'revoked user B update alters zero rows with same JWT'
);

reset role;

select * from finish();

rollback;

