# TechLab+ ACASA

Sistema web para centralizar a gestão administrativa da ACASA e o relacionamento digital com seus associados.

## Estado atual

O projeto possui a arquitetura do MVP definida, a fundação executável da aplicação, a fundação local/versionada do banco de dados, a base de autenticação/autorização com Supabase Auth (login, logout, recuperação de acesso e rota protegida validada no servidor), a fundação de observabilidade e configuração por ambiente (logger estruturado, captura central de erros do servidor, páginas de erro genéricas e política de segredos), o catálogo de categorias estatutárias com governança de alteração normativa (P2-01), o cadastro administrativo mínimo de associados (P2-02) e a listagem com pesquisa textual, filtros e paginação server-side (P2-03) restrita a operadores com `manage_members`. Funcionalidades de negócio continuam sendo implementadas somente a partir dos requisitos e decisões versionados em `docs/`.

## Stack do MVP

Conforme o [ADR-0001](docs/architecture/adr/0001-stack-mvp.md):

- Node.js 24 LTS;
- TypeScript;
- Next.js 16 App Router;
- React;
- Tailwind CSS;
- PostgreSQL via Supabase;
- Supabase Auth e Storage nas fases correspondentes;
- Vercel como hospedagem preferencial quando o deploy entrar no escopo;
- GitHub Actions para qualidade contínua.

A configuração Supabase atualmente versionada é **somente para desenvolvimento local e migrations**. O repositório não está ligado a um projeto Supabase remoto e não contém credenciais de provedor.

## Requisitos locais

- Node.js 24;
- pnpm 11.25.0 (versão fixada em `package.json`);
- Docker Desktop, Docker Engine ou outro runtime de containers compatível com o Supabase CLI para executar o banco local.

Se utilizar `nvm`:

```bash
nvm use
```

## Instalação e execução da aplicação

```bash
pnpm install --frozen-lockfile
pnpm run dev
```

