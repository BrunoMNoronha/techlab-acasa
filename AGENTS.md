<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# TechLab+ ACASA — orientação para agentes

Este repositório é a fonte oficial de código e documentação do TechLab+ ACASA, sistema de gestão da ACASA.

Antes de alterar qualquer arquivo, leia:

- [`docs/agents/project-instructions.md`](docs/agents/project-instructions.md) — instrução permanente do projeto (missão, escopo, arquitetura, segurança, fluxo de trabalho e relatório obrigatório);
- [`docs/README.md`](docs/README.md) — índice da documentação oficial (produto, arquitetura, segurança e entrega);
- [`docs/architecture/adr/0001-stack-mvp.md`](docs/architecture/adr/0001-stack-mvp.md) e [`docs/architecture/decision-log.md`](docs/architecture/decision-log.md) — decisões arquiteturais vigentes;
- [`README.md`](README.md) — pré-requisitos, instalação, scripts e validações locais.

Regras essenciais:

- não invente regras de negócio para preencher lacunas; consulte `docs/product/` e registre pendências;
- mantenha o MVP pequeno e a arquitetura simples (monólito modular Next.js, sem multi-tenancy nem microserviços);
- nunca versione segredos ou credenciais;
- execute `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` antes de abrir PR.
