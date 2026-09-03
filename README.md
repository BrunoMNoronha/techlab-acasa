# TechLab+ ACASA

Sistema web para centralizar a gestão administrativa da ACASA e o relacionamento digital com seus associados.

## Estado atual

O projeto possui a arquitetura do MVP definida, a fundação executável da aplicação, a fundação local/versionada do banco de dados, a base de autenticação/autorização com Supabase Auth (login, logout, recuperação de acesso e rota protegida validada no servidor), a fundação de observabilidade e configuração por ambiente (logger estruturado, captura central de erros do servidor, páginas de erro genéricas e política de segredos) e o catálogo de categorias estatutárias com governança de alteração normativa. Funcionalidades de negócio continuam sendo implementadas somente a partir dos requisitos e decisões versionados em `docs/`.

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
- npm compatível com a distribuição do Node 24;
- Docker Desktop, Docker Engine ou outro runtime de containers compatível com o Supabase CLI para executar o banco local.

Se utilizar `nvm`:

```bash
nvm use
```

## Instalação e execução da aplicação

```bash
npm ci
npm run dev
```

A aplicação ficará disponível por padrão em `http://localhost:3000`. Para os fluxos de autenticação, acesse pelo endereço configurado como `site_url` da stack local (`http://127.0.0.1:3000`) — veja a seção [Autenticação local](#autenticação-local).

## Banco de dados local

O Supabase CLI está fixado como dependência de desenvolvimento e deve ser executado pelos scripts do projeto, sem instalação global.

Inicie a stack local:

```bash
npm run db:start
```

Recrie o banco do zero aplicando todas as migrations versionadas:

```bash
npm run db:reset
```

Valide schema e testes de banco:

```bash
npm run db:lint
npm run db:test
```

Ao terminar:

```bash
npm run db:stop
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
npx supabase status
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

### Regras da configuração local (`supabase/config.toml`)

- cadastro público de usuários (`enable_signup`) está **desabilitado**; a criação de contas para candidatos será decidida em P2-08/P2-09;
- senha mínima de 8 caracteres;
- e-mails são capturados pelo servidor SMTP local em `http://127.0.0.1:54324` (nenhum e-mail real é enviado);
- `site_url` e `additional_redirect_urls` permitem apenas `http://127.0.0.1:3000` e `http://localhost:3000`. Use o **mesmo host** para solicitar e concluir a recuperação de senha, pois o fluxo PKCE depende de cookies do navegador.

### Usuário de desenvolvimento

Como não há cadastro público, crie usuários de teste administrativamente no Supabase Studio local (`http://127.0.0.1:54323` → Authentication → Users → Add user), com senha de pelo menos 8 caracteres. Não versione credenciais de teste.

### Validação manual sugerida

1. `npm run db:start`, `npm run db:reset` e configure `.env.local`;
2. `npm run dev` e acesse `http://127.0.0.1:3000/login`;
3. confirme que `/area-restrita` redireciona para o login sem sessão e abre após o login;
4. use **Sair** e confirme o retorno ao login;
5. em `/recuperar-acesso`, solicite a recuperação, abra o e-mail em `http://127.0.0.1:54324`, siga o link e defina a nova senha.

## Validação

Execute antes de publicar alterações:

```bash
npm run check:secrets
npm run lint
npm run typecheck
npm test
npm run build
```

`check:secrets` varre os arquivos rastreados pelo Git em busca de marcadores de segredo (sem imprimir valores) e também roda na CI.

Quando houver mudança de banco, execute também:

```bash
npm run db:start
npm run db:reset
npm run db:lint
npm run db:test
npm run db:stop
```

O pipeline de CI executa a verificação de marcadores de segredo e as verificações da aplicação em Node 24, e valida migrations/testes de banco em uma stack Supabase local isolada.

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
- [Segurança e privacidade](docs/security/security-privacy.md)
- [Ambientes, configuração e observabilidade](docs/operations/environments-observability.md)
- [Backlog por fases](docs/delivery/backlog.md)
- [Riscos e decisões pendentes](docs/delivery/risks-decisions.md)
- [Definition of Done e critérios do MVP](docs/delivery/definition-of-done.md)
- [Instruções para agentes](docs/agents/project-instructions.md)

## Próximos passos

Com a Fase 1 (fundação técnica) concluída e o catálogo de categorias estatutárias formalizado (P2-01), a próxima etapa é o cadastro de associados (P2-02), que inclui o vínculo entre associado e categoria estatutária. Perfis/permissões administrativas (P2-05) e a inscrição pública (P2-08/P2-09) dependem de decisões ainda registradas como pendentes. Os ambientes Preview/Production ainda não existem e sua criação exige tarefa específica e decisão de custo. Entidades e campos de negócio só devem ser adicionados quando suas regras estiverem suficientemente definidas.