A aplicação ficará disponível por padrão em `http://localhost:3000`. Para os fluxos de autenticação, acesse pelo endereço configurado como `site_url` da stack local (`http://127.0.0.1:3000`) — veja a seção [Autenticação local](#autenticação-local).

## Banco de dados local

O Supabase CLI está fixado como dependência de desenvolvimento e deve ser executado pelos scripts do projeto, sem instalação global.

Inicie a stack local:

```bash
pnpm run db:start
```

Recrie o banco do zero aplicando todas as migrations versionadas:

```bash
pnpm run db:reset
```

Valide schema e testes de banco:

```bash
pnpm run db:lint
pnpm run db:test
```

Ao terminar:

```bash
pnpm run db:stop
```

A stack local é destinada exclusivamente a desenvolvimento/testes e não deve ser exposta publicamente. Não use `supabase link`, `supabase db push` ou comandos equivalentes contra ambiente remoto sem uma tarefa específica e configuração segura de credenciais.

## Autenticação local

A autenticação usa **Supabase Auth** com `@supabase/ssr` (sessão em cookies, clientes de navegador/servidor separados e `proxy.ts` do Next.js 16 para renovação de sessão). A validação de identidade no servidor usa `supabase.auth.getClaims()`; `getSession()` não é usado como base de autorização.

### Variáveis de ambiente

A aplicação usa somente variáveis públicas:

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL da API do Supabase (`http://127.0.0.1:54321` na stack local). |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave publicável (`sb_publishable_...`), segura para o navegador. |

Nenhuma chave secreta/`service_role` é usada pela aplicação. Copie `.env.example` para `.env.local` (ignorado pelo Git) e preencha com os valores exibidos por:

```bash
pnpm exec supabase status
```

`NEXT_PUBLIC_*` é incorporado ao bundle do navegador no build: nunca use esse prefixo para segredos. A matriz de configuração por ambiente (local, preview, production), a política de logs e o procedimento em caso de vazamento de segredo estão em [`docs/operations/environments-observability.md`](docs/operations/environments-observability.md).

## Observabilidade

- logs server-side estruturados (JSON por linha em stdout/stderr) via `src/lib/observability/logger.ts`, com allow-list de campos — nunca registre request, headers, cookies, tokens, e-mails ou senhas;
- erros inesperados do servidor são capturados por `src/instrumentation.ts` (`onRequestError`) e registrados com template da rota, tipo de rota, nome do erro e `digest`;
- `src/app/error.tsx` e `src/app/global-error.tsx` exibem mensagem genérica com opção de tentar novamente;
- nenhum provedor externo de logs/APM está integrado; o logger é o ponto único para isso no futuro.

### Rotas

| Rota | Função |
|---|---|
| `/login` | Login com e-mail e senha. |
| `/recuperar-acesso` | Solicitação de recuperação de acesso por e-mail. |
| `/auth/callback` | Callback PKCE que troca o código recebido por sessão. |
| `/redefinir-senha` | Definição de nova senha (exige sessão de recuperação válida). |
| `/area-restrita` | Rota autenticada de demonstração, com validação server-side própria e logout. |
| `/area-restrita/associados` | Listagem administrativa com pesquisa, filtros e paginação server-side para operadores com `manage_members`. |
| `/area-restrita/associados/novo` | Formulário administrativo para cadastro de novos associados. |
| `/area-restrita/associados/[id]` | Visualização detalhada do cadastro mínimo do associado. |
| `/area-restrita/associados/[id]/editar` | Formulário administrativo de edição dos dados mínimos do associado. |

### Regras da configuração local (`supabase/config.toml`)

- cadastro público de usuários (`enable_signup`) está **desabilitado**; a criação de contas para candidatos será decidida em P2-08/P2-09;
- senha mínima de 8 caracteres;
- e-mails são capturados pelo servidor SMTP local em `http://127.0.0.1:54324` (nenhum e-mail real é enviado);
- `site_url` e `additional_redirect_urls` permitem apenas `http://127.0.0.1:3000` e `http://localhost:3000`. Use o **mesmo host** para solicitar e concluir a recuperação de senha, pois o fluxo PKCE depende de cookies do navegador.

### Usuário de desenvolvimento

Como não há cadastro público, crie usuários de teste administrativamente no Supabase Studio local (`http://127.0.0.1:54323` → Authentication → Users → Add user), com senha de pelo menos 8 caracteres. Não versione credenciais de teste.

### Validação manual sugerida

1. `pnpm run db:start`, `pnpm run db:reset` e configure `.env.local`;
2. `pnpm run dev` e acesse `http://127.0.0.1:3000/login`;
3. confirme que `/area-restrita` redireciona para o login sem sessão e abre após o login;
4. use **Sair** e confirme o retorno ao login;
5. em `/recuperar-acesso`, solicite a recuperação, abra o e-mail em `http://127.0.0.1:54324`, siga o link e defina a nova senha.

## Validação

Execute antes de publicar alterações:

```bash
pnpm run check:secrets
pnpm run check:eol
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```

`check:secrets` varre os arquivos rastreados pelo Git em busca de marcadores de segredo (sem imprimir valores) e também roda na CI.

`check:eol` confirma que os arquivos rastreados estão com fim de linha **LF no índice**, conforme o `.gitattributes` e o `.editorconfig`. A cópia local pode legitimamente estar em CRLF no Windows: a verificação observa apenas o que o Git armazena. Se algum arquivo for acusado, execute `git add --renormalize .` e confirme com `git ls-files --eol`.

Quando houver mudança de banco, execute também:

```bash
pnpm run db:start
pnpm run db:reset
pnpm run db:lint
pnpm run db:test
pnpm run db:stop
```

O pipeline de CI executa as verificações de marcadores de segredo e de fim de linha, além das verificações da aplicação em Node 24, e valida migrations/testes de banco em uma stack Supabase local isolada.

## Convenções do repositório

- fim de linha **LF** para todo arquivo de texto, aplicado pelo `.gitattributes` (Git) e declarado no `.editorconfig` (editores), verificado por `pnpm run check:eol`;
- a normalização mantém migrations SQL, scripts e workflows idênticos em qualquer sistema operacional, preservando a garantia de que `pnpm run db:reset` reproduz o banco do zero.

## Princípios

- O GitHub é a fonte oficial de código e documentação.
- A Softaliza para Associações é usada apenas como referência funcional e de domínio.
- O MVP deve permanecer pequeno e resolver primeiro as necessidades reais da ACASA.
- Regras de negócio não devem ser inventadas para preencher lacunas.
- Segurança, LGPD, menor privilégio, auditoria, responsividade e acessibilidade são requisitos transversais.
- Decisões relevantes devem ser rastreáveis e documentadas.
- Migrations SQL versionadas são a fonte de verdade do schema do banco.

## Documentação

O índice oficial está em [`docs/README.md`](docs/README.md).

Documentos prioritários:

- [Visão do produto e MVP](docs/product/vision-mvp.md)
- [Requisitos iniciais](docs/product/requirements.md)
- [Regras de negócio](docs/product/business-rules.md)
- [Modelo de categorias e vínculo](docs/product/membership-model.md)
- [Decisões arquiteturais](docs/architecture/decision-log.md)
- [ADR da stack do MVP](docs/architecture/adr/0001-stack-mvp.md)
- [ADR da autorização administrativa](docs/architecture/adr/0002-member-administration-authorization.md)
- [Segurança e privacidade](docs/security/security-privacy.md)
- [Ambientes, configuração e observabilidade](docs/operations/environments-observability.md)
- [Operação local de `manage_members`](docs/operations/member-administration.md)
- [Backlog por fases](docs/delivery/backlog.md)
- [Riscos e decisões pendentes](docs/delivery/risks-decisions.md)
- [Definition of Done e critérios do MVP](docs/delivery/definition-of-done.md)
- [Instruções para agentes](docs/agents/project-instructions.md)

## Refinamento da autorização administrativa

A [Issue #22](https://github.com/BrunoMNoronha/techlab-acasa/issues/22) separou DT-015A (decisão técnica) de **DP-015B** (governança organizacional de quem recebe acesso e quem autoriza concessões/revogações na ACASA).

- A [Issue #24](https://github.com/BrunoMNoronha/techlab-acasa/issues/24) implementou a fundação técnica DT-015A (incremento 2 da P2-02): tabela de concessões específicas por UUID (`public.member_administrators`), RLS/ACL de leitura própria, predicado corrente `public.can_manage_members()`, guard server-only fail-closed (`requireMemberAdministration()`) e testes com Auth/JWT/Data API locais.
- A decisão organizacional **DP-015B foi aprovada formalmente em 2026-09-14** pelo responsável pelo produto e registrada em [`docs/delivery/risks-decisions.md`](docs/delivery/risks-decisions.md).
- A [Issue #26](https://github.com/BrunoMNoronha/techlab-acasa/issues/26) entregou o **incremento 3 da P2-02**: liberação seletiva de privilégios (`SELECT` em `public.membership_categories`; `SELECT` e `INSERT`/`UPDATE` coluna a coluna nos campos de negócio de `public.members` condicionados a `public.can_manage_members()`) e implementação completa do cadastro administrativo mínimo (listagem simples, criação, detalhes e edição) sob `/area-restrita/associados`. P2-05 mantém a matriz futura de perfis e P2-06 a auditoria de runtime.

## Próximos passos

Com a conclusão da P2-02 (cadastro administrativo mínimo) e da **P2-03** (pesquisa textual, filtros e paginação server-side na listagem de associados), o módulo de associados atende aos requisitos operacionais e de desempenho do RF-003 e RNF-008 para operadores com a capacidade `manage_members`.

Permanece no backlog e em decisões futuras:
- **P2-04**: situação cadastral (`ATIVO`, `INATIVO`, `SUSPENSO`, `DESLIGADO`), histórico de transição e regras estatutárias de desativação (DP-005);
- **P2-05**: perfis e permissões administrativas adicionais;
- **P2-06**: trilha de auditoria estruturada em runtime;
- **P2-08 / P2-09**: autoatendimento, portal do associado e inscrição pública (DP-008);
- **DP-006A**: decisão sobre importação de cadastro legado.

Remoção física (`DELETE`) permanece expressamente não autorizada por ACL e sem fluxo na aplicação. Os ambientes Preview/Production ainda não existem e sua criação exige tarefa específica e decisão de custo. Entidades e campos de negócio só devem ser adicionados quando suas regras estiverem suficientemente definidas.
