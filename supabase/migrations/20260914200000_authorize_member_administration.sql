-- Liberação seletiva de acesso ao cadastro administrativo de associados
-- respaldada pela aprovação da decisão de produto DP-015B em 2026-09-14 (Issue #26).
--
-- Concede privilégios mínimos de coluna e políticas RLS condicionadas à
-- capacidade corrente `manage_members` (via predicado `public.can_manage_members()`).
--
-- Regras estritas:
-- 1. `public.members`: SELECT em toda tabela e INSERT/UPDATE restrito às cinco
--    colunas de negócio editáveis (person_type, name, membership_category_code,
--    email, phone). Nenhum grant de DELETE, TRUNCATE ou escrita em id/timestamps.
-- 2. `public.membership_categories`: apenas SELECT condicionado a `manage_members`.
--    Nenhuma escrita cotidiana no catálogo estatutário.
-- 3. `public.member_administrators`: inalterada; sem permissões de escrita para clientes.

-- ---------------------------------------------------------------------------
-- public.membership_categories
-- ---------------------------------------------------------------------------

grant select on table public.membership_categories to authenticated;

create policy membership_categories_select_manage_members
  on public.membership_categories
  for select
  to authenticated
  using (public.can_manage_members());

comment on policy membership_categories_select_manage_members on public.membership_categories is
  'Permite a leitura do catálogo de categorias estatutárias exclusivamente a contas com manage_members.';

-- ---------------------------------------------------------------------------
-- public.members
-- ---------------------------------------------------------------------------

-- Conceder SELECT na tabela para contas autenticadas (filtrado por RLS)
grant select on table public.members to authenticated;

-- Conceder escrita exclusivamente nas 5 colunas de negócio aprovadas
grant insert (person_type, name, membership_category_code, email, phone)
  on table public.members
  to authenticated;

grant update (person_type, name, membership_category_code, email, phone)
  on table public.members
  to authenticated;

-- Políticas de RLS condicionadas à capacidade corrente
create policy members_select_manage_members
  on public.members
  for select
  to authenticated
  using (public.can_manage_members());

comment on policy members_select_manage_members on public.members is
  'Permite a consulta de associados exclusivamente a contas com a capacidade corrente manage_members.';

create policy members_insert_manage_members
  on public.members
  for insert
  to authenticated
  with check (public.can_manage_members());

comment on policy members_insert_manage_members on public.members is
  'Permite o cadastro de associados exclusivamente a contas com a capacidade corrente manage_members.';

create policy members_update_manage_members
  on public.members
  for update
  to authenticated
  using (public.can_manage_members())
  with check (public.can_manage_members());

comment on policy members_update_manage_members on public.members is
  'Permite a edição de associados exclusivamente a contas com a capacidade corrente manage_members.';
