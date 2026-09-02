-- Statutory categories defined by ACASA Estatuto 2025, Art. 12.
-- Changes to these values require an explicit migration/review aligned with the governing document.

create table public.membership_categories (
  code text primary key,
  name text not null unique,
  constraint membership_categories_code_format
    check (code ~ '^[A-Z][A-Z0-9_]*$'),
  constraint membership_categories_name_not_blank
    check (btrim(name) <> '')
);

comment on table public.membership_categories is
  'Reference table for ACASA statutory membership categories.';

comment on column public.membership_categories.code is
  'Stable application code for a statutory category.';

comment on column public.membership_categories.name is
  'Human-readable statutory category name.';

alter table public.membership_categories enable row level security;

-- No client role needs direct Data API access yet. Future access must be granted
-- deliberately together with server-side authorization/RLS policies.
revoke all privileges on table public.membership_categories from anon, authenticated;

insert into public.membership_categories (code, name)
values
  ('FUNDADOR', 'Fundador'),
  ('BENEMERITO', 'Benemérito'),
  ('CONTRIBUINTE', 'Contribuinte');
