# Backlog inicial por fases

Este backlog organiza trabalho, mas **não transforma itens pendentes em requisitos aprovados**. Cada item que depender de regra da ACASA deve ser refinado antes de implementação.

## Fase 0 — Descoberta e decisões bloqueadoras

### P0-01 — Definir escopo organizacional — CONCLUÍDO
**Decisão:** sistema exclusivo da ACASA no MVP; sem SaaS/multi-tenancy.

### P0-02 — Mapear processo real de associação — EM ANDAMENTO
**Decisão já tomada:** inscrição pública fará parte do MVP.

**Confirmado pelo Estatuto 2025:** a Diretoria possui competência para admitir/demitir sócios.

**Pendente:** campos/documentos obrigatórios, finalidade dos dados, estados da solicitação, delegação operacional/perfis, critérios de aprovação/rejeição e regras de conversão em associado.

**Aceite:** fluxo e regras documentados com critérios de aceite e permissões.

### P0-03 — Definir financeiro do MVP — CONCLUÍDO NO ESCOPO
**Decisão:** controle administrativo de cobranças/pagamentos + comprovantes manuais. Gateway Pix/boleto/cartão fora do MVP.

**Pendente para detalhamento:** competência, vencimento, adimplência e workflow exato de comprovantes.

### P0-04 — Levantar categorias e situações reais — PARCIALMENTE CONCLUÍDO
**Categorias confirmadas pelo Estatuto 2025, Art. 12:** Fundadores, Beneméritos e Contribuintes.

**Ciclo de vínculo confirmado:** admissão, desligamento/exclusão por vontade própria, exclusão ex officio, recurso à Assembleia Geral e possibilidade de readmissão.

**Normalização recomendada para o sistema:** `ATIVO`, `DESLIGADO_VOLUNTARIAMENTE` e `EXCLUIDO_EX_OFFICIO`; readmissão como transição para `ATIVO`.

**Pendente:** confirmar a normalização operacional acima e detalhar fluxo de recurso/readmissão. Não criar `SUSPENSO` ou `INATIVO` sem nova base normativa.

**Referência:** `../product/membership-model.md`.

### P0-05 — Avaliar migração — PARCIAL
**Confirmado:** histórico da planilha de pagamentos não será migrado; arquivo serve apenas como referência operacional.

**Pendente:** inventariar se existem cadastros não financeiros que precisam ser importados.

### P0-06 — Definir restrições técnicas e ambiente — SUFICIENTE PARA A STACK
**Confirmado:** desenvolvimento tradicional.

**Pendente não bloqueador:** sistema operacional predominante para ajustar documentação operacional.

## Fase 1 — Fundação técnica

### P1-01 — ADR de stack e arquitetura do MVP — CONCLUÍDO
- ADR-0001 criado;
- monólito modular full-stack;
- Node.js 24 LTS + TypeScript + Next.js 16;
- PostgreSQL/Auth/Storage no Supabase;
- Vercel como hospedagem preferencial;
- sem multi-tenancy.

### P1-02 — Aplicação base e pipeline de qualidade — CONCLUÍDO
- aplicação base em Next.js 16.3.3 + React + TypeScript;
- Node.js 24 e npm com lockfile versionado;
- Tailwind CSS e página inicial mínima, responsiva e acessível;
- ESLint, typecheck e teste smoke com Vitest/React Testing Library;
- build de produção validado;
- GitHub Actions executando `npm ci`, lint, typecheck, teste e build;
- README de execução local e `AGENTS.md` versionados;
- nenhuma integração Supabase/Vercel ou regra de negócio antecipada nesta etapa.

**Evidência:** PR #5 e CI do branch `feat/application-foundation` validados antes do merge.

