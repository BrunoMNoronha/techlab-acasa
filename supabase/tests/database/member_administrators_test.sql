-- Fundação mínima de autorização administrativa (DT-015A, Issue #24).
-- Fixtures exclusivamente fictícias e revertidas ao final da transação.

begin;

create extension if not exists pgtap with schema extensions;

select plan(44);

-- Estrutura e integridade ----------------------------------------------------

select has_table('public', 'member_administrators', 'member_administrators table exists');

select columns_are(
  'public',
  'member_administrators',
  array['user_id', 'granted_at'],
  'the grant table contains only the minimal approved columns'
);

select col_is_pk('public', 'member_administrators', 'user_id', 'user_id is the primary key');
select col_type_is('public', 'member_administrators', 'user_id', 'uuid', 'user_id is a uuid');
select col_type_is(
  'public',
  'member_administrators',
  'granted_at',
  'timestamp with time zone',
  'granted_at is timezone aware'
);
select col_not_null('public', 'member_administrators', 'user_id', 'user_id is mandatory');
select col_not_null('public', 'member_administrators', 'granted_at', 'granted_at is mandatory');
select col_has_default(
  'public',
  'member_administrators',
  'granted_at',
  'the database supplies granted_at'
);

select fk_ok(
  'public',
  'member_administrators',
  'user_id',
  'auth',
  'users',
  'id',
  'the grant references the Auth account, not a member'
);

select is(
  (select confdeltype
   from pg_constraint
   where conrelid = 'public.member_administrators'::regclass
     and contype = 'f'),
  'r'::"char",
  'deleting an Auth account with a current grant is restricted'
);

-- RLS, policies and effective ACLs ------------------------------------------

select ok(
  (select relrowsecurity
   from pg_class
   where oid = 'public.member_administrators'::regclass),
  'row level security is enabled'
);

select is(
  (select count(*)
   from pg_policies
   where schemaname = 'public'
     and tablename = 'member_administrators'
     and policyname = 'member_administrators_select_own'
     and cmd = 'SELECT'
     and roles = array['authenticated'::name]),
  1::bigint,
  'exactly the authenticated self-read policy exists'
);

select ok(
  (select qual ilike '%auth.uid()%'
          and qual ilike '%user_id%'
          and qual ilike '%IS NOT NULL%'
   from pg_policies
   where schemaname = 'public'
     and tablename = 'member_administrators'
     and policyname = 'member_administrators_select_own'),
  'the read policy requires a non-null session identity matching user_id'
);

select is(
  (select count(*)
   from pg_policies
   where schemaname = 'public'
     and tablename = 'member_administrators'
     and cmd <> 'SELECT'),
  0::bigint,
  'no write policy exists'
);

select ok(
  not has_table_privilege(
    'anon',
    'public.member_administrators',
    'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'
  ),
  'anon has no table privilege'
);

select ok(
  has_table_privilege('authenticated', 'public.member_administrators', 'SELECT'),
  'authenticated has the minimal SELECT privilege'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.member_administrators',
    'INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'
  ),
  'authenticated has no grant-maintenance privilege'
);

-- Predicado e ACL da função -------------------------------------------------

select has_function('public', 'can_manage_members', array[]::text[], 'the predicate exists');

select is(
  (select pronargs
   from pg_proc
   where oid = 'public.can_manage_members()'::regprocedure),
  0::smallint,
  'the predicate accepts no identity parameter'
);

select function_returns(
  'public',
  'can_manage_members',
  array[]::text[],
  'boolean',
  'the predicate returns only a boolean'
);

select ok(
  not (select prosecdef
       from pg_proc
       where oid = 'public.can_manage_members()'::regprocedure),
  'the predicate is SECURITY INVOKER'
);

select is(
  (select provolatile
   from pg_proc
   where oid = 'public.can_manage_members()'::regprocedure),
  's'::"char",
  'the predicate is stable within a command'
);

