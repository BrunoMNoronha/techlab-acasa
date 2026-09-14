begin;

create extension if not exists pgtap with schema extensions;

select plan(21);

select has_table(
  'public',
  'membership_categories',
  'membership_categories table exists'
);

select columns_are(
  'public',
  'membership_categories',
  array['code', 'name'],
  'membership_categories has only the approved baseline columns'
);

select col_is_pk(
  'public',
  'membership_categories',
  'code',
  'code is the primary key'
);

select set_eq(
  $$ select code || '|' || name from public.membership_categories $$,
  $$ values
       ('FUNDADOR|Fundador'::text),
       ('BENEMERITO|Benemérito'::text),
       ('CONTRIBUINTE|Contribuinte'::text)
  $$,
  'only the three statutory category code/name pairs exist'
);

select is(
  (select count(*) from public.membership_categories),
  3::bigint,
  'exactly three statutory categories are present'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.membership_categories'::regclass),
  'row level security is enabled'
);

select ok(
  not has_table_privilege(
    'anon',
    'public.membership_categories',
    'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'
  ),
  'anon has no direct table privilege (read or write)'
);

select ok(
  has_table_privilege('authenticated', 'public.membership_categories', 'SELECT'),
  'authenticated has SELECT privilege on membership_categories'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.membership_categories',
    'INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'
  ),
  'authenticated has no write privilege on membership_categories'
);

select is(
  (select count(*) from pg_policies
   where schemaname = 'public' and tablename = 'membership_categories'),
  1::bigint,
  'exactly one policy exists on membership_categories'
);

select ok(
  (select qual ilike '%can_manage_members%'
   from pg_policies
   where schemaname = 'public' and tablename = 'membership_categories' and cmd = 'SELECT'),
  'the SELECT policy requires can_manage_members()'
);

-- The constraints below are what keep this catalogue from degenerating into a
-- free-form administrative table. Structural assertions alone would still pass
-- if a future migration dropped them, so enforcement is tested explicitly.

select throws_ok(
  $$ insert into public.membership_categories (code, name)
     values ('titular', 'Titular') $$,
  '23514',
  null,
  'a code outside the approved format is rejected'
);

select throws_ok(
  $$ insert into public.membership_categories (code, name)
     values ('NOVA_CATEGORIA', '   ') $$,
  '23514',
  null,
  'a blank display name is rejected'
);

select throws_ok(
  $$ insert into public.membership_categories (code, name)
     values ('NOVA_CATEGORIA', 'Fundador') $$,
  '23505',
  null,
  'a duplicated display name is rejected'
);

select throws_ok(
  $$ insert into public.membership_categories (code, name)
     values ('NOVA_CATEGORIA', null) $$,
  '23502',
  null,
  'a null display name is rejected'
);

-- ---------------------------------------------------------------------------
-- RLS e Isolamento de Categorias (DP-015B)
-- ---------------------------------------------------------------------------

insert into auth.users (id, email)
values
  ('11111111-1111-4111-8111-111111111111', 'usuario-a@example.invalid'),
  ('22222222-2222-4222-8222-222222222222', 'usuario-b@example.invalid');

insert into public.member_administrators (user_id)
values
  ('22222222-2222-4222-8222-222222222222');

-- Usuário A (sem capacidade)
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select is(
  (select count(*) from public.membership_categories),
  0::bigint,
  'unauthorized user A sees 0 categories'
);

-- Usuário B (com capacidade)
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);

select is(
  (select count(*) from public.membership_categories),
  3::bigint,
  'authorized user B sees exactly 3 categories'
);

select throws_ok(
  $$ insert into public.membership_categories (code, name) values ('NOVA', 'Nova Categoria') $$,
  '42501',
  null,
  'authorized user B cannot insert into membership_categories'
);

select throws_ok(
  $$ update public.membership_categories set name = 'Nome Alterado' where code = 'FUNDADOR' $$,
  '42501',
  null,
  'authorized user B cannot update membership_categories'
);

select throws_ok(
  $$ delete from public.membership_categories where code = 'FUNDADOR' $$,
  '42501',
  null,
  'authorized user B cannot delete from membership_categories'
);

-- Revogação administrativa com o mesmo JWT de B
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
  (select count(*) from public.membership_categories),
  0::bigint,
  'revoked user B sees 0 categories with same JWT'
);

reset role;

select * from finish();

rollback;
