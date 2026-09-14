# AGENTS.md

Antes de editar este repositório, leia:

1. `docs/README.md`;
2. `docs/agents/project-instructions.md`;
3. os requisitos, decisões arquiteturais e documentos do módulo afetado.

O GitHub e a documentação versionada são a fonte de verdade. Não invente regras de negócio, não antecipe funcionalidades fora do MVP e mantenha requisitos, implementação, testes e documentação sincronizados.

## Gerenciador de pacotes

Use exclusivamente pnpm (versão fixada em `package.json`), localmente e na CI. Instale com `pnpm install --frozen-lockfile`; execute ferramentas com `pnpm exec` e scripts com `pnpm run`. Não execute npm/npx nem crie `package-lock.json`. Preserve `pnpm-lock.yaml`.
