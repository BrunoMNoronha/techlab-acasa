# ADR-0001 — Stack e arquitetura do MVP

- **Status:** ACEITA
- **Data:** 2026-09-02
- **Escopo:** fundação técnica do MVP

## Contexto

O TechLab+ ACASA será inicialmente um sistema exclusivo da ACASA, desenvolvido de forma tradicional. O MVP inclui aplicação web responsiva, autenticação, área administrativa, área do associado, inscrição pública de candidatos, controle financeiro administrativo, comprovantes manuais, documentos privados, comunicados e auditoria.

Não há requisito de multi-tenancy, apps nativos, gateway de pagamentos ou API pública no MVP.

A arquitetura deve favorecer simplicidade operacional, segurança, rastreabilidade, desenvolvimento incremental e possibilidade de evolução sem antecipar serviços distribuídos.

## Decisão

Adotar um **monólito modular full-stack** com:

- **Node.js 24 LTS** como runtime de referência;
- **TypeScript** como linguagem principal;
- **Next.js 16 App Router** como framework full-stack;
- **React** para interface;
- **Tailwind CSS** para estilos utilitários;
- componentes acessíveis reutilizáveis, preferencialmente compatíveis com o ecossistema shadcn/ui/Radix quando agregarem valor;
- **PostgreSQL gerenciado pelo Supabase** como banco relacional;
- **Supabase Auth** para autenticação;
- **Supabase Storage** com buckets privados para documentos, comprovantes e anexos;
- **Supabase CLI/migrations SQL** como mecanismo inicial de evolução do banco;
- **Vercel** como hospedagem preferencial da aplicação Next.js;
- **GitHub Actions** para lint, typecheck, testes e build;
- testes unitários/integrados com ferramenta compatível com TypeScript e testes E2E com Playwright quando as jornadas começarem a existir.

A aplicação deverá organizar o domínio em módulos coesos dentro do mesmo deploy, evitando microserviços e abstrações de tenant.

## Segurança

- autenticação SSR deve usar cookies e clientes server-side adequados;
- autorização deve ser validada no servidor;
- tabelas expostas pela Data API devem usar grants mínimos e RLS;
- políticas de RLS devem possuir testes positivos e negativos quando usadas para proteger dados do usuário;
- chaves administrativas/service-role nunca devem chegar ao navegador;
- arquivos privados devem permanecer em buckets privados e ser acessados por autorização autenticada ou URLs assinadas de curta duração;
- upload deve validar tipo, tamanho e contexto do arquivo;
- operações administrativas críticas devem gerar auditoria.

## Justificativa

### Next.js full-stack

O domínio e o tamanho atual do MVP não justificam frontend e API em deploys separados. Next.js oferece interface, Server Components, Route Handlers e Server Actions no mesmo projeto, reduzindo custo de coordenação e operação.

### PostgreSQL

Associados, categorias, solicitações, permissões, cobranças, pagamentos, comprovantes e auditoria são dados fortemente relacionais e transacionais. PostgreSQL oferece constraints, transações, índices e boa portabilidade.

### Supabase

Concentra PostgreSQL, autenticação e armazenamento de arquivos, reduzindo a quantidade de fornecedores e integrações a operar no MVP. O banco continua sendo PostgreSQL completo; Storage oferece controle de acesso e buckets privados; Auth integra com o banco e pode trabalhar com RLS.

### Vercel

É a opção operacionalmente mais simples para Next.js no estágio atual, com integração Git e preview deployments. A aplicação não deve depender de APIs proprietárias da Vercel sem necessidade, preservando possibilidade de self-host ou outro provedor.

## Alternativas consideradas

### Frontend Next.js + API NestJS separada

**Não escolhida agora.** Aumentaria projetos, deploys, contratos internos e observabilidade sem existir consumidor independente de API que justifique a separação.

### Next.js + Neon + Auth.js + storage S3/R2

**Viável**, com maior separação entre fornecedores e potencial portabilidade de componentes, porém exige operar e integrar mais serviços para o mesmo MVP.

### OutSystems

**Descartado para este projeto** após decisão de utilizar desenvolvimento tradicional.

### Multi-tenant/SaaS desde o início

**Descartado no MVP.** O produto será exclusivamente da ACASA nesta fase.

## Consequências

### Positivas

- um único projeto de aplicação;
- menor complexidade operacional;
- autenticação, dados e arquivos em uma plataforma integrada;
- PostgreSQL preserva boa portabilidade do núcleo de dados;
- suporte a preview deployments e CI baseado em Git;
- arquitetura adequada a equipe pequena e desenvolvimento incremental.

### Negativas / riscos

- dependência operacional de Supabase para Auth/Storage;
- integração SSR de autenticação precisa acompanhar APIs oficiais e atualizações;
- RLS mal configurada pode causar exposição ou bloqueio indevido;
- Vercel e Supabase podem exigir plano pago conforme volume, backup e necessidades de produção;
- Storage não deve ser confundido com backup de banco e precisa de estratégia própria de recuperação.

## Restrições de custo

Esta decisão **não autoriza contratação de plano pago**. Desenvolvimento pode começar com recursos gratuitos/locais compatíveis. Qualquer custo recorrente relevante para produção deve ser apresentado antes de contratação.

## Referências pesquisadas

- https://nextjs.org/docs
- https://nextjs.org/blog
- https://nodejs.org/about/previous-releases
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/storage
- https://supabase.com/docs/guides/storage/serving/downloads
- https://supabase.com/docs/guides/platform/backups
- https://vercel.com/docs/frameworks/full-stack/nextjs
- https://vercel.com/docs/git

## Decisões ainda necessárias antes de produção

- plano/conta e região dos provedores;
- política de backup de banco e arquivos;
- serviço de e-mail transacional;
- domínio e ambientes definitivos;
- metas de RPO/RTO;
- observabilidade de produção.
