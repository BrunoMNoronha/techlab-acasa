# Ambientes, configuração e observabilidade

- **Status:** fundação estabelecida em P1-05 (Issue #12). Nenhum ambiente remoto existe.
- **Escopo:** contrato de configuração por ambiente, logs server-side mínimos, captura central de erros e prevenção/resposta a vazamento de segredos.
- **Fora de escopo:** provedores externos de logs/APM, projeto Vercel, projeto Supabase remoto, deploy, backup/restauração, domínio, SMTP de produção.

## Ambientes conceituais

| Ambiente | Onde roda | Como é acionado | Banco/Auth | Estado |
|---|---|---|---|---|
| **Local / development** | máquina do desenvolvedor (`next dev`) | `npm run dev` | stack Supabase local (`npm run db:start`) | **existe** |
| **Preview** | hospedagem preferencial (Vercel, ADR-0001) | push em branch que não é `main` / PR | futuro projeto Supabase remoto de não produção | **não existe**; não criar sem tarefa específica |
| **Production** | hospedagem preferencial (Vercel, ADR-0001) | merge em `main` | futuro projeto Supabase remoto de produção | **não existe**; não criar sem tarefa específica e decisão de custo |

Fatos confirmados nas fontes oficiais (2026-09-02):

- Vercel oferece os ambientes Local, Preview e Production, com variáveis de ambiente configuráveis por ambiente e, em Preview, também por branch. Alterações valem apenas para novos deploys.
- Next.js atribui `NODE_ENV=development` em `next dev` e `production` nos demais comandos; o logger registra esse valor no campo `environment`. A distinção Preview x Production, quando existir, será feita pela própria plataforma (cada deploy tem seus logs) — não foi criada variável para isso porque ainda não há uso real.

## Matriz de configuração

| Configuração | Classificação | Local | Preview | Production |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | pública (vai ao bundle) | `http://127.0.0.1:54321` (stack local) | URL do futuro projeto remoto — **valor não existe** | URL do futuro projeto remoto — **valor não existe** |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | pública (vai ao bundle) | `sb_publishable_...` exibida por `npx supabase status` | variável do ambiente Preview — **valor não existe** | variável do ambiente Production — **valor não existe** |

Regras:

- os valores de Preview/Production **não devem ser inventados nem versionados**; serão cadastrados na plataforma de hospedagem quando os projetos remotos forem criados;
- nenhuma variável secreta server-only é necessária hoje. Quando alguma for necessária (ex.: chave secreta do Supabase para operações administrativas, credenciais de SMTP), ela deve ser adicionada a esta matriz **sem** o prefixo `NEXT_PUBLIC_`, cadastrada como variável sensível na plataforma e lida somente em código server-side;
- a aplicação não usa `service_role`/`sb_secret_` em nenhum ambiente.

## Público x secreto

- `NEXT_PUBLIC_*` é destinado ao navegador. O Next.js **incorpora o valor ao bundle JavaScript durante `next build`** (somente acessos literais `process.env.NEXT_PUBLIC_X`). Depois do build o valor está congelado e é visível a qualquer pessoa que abra o site.
- **Nunca** coloque segredo com prefixo `NEXT_PUBLIC_`.
- A chave publicável do Supabase (`sb_publishable_...`) **não é segredo**: foi desenhada para o navegador; a proteção de dados vem de autorização server-side e RLS.
- Chaves `sb_secret_...` e a `service_role` **jamais** devem usar `NEXT_PUBLIC_`, chegar ao navegador ou ser versionadas. `getSupabasePublicConfig()` recusa explicitamente uma chave `sb_secret_` na variável pública.
- Variáveis sem o prefixo ficam disponíveis apenas no servidor (Node.js), lidas em tempo de execução em renderização dinâmica.

## Configuração local

1. `npm run db:start` e `npx supabase status` para obter URL e chave publicável locais;
2. copie `.env.example` para `.env.local` e preencha os valores;
3. `npm run dev` e acesse `http://127.0.0.1:3000`.

Arquivos reais (`.env`, `.env.local`, `.env.development.local`, `.env.production.local`, `.env.test.local` e variantes) são ignorados pelo Git (`.gitignore`: `.env*` com exceção de `.env.example`). Confirme com:

```bash
git check-ignore -v .env.local .env.production.local
```

`.env.example` contém somente nomes de variáveis e placeholders não funcionais.

### Validação de configuração

`src/lib/supabase/env.ts` (`getSupabasePublicConfig()`) falha de forma explícita quando:

- a URL não está definida ou não é `http(s)`;
- a chave não está definida;
- a chave começa com `sb_secret_`.

As mensagens nomeiam a variável e o problema, mas **nunca ecoam o valor recebido**, pois podem terminar em logs, terminal da CI ou relatórios.

## Política de logs

### Fundação

- Módulo: `src/lib/observability/logger.ts` (`logger.info|warn|error(event, context?)`).
- Uso **exclusivo em código server-side** (Server Components, Server Actions, Route Handlers, Proxy, instrumentation).
- Saída: **um evento JSON por linha** em stdout (`info`) / stderr (`warn`, `error`), via `console`. Qualquer plataforma (Vercel ou outra) captura sem SDK. Um provedor externo, se adotado, é plugado no `sink` do logger sem espalhar chamadas pelo código.
- Sem dependência runtime nova e sem APIs proprietárias de hospedagem.

### Formato

```json
{"timestamp":"2026-09-02T12:00:00.000Z","level":"error","event":"server.request_error","environment":"production","errorName":"TypeError","digest":"1234567890","method":"GET","routePath":"/app/area-restrita/page","routeType":"render","routerKind":"App Router","renderSource":"react-server-components"}
```

Campos fixos: `timestamp` (ISO 8601), `level`, `event` (nome estável, ex.: `auth.logout_failed`), `environment` (`NODE_ENV`).

### Allow-list de contexto

Somente estes campos são serializados; qualquer outra chave é descartada e valores não primitivos são ignorados. Textos são truncados a 200 caracteres.

| Campo | Conteúdo |
|---|---|
| `method` | método HTTP |
| `routePath` | **template** da rota (`/app/area-restrita/page`), nunca o path concreto |
| `routeType` | `render`, `route`, `action`, `proxy` |
| `routerKind`, `renderSource`, `revalidateReason` | contexto informado pelo Next.js |
| `errorName` | `error.name` (ou `typeof` para valores que não são `Error`) |
| `digest` | identificador gerado pelo Next.js/React; é o mesmo enviado ao cliente em produção |
| `errorCode` | código estável conhecido (ex.: `error.code` do Supabase Auth) |
| `status` | status HTTP associado |
| `errorMessage` | **somente em `development`** (ver abaixo) |

### O que nunca deve ser registrado

Senha; token; access/refresh token; JWT; cookies; cabeçalho `Authorization`; chave publicável/secreta/service role; query string; body de formulários; e-mail; CPF/RG; telefone; endereço; qualquer dado pessoal não aprovado; objetos completos de request, headers, cookies, erro do Supabase, usuário, claims ou `process.env`; `stack`.

A allow-list é a proteção principal: **não passe objetos arbitrários ao logger esperando que ele filtre**. Ela é uma defesa adicional, não uma autorização para despejar dados.

### Mensagem de erro em desenvolvimento

`describeError()` inclui `errorMessage` apenas quando `NODE_ENV === "development"` (guarda explícita e testada). Justificativa: acelerar diagnóstico local. Em preview/production nunca é incluída, porque mensagens de dependências podem conter entradas do usuário ou valores sensíveis. `stack` nunca é registrada pelo logger; em desenvolvimento o próprio `next dev` a exibe no terminal.

### O que é (e não é) evento operacional

Registrar (`warn`/`error`): exceção inesperada ao comunicar com serviço externo, falha interna inesperada, erro técnico que antes seria silencioso.

Eventos atuais:

| Evento | Nível | Origem |
|---|---|---|
| `server.request_error` | error | `onRequestError` (`src/instrumentation.ts`) |
| `auth.password_recovery_request_failed` | warn | `resetPasswordForEmail` retornou erro (ex.: limite de envio) |
| `auth.logout_failed` | warn | `signOut` retornou erro |
| `auth.password_update_failed` | warn | `updateUser` retornou código inesperado |
| `auth.session_check_failed` | warn | exceção ao verificar claims no Proxy |

**Não** registrar como erro: senha inválida, usuário não autenticado em rota protegida, e-mail inexistente na recuperação, validações esperadas de formulário. São fluxo normal, não devem gerar ruído nem facilitar enumeração de contas.

## Captura de erros

- `src/instrumentation.ts` exporta `onRequestError` (convenção oficial do Next.js 16). Recebe `error`, `request` e `context`, e encaminha ao logger apenas `method`, `routePath`, `routeType`, `routerKind`, `renderSource`, `revalidateReason` e os metadados seguros do erro. `request.path` (contém query string) e `request.headers` (cookies, Authorization) **não são repassados**. `register()` não é exportado por não ter uso concreto nesta fase.
- `src/app/error.tsx` e `src/app/global-error.tsx` exibem mensagem genérica com botão **Tentar novamente** (`retry`, estável desde Next.js 16.3.0). Não mostram mensagem interna, `digest`, stack, token ou configuração.
- Em produção, o Next.js já envia ao cliente apenas uma mensagem genérica e o `digest` para erros de Server Components.

## Como investigar um erro

1. Reproduza ou obtenha a data/hora aproximada do erro.
2. Localize nos logs da plataforma (ou no terminal local) a linha com `"event":"server.request_error"`.
3. Use `routePath`, `routeType` e `errorName` para identificar o ponto de falha; `digest` correlaciona com o erro que o cliente recebeu.
4. Reproduza localmente com `npm run dev`: em desenvolvimento a mensagem aparece em `errorMessage` e a stack no terminal.
5. Corrija com teste de regressão; não adicione campos ao logger para "ver mais" sem revisar esta política.

## Prevenção de vazamento de segredos

Camadas, todas obrigatórias:

1. `.gitignore` ignora `.env*` (exceto `.env.example`).
2. `.env.example` somente com placeholders; revisão de PR verifica o diff.
3. `npm run check:secrets` (`scripts/check-secret-markers.mjs`), executado na CI: varre os arquivos rastreados por marcadores (`sb_secret_...`, JWT, chave PEM, tokens GitHub/Supabase CLI) e falha sem imprimir valores. Padrões exigem comprimento mínimo para não acusar menções documentais.
4. GitHub secret scanning e push protection (ver abaixo).
5. `getSupabasePublicConfig()` recusa chave secreta em variável pública.

### GitHub secret scanning e push protection

Estado confirmado via API (`security_and_analysis`) em 2026-09-02 para o repositório público `BrunoMNoronha/techlab-acasa`:

| Recurso | Estado |
|---|---|
| `secret_scanning` | **enabled** |
| `secret_scanning_push_protection` | **enabled** |
| `secret_scanning_non_provider_patterns` | disabled |
| `secret_scanning_validity_checks` | disabled |
| alertas abertos | 0 |

Limitações que precisam ficar claras:

- detecta apenas **padrões suportados** de provedores parceiros; padrões genéricos (senhas, connection strings) não são cobertos sem configuração adicional;
- push protection pode ser **contornada** por quem tem permissão de escrita, com uma justificativa;
- é uma **camada adicional**: não substitui `.gitignore`, revisão de diff nem o script da CI;
- um valor detectado (ou detectado tarde) **já está exposto**: precisa ser revogado/rotacionado; remover do histórico não resolve.

Nenhum recurso pago (GitHub Advanced Security/Secret Protection) foi ou deve ser contratado.

## Incidente: segredo real exposto

1. **Não** apenas apague o arquivo ou a linha: o valor já foi publicado.
2. **Revogue/rotacione a credencial imediatamente** no provedor (Supabase, Vercel, GitHub, SMTP...).
3. Avalie o histórico Git (`git log -S`, `git log -p`) para saber desde quando e em quais branches/PRs o valor apareceu.
4. Verifique logs/auditoria do provedor em busca de uso indevido no período de exposição, quando aplicável.
5. Remova o segredo do código/configuração e substitua pela variável de ambiente correta.
6. Cadastre o novo valor na gestão de ambiente apropriada (`.env.local` local; variáveis da plataforma em Preview/Production).
7. Registre o incidente de forma segura (issue com data, tipo de credencial, ações tomadas), **sem repetir o segredo**.

Não execute reescrita destrutiva do histórico (`filter-repo`, force push) sem incidente real e necessidade comprovada; forks e clones existentes não são afetados por ela.

## Preparação de Preview/Production

Checklist a cumprir quando (e somente quando) a criação dos ambientes for aprovada:

- criar projeto Supabase remoto separado para produção (e, se possível, outro para preview), com RLS em todas as tabelas e MFA na conta;
- cadastrar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` por ambiente na plataforma de hospedagem;
- configurar `site_url`/redirect URLs do Auth para os domínios reais;
- SMTP customizado para e-mails do Auth e expiração de OTP de no máximo 1 hora;
- confirmar que os logs da plataforma capturam stdout/stderr e reter conforme política;
- decidir se `auth.session_check_failed` precisa de amostragem em caso de indisponibilidade prolongada do Auth.

## Pendências antes de produção

- plano/conta e região dos provedores (ADR-0001);
- provedor externo de observabilidade/alertas, se necessário (plugável via `sink`);
- política de retenção de logs;
- backup/restauração e metas de RPO/RTO;
- domínio, HTTPS e ambientes definitivos;
- serviço de e-mail transacional.

## Referências

- https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
- https://nextjs.org/docs/app/getting-started/error-handling
- https://nextjs.org/docs/app/api-reference/file-conventions/error
- https://nextjs.org/docs/app/guides/environment-variables
- https://vercel.com/docs/deployments/environments
- https://vercel.com/docs/environment-variables
- https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning
- https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection
- https://supabase.com/docs/guides/deployment/going-into-prod
