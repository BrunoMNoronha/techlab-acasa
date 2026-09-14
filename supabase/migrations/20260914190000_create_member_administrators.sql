-- Fundação mínima de autorização administrativa do cadastro de associados
-- (DT-015A, Issue #24).
--
-- A presença de uma linha representa exclusivamente a capacidade
-- `manage_members`. Esta migration não abre acesso a members ou
-- membership_categories e não provisiona nenhuma conta real.

create table public.member_administrators (
  user_id uuid primary key
    references auth.users (id)
    on delete restrict,
  granted_at timestamptz not null default now()
);

comment on table public.member_administrators is
  'Concessões correntes da capacidade manage_members por identidade do Supabase Auth.';

comment on column public.member_administrators.user_id is
  'UUID da conta Auth autorizada; não referencia public.members nem usa e-mail.';

comment on column public.member_administrators.granted_at is
  'Momento da concessão, imposto pelo relógio do banco; não é trilha de auditoria.';

alter table public.member_administrators enable row level security;

-- Remover privilégios implícitos/default antes de conceder somente a leitura
-- necessária. Nenhum papel cliente pode manter concessões pela Data API.
revoke all privileges on table public.member_administrators from public, anon, authenticated;
grant select on table public.member_administrators to authenticated;

create policy member_administrators_select_own
  on public.member_administrators
  for select
  to authenticated
  using (
    auth.uid() is not null
    and user_id = auth.uid()
  );

create function public.can_manage_members()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.member_administrators
    where user_id = auth.uid()
  );
$$;

comment on function public.can_manage_members() is
  'Retorna se a identidade Auth da sessão possui a capacidade corrente manage_members.';

-- Funções recebem EXECUTE de PUBLIC por padrão no PostgreSQL. A ACL abaixo é
-- deliberadamente fechada e permite o RPC somente ao papel autenticado.
revoke all privileges on function public.can_manage_members() from public;
revoke all privileges on function public.can_manage_members() from anon;
grant execute on function public.can_manage_members() to authenticated;
