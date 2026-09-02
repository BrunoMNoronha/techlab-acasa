begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

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
  not has_table_privilege('anon', 'public.membership_categories', 'SELECT'),
  'anon has no direct SELECT privilege'
);

select ok(
  not has_table_privilege('authenticated', 'public.membership_categories', 'SELECT'),
  'authenticated has no direct SELECT privilege'
);

select * from finish();

rollback;
