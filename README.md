# TechLab+ ACASA

Sistema web para centralizar a gestão administrativa da ACASA e o relacionamento digital com seus associados.

## Estado atual

O projeto possui a arquitetura do MVP definida, a fundação executável da aplicação e a fundação local/versionada do banco de dados. Funcionalidades de negócio continuam sendo implementadas somente a partir dos requisitos e decisões versionados em `docs/`.

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

A aplicação ficará disponível por padrão em `http://localhost:3000`.

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

## Validação

Execute antes de publicar alterações:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Quando houver mudança de banco, execute também:

```bash
npm run db:start
npm run db:reset
npm run db:lint
npm run db:test
npm run db:stop
```

O pipeline de CI executa as verificações da aplicação em Node 24 e valida migrations/testes de banco em uma stack Supabase local isolada.

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
- [Backlog por fases](docs/delivery/backlog.md)
- [Riscos e decisões pendentes](docs/delivery/risks-decisions.md)
- [Definition of Done e critérios do MVP](docs/delivery/definition-of-done.md)
- [Instruções para agentes](docs/agents/project-instructions.md)

## Próximos passos

Após estabilizar a fundação do banco, a próxima etapa técnica é autenticação/autorização base. Entidades e campos de negócio só devem ser adicionados quando suas regras estiverem suficientemente definidas.
