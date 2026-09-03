-- Cadastro mínimo de associados (P2-02, incremento 1 — Issue #20).
--
-- Toda a suíte roda em uma única transação revertida ao final: nenhum dado
-- criado aqui persiste e o catálogo estatutário nunca é alterado de forma
-- permanente. Os valores usados são explicitamente fictícios; nenhum dado
-- pessoal real pode ser versionado.

begin;

create extension if not exists pgtap with schema extensions;

select plan(44);

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
-- Segurança
-- ---------------------------------------------------------------------------

select ok(
  (select relrowsecurity from pg_class where oid = 'public.members'::regclass),
  'row level security is enabled'
);

select is(
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'members'),
  0::bigint,
  'no permissive policy was introduced (deny by default while DP-015 is open)'
);

select ok(
  not has_table_privilege(
    'anon',
    'public.members',
    'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'
  ),
  'anon has no direct table privilege (read or write)'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.members',
    'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'
  ),
  'authenticated has no direct table privilege (read or write)'
);

select * from finish();

rollback;
