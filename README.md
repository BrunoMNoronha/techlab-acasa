# TechLab+ ACASA

Sistema web para centralizar a gestão administrativa da ACASA e o relacionamento digital com seus associados.

## Estado atual

O projeto possui a arquitetura do MVP definida e está iniciando a **fundação técnica executável**. Funcionalidades de negócio continuam sendo implementadas somente a partir dos requisitos e decisões versionados em `docs/`.

## Stack do MVP

Conforme o [ADR-0001](docs/architecture/adr/0001-stack-mvp.md):

- Node.js 24 LTS;
- TypeScript;
- Next.js 16 App Router;
- React;
- Tailwind CSS;
- PostgreSQL, Auth e Storage via Supabase nas fases correspondentes;
- Vercel como hospedagem preferencial quando o deploy entrar no escopo;
- GitHub Actions para qualidade contínua.

A fundação atual **não integra Supabase nem Vercel ainda**.

## Requisitos locais

- Node.js 24;
- npm compatível com a distribuição do Node 24.

Se utilizar `nvm`:

```bash
nvm use
```

## Instalação e execução

```bash
npm ci
npm run dev
```

A aplicação ficará disponível por padrão em `http://localhost:3000`.

## Validação

Execute antes de publicar alterações:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

O pipeline de CI executa as mesmas verificações em Node 24.

## Princípios

- O GitHub é a fonte oficial de código e documentação.
- A Softaliza para Associações é usada apenas como referência funcional e de domínio.
- O MVP deve permanecer pequeno e resolver primeiro as necessidades reais da ACASA.
- Regras de negócio não devem ser inventadas para preencher lacunas.
- Segurança, LGPD, menor privilégio, auditoria, responsividade e acessibilidade são requisitos transversais.
- Decisões relevantes devem ser rastreáveis e documentadas.

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
- [Backlog por fases](docs/delivery/backlog.md)
- [Riscos e decisões pendentes](docs/delivery/risks-decisions.md)
- [Definition of Done e critérios do MVP](docs/delivery/definition-of-done.md)
- [Instruções para agentes](docs/agents/project-instructions.md)

## Próximos passos

Após estabilizar esta fundação, as próximas tarefas são banco/migrations, autenticação/autorização e demais módulos conforme o backlog. Nenhuma regra funcional pendente deve ser antecipada na infraestrutura base.