select is(
  (select proconfig
   from pg_proc
   where oid = 'public.can_manage_members()'::regprocedure),
  array['search_path=""']::text[],
  'the predicate has an explicitly empty search_path'
);

select ok(
  not has_function_privilege('public', 'public.can_manage_members()', 'EXECUTE'),
  'PUBLIC cannot execute the predicate'
);

select ok(
  not has_function_privilege('anon', 'public.can_manage_members()', 'EXECUTE'),
  'anon cannot execute the predicate'
);

select ok(
  has_function_privilege('authenticated', 'public.can_manage_members()', 'EXECUTE'),
  'authenticated can execute the predicate'
);

-- Identidades e concessões fictícias ---------------------------------------

insert into auth.users (id, email)
values
  ('11111111-1111-4111-8111-111111111111', 'usuario-a@example.invalid'),
  ('22222222-2222-4222-8222-222222222222', 'usuario-b@example.invalid'),
  ('33333333-3333-4333-8333-333333333333', 'usuario-c@example.invalid');

insert into public.member_administrators (user_id)
values
  ('22222222-2222-4222-8222-222222222222'),
  ('33333333-3333-4333-8333-333333333333');

select ok(
  (select granted_at is not null
   from public.member_administrators
   where user_id = '22222222-2222-4222-8222-222222222222'),
  'granted_at is generated by the database'
);

select throws_ok(
  $$ delete from auth.users
     where id = '22222222-2222-4222-8222-222222222222' $$,
  '23503',
  null,
  'ON DELETE RESTRICT prevents removing a granted Auth account'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select is(
  (select count(*) from public.member_administrators),
  0::bigint,
  'user A cannot see another user grant'
);

select is(public.can_manage_members(), false, 'user A is not authorized');

select throws_ok(
  $$ insert into public.member_administrators (user_id)
     values ('11111111-1111-4111-8111-111111111111') $$,
  '42501',
  null,
  'user A cannot grant access to itself'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);

select is(
  (select count(*) from public.member_administrators),
  1::bigint,
  'user B sees only its own grant'
);

select is(
  (select count(*)
   from public.member_administrators
   where user_id = '33333333-3333-4333-8333-333333333333'),
  0::bigint,
  'user B cannot inspect user C grant'
);

select is(public.can_manage_members(), true, 'user B is authorized');

select throws_ok(
  $$ insert into public.member_administrators (user_id)
     values ('11111111-1111-4111-8111-111111111111') $$,
  '42501',
  null,
  'user B cannot grant access to another account'
);

select throws_ok(
  $$ delete from public.member_administrators
     where user_id = '22222222-2222-4222-8222-222222222222' $$,
  '42501',
  null,
  'user B cannot revoke its own grant through the client role'
);

select throws_ok(
  $$ update public.member_administrators
     set granted_at = timestamptz '2000-01-01 00:00:00+00'
     where user_id = '22222222-2222-4222-8222-222222222222' $$,
  '42501',
  null,
  'user B cannot alter granted_at'
);

select throws_ok(
  $$ select * from public.members $$,
  '42501',
  null,
  'authorized user B still cannot read members'
);

select throws_ok(
  $$ select * from public.membership_categories $$,
  '42501',
  null,
  'authorized user B still cannot read membership categories'
);

reset role;
set local role anon;
select set_config('request.jwt.claims', '{}', true);

select throws_ok(
  $$ select public.can_manage_members() $$,
  '42501',
  null,
  'anon cannot execute the predicate'
);

select throws_ok(
  $$ select * from public.member_administrators $$,
  '42501',
  null,
  'anon cannot read grants'
);

-- Revogação administrativa e nova operação ---------------------------------

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
  public.can_manage_members(),
  false,
  'a new command denies user B after administrative revocation'
);

select is(
  (select count(*) from public.member_administrators),
  0::bigint,
  'revoked user B no longer sees a grant'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',
  true
);

select is(public.can_manage_members(), true, 'user C remains independently authorized');

reset role;

select * from finish();

rollback;