### P1-03 — Banco e migrations — CONCLUÍDO
- Supabase CLI `2.116.0` fixado como dependência de desenvolvimento;
- configuração local versionada sem ligação com projeto remoto;
- migrations SQL definidas como fonte de verdade do schema;
- primeira migration limitada à tabela de referência `membership_categories`;
- categorias estatutárias carregadas: Fundador, Benemérito e Contribuinte;
- RLS habilitado e privilégios de `anon`/`authenticated` revogados;
- nenhum estado cadastral pendente ou entidade `Associado` antecipado;
- testes pgTAP cobrindo schema, três categorias e restrições de acesso;
- CI de banco executando stack Supabase local, reset, lint e testes;
- `db reset` reproduz o banco do zero e `db lint --level error` não reporta erro de schema.

**Evidência:** PR #8; CI validou aplicação e banco local, com 8/8 testes pgTAP aprovados. Nenhum ambiente Supabase remoto foi modificado.

### P1-04 — Autenticação e autorização base — CONCLUÍDO
- Supabase Auth com `@supabase/ssr` 0.12.5 e `@supabase/supabase-js` 2.114.0 fixados;
- clientes de navegador/servidor com cookies via `getAll`/`setAll` e `proxy.ts` (Next.js 16) renovando a sessão com redirecionamento otimista;
- validação server-side com `getClaims()`; `getSession()` não é usado como base de autorização;
- login com e-mail/senha, logout e recuperação de acesso (callback PKCE + nova senha) validados contra a stack local com SMTP local;
- rota protegida `/area-restrita` com validação própria no servidor, negando acesso anônimo independentemente do Proxy;
- cadastro público desabilitado na configuração local (`enable_signup = false`) até decisão de P2-08/P2-09; senha mínima 8;
- somente identidade autenticado/anônimo; nenhuma tabela de perfil, migration ou policy nova — perfis e permissões permanecem em P2-05;
- apenas variáveis públicas (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`); nenhum segredo versionado;
- testes Vitest para clientes, Proxy, identidade, ações de login/recuperação/nova senha, callback e rota protegida (negativo e positivo); 8/8 pgTAP preservados.

**Evidência:** Issue #10 e PR #11; CI validou aplicação e banco local, e o fluxo completo (login, logout, recuperação PKCE, bloqueio de signup) foi validado contra a stack Supabase local. Nenhum ambiente Supabase/Vercel remoto foi criado ou alterado.

### P1-05 — Observabilidade e gestão de segredos — CONCLUÍDO
- logger server-side estruturado (JSON por linha em stdout/stderr) em `src/lib/observability/logger.ts`, com níveis `info|warn|error`, timestamp, evento estável, `environment` e **allow-list** de contexto; sem dependência runtime nova e sem provedor externo (ponto único para plugar um provedor no futuro);
- `src/instrumentation.ts` com `onRequestError` encaminhando erros do servidor ao logger com template da rota, tipo de rota, método, nome do erro e `digest` — sem headers, cookies, path concreto ou query string;
- `error.tsx` e `global-error.tsx` genéricos, acessíveis e com retry, sem detalhes técnicos;
- logger aplicado somente a falhas técnicas do Auth (recuperação, logout, atualização de senha, exceção no Proxy); fluxos esperados (senha inválida, anônimo em rota protegida, validações) não geram log;
- `getSupabasePublicConfig()` valida URL http(s), chave presente e recusa `sb_secret_` em variável pública, sem ecoar valores;
- matriz de configuração Local/Preview/Production, distinção público x secreto, política de logs, campos proibidos, investigação de erro e procedimento de incidente de segredo em `docs/operations/environments-observability.md`; valores de Preview/Production marcados como inexistentes;
- `.env*` reais ignorados (validado com `git check-ignore`), `.env.example` só com placeholders, `npm run check:secrets` (script sem terceiros) executado na CI;
- GitHub secret scanning e push protection confirmados ativos via API (0 alertas), com limitações registradas; nenhum recurso pago contratado;
- testes Vitest para logger, minimização, `onRequestError`, configuração e UI de erro (81 testes no total); 8/8 pgTAP preservados;
- nenhum ambiente Vercel/Supabase remoto criado; nenhum serviço pago.

**Evidência:** Issue #12 e PR #13; CI validou aplicação, verificação de segredos e banco local. Erro server-side controlado validado localmente: evento estruturado no terminal sem cookies/Authorization/token/e-mail e mensagem genérica ao usuário.

## Fase 2 — Administração e ingresso de associados

### P2-01 — Categorias estatutárias
- disponibilizar Fundadores, Beneméritos e Contribuintes;
- vincular categoria ao associado;
- impedir alteração cotidiana sem autorização/governança apropriada;
- auditar mudanças quando houver alteração normativa futura.

### P2-02 — Associados
Cadastro, edição, consulta e validações.

### P2-03 — Pesquisa e filtros
Paginação e filtros necessários à operação real.

### P2-04 — Situação cadastral
Implementar estados/transições apenas conforme `membership-model.md` e decisão final de normalização; preservar histórico de desligamento, exclusão, recurso e readmissão.

### P2-05 — Perfis e permissões
Matriz mínima de administração com validação server-side e respeito à competência estatutária da Diretoria para admissão/demissão de sócios.

### P2-06 — Auditoria administrativa
Registrar operações críticas definidas para o módulo.

### P2-07 — Dashboard administrativo inicial
Somente indicadores derivados das capacidades já implementadas e validadas.

### P2-08 — Solicitação pública de associação
- formulário público com campos aprovados;
- validação server-side;
- proteção contra abuso proporcional ao risco;
- anexos somente se aprovados;
- situação da solicitação separada da situação do associado.

### P2-09 — Análise administrativa de solicitação
- fila/listagem de solicitações;
- detalhes conforme permissão;
- transições aprovadas;
- comentários/motivos quando aplicáveis;
- auditoria;
- conversão segura de solicitação aprovada em associado.

## Fase 3 — Financeiro básico

### P3-01 — Cobranças
Modelo, criação e consulta conforme regras aprovadas.

### P3-02 — Pagamentos
Registro administrativo e consulta.

### P3-03 — Situação financeira
Pendências e adimplência sem alterar automaticamente situação cadastral. O Regimento utiliza inadimplência no contexto financeiro/operacional das taxas nele disciplinadas.

### P3-04 — Comprovantes — APROVADO PARA O MVP
- upload privado;
- vínculo com cobrança/associado conforme regra;
- análise administrativa;
- aprovação/rejeição/correção conforme estados que ainda serão definidos;
- auditoria.

### P3-05 — Gateway de pagamento — FORA DO MVP
Não implementar Pix/boleto/cartão automatizado sem replanejamento futuro.

## Fase 4 — Portal do associado

### P4-01 — Área autenticada
Acesso somente ao próprio contexto autorizado.

### P4-02 — Dados e situação
Consulta dos próprios dados, categoria estatutária e situação cadastral/financeira separadas.

### P4-03 — Financeiro
Consulta de cobranças/pagamentos permitidos.

### P4-04 — Comprovantes
Envio e acompanhamento do estado permitido ao associado.

### P4-05 — Documentos
Listagem e acesso autorizado a arquivos.

### P4-06 — Comunicados
Consulta dos comunicados aplicáveis.

## Fase 5 — Fechamento do MVP

### P5-01 — Testes de jornadas críticas
Cobrir ingresso, administração e portal do associado.

### P5-02 — Segurança e privacidade
Revisar autorização, formulário público, uploads, dados pessoais, segredos, logs e auditoria.

### P5-03 — Acessibilidade e responsividade
Validar fluxos principais com referência WCAG 2.2 AA.

### P5-04 — Migração inicial
**Condicional:** executar somente para dados não financeiros cuja migração seja confirmada, com reconciliação e possibilidade segura de recuperação.

### P5-05 — Operação
Validar backup/restauração compatíveis, monitoramento, deploy e documentação operacional.

### P5-06 — Aceite do MVP
Avaliar todos os critérios de `definition-of-done.md`.

## Evolução pós-MVP

Somente após priorização explícita: gateway de pagamentos, carteirinha digital, eventos, votações, cursos, cupons, WhatsApp, Wallet, apps nativos, API pública, multi-idioma, financeiro avançado e eventual SaaS/multi-tenancy.
