# TechLab+ ACASA

Sistema web para centralizar a gestão administrativa da ACASA e o relacionamento digital com seus associados.

## Estado atual

A fase de descoberta e decisões arquiteturais foi concluída e a stack do MVP está aprovada no [ADR-0001](docs/architecture/adr/0001-stack-mvp.md). O repositório contém a **fundação executável da aplicação** (Next.js 16 App Router, TypeScript, Tailwind CSS, ESLint, Vitest e CI no GitHub Actions) com uma página inicial simples. Ainda **não há funcionalidades de negócio**, banco de dados, autenticação ou deploy; esses itens seguem o [backlog por fases](docs/delivery/backlog.md).

## Princípios

- O GitHub é a fonte oficial de código e documentação.
- A Softaliza para Associações é usada apenas como referência funcional e de domínio.
- O MVP deve permanecer pequeno e resolver primeiro as necessidades reais da ACASA.
- Regras de negócio não devem ser inventadas para preencher lacunas.
- Segurança, LGPD, menor privilégio, auditoria, responsividade e acessibilidade são requisitos transversais.
- Decisões relevantes devem ser rastreáveis e documentadas.

## Pré-requisitos

- **Node.js 24 LTS** (versão indicada em [`.nvmrc`](.nvmrc); `package.json` declara `engines.node` como `24.x`);
- **npm** (distribuído com o Node.js). O lockfile `package-lock.json` é versionado e deve ser respeitado.

Com nvm ou equivalente, use `nvm use` na raiz do repositório para selecionar a versão correta.

## Instalação

```bash
npm ci
```

`npm ci` faz a instalação determinística a partir do `package-lock.json`. Use `npm install` apenas ao alterar dependências intencionalmente e versione o lockfile resultante.

## Execução local

```bash
npm run dev
```

A aplicação fica disponível em `http://localhost:3000`.

## Scripts

| Script | Comando | Finalidade |
|---|---|---|
| `dev` | `npm run dev` | servidor de desenvolvimento |
| `build` | `npm run build` | build de produção |
| `start` | `npm run start` | serve o build de produção |
| `lint` | `npm run lint` | ESLint com a configuração do Next.js |
| `typecheck` | `npm run typecheck` | gera os tipos de rotas (`next typegen`) e executa `tsc --noEmit` |
| `test` | `npm test` | Vitest em execução única, não interativa (usada no CI) |
| `test:watch` | `npm run test:watch` | Vitest em modo watch para desenvolvimento |

## Validação

Antes de abrir um PR, execute a mesma sequência do CI:

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npm test
```

```bash
npm run build
```

Os testes usam Vitest com React Testing Library em ambiente jsdom e ficam ao lado do código em `src/**/*.test.tsx`.

## Integração contínua

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) executa, em Node.js 24 e a cada push ou pull request para `main`: `npm ci`, lint, typecheck, testes e build.

## Estrutura

- `src/app/` — App Router do Next.js (layout raiz, página inicial e estilos globais);
- `docs/` — documentação oficial do projeto;
- alias de importação `@/*` aponta para `src/*`.

## Documentação

O índice oficial está em [`docs/README.md`](docs/README.md). Agentes de IA devem começar por [`AGENTS.md`](AGENTS.md) e [`docs/agents/project-instructions.md`](docs/agents/project-instructions.md).

Documentos prioritários:

- [Visão do produto e MVP](docs/product/vision-mvp.md)
- [Requisitos iniciais](docs/product/requirements.md)
- [Regras de negócio](docs/product/business-rules.md)
- [ADR-0001 — Stack e arquitetura do MVP](docs/architecture/adr/0001-stack-mvp.md)
- [Decisões arquiteturais](docs/architecture/decision-log.md)
- [Segurança e privacidade](docs/security/security-privacy.md)
- [Backlog por fases](docs/delivery/backlog.md)
- [Riscos e decisões pendentes](docs/delivery/risks-decisions.md)
- [Definition of Done e critérios do MVP](docs/delivery/definition-of-done.md)
- [Instruções para agentes](docs/agents/project-instructions.md)

## Próxima fase

Seguir a Fase 1 do [backlog](docs/delivery/backlog.md): banco e migrations (P1-03), autenticação e autorização base (P1-04) e observabilidade/gestão de segredos (P1-05), sempre respeitando as decisões pendentes registradas em [`docs/delivery/risks-decisions.md`](docs/delivery/risks-decisions.md).
