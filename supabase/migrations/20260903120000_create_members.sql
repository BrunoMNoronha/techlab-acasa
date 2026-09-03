-- Minimal Associado (member) entity — P2-02, incremento 1 (Issue #20).
--
-- Escopo aprovado pelo responsável pelo produto: apenas o schema mínimo do
-- cadastro administrativo. Nenhum CRUD, tela, API, perfil ou policy é criado
-- aqui, e nenhum dado pessoal além de nome, e-mail e telefone é coletado.
--
-- Decisões registradas em docs/product/member-model-refinement.md, §11:
--   D9/DP-013  entidade única com tipo de pessoa (PF/PJ), sem tabelas separadas;
--   D1/DP-008  CPF/CNPJ não são coletados nesta fase e nunca serão chave técnica;
--   D2..D5,D7,D8,D15,D17  RG, filiação, naturalidade, profissão, formação, foto,
--              contato de emergência, observações livres, endereços, data de
--              nascimento, número de registro legado e data de admissão não são
--              coletados;
--   D6         e-mail e telefone opcionais, sem unicidade e sem exigência de canal;
--   D10/DP-014 categoria estatutária obrigatória;
--   D12/DP-005 nenhuma coluna de situação cadastral (permanece na P2-04);
--   D13        nenhum vínculo com auth.users;
--   D14        chave primária uuid opaca e imutável.

create table public.members (
  id uuid primary key default gen_random_uuid(),
  person_type text not null,
  name text not null,
  membership_category_code text not null
    references public.membership_categories (code)
    on update cascade
    on delete restrict,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint members_person_type_allowed
    check (person_type in ('PF', 'PJ')),
  constraint members_name_not_blank
    check (btrim(name) <> ''),
  constraint members_email_not_blank
    check (email is null or btrim(email) <> ''),
  constraint members_phone_not_blank
    check (phone is null or btrim(phone) <> '')
);

comment on table public.members is
  'Cadastro administrativo mínimo de associados da ACASA (P2-02, incremento 1).';

comment on column public.members.id is
  'Identificador técnico opaco e imutável; nunca derivado de dado pessoal.';

comment on column public.members.person_type is
  'Tipo de pessoa admitido pelo Art. 12 do Estatuto: PF (pessoa física) ou PJ (pessoa jurídica).';

comment on column public.members.name is
  'Nome completo (PF) ou razão social (PJ). Não é chave e não é usado para deduplicação automática.';

comment on column public.members.membership_category_code is
  'Categoria estatutária obrigatória, referenciando o catálogo de public.membership_categories.';

comment on column public.members.email is
  'Contato administrativo opcional. Não é identificador de conta nem credencial de acesso.';

comment on column public.members.phone is
  'Contato administrativo opcional.';

comment on column public.members.created_at is
  'Momento em que o registro entrou no sistema. Não representa a data de admissão associativa (P2-04).';

comment on column public.members.updated_at is
  'Momento da última alteração do registro, mantido pelo banco.';

-- A FK cobre o código da categoria; este índice evita varredura sequencial na
-- verificação de "on delete restrict" e nas consultas por categoria.
create index members_membership_category_code_idx
  on public.members (membership_category_code);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Mantém a coluna updated_at da linha alterada no momento do UPDATE.';

create trigger members_set_updated_at
  before update on public.members
  for each row
  execute function public.set_updated_at();

alter table public.members enable row level security;

-- Deny by default: DP-015 (recorte mínimo de autorização administrativa) segue
-- aberta, portanto nenhuma policy é criada e nenhum papel de cliente recebe
-- acesso direto pela Data API. A aplicação não usa service_role.
revoke all privileges on table public.members from anon, authenticated;
