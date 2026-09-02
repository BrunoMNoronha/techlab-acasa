# Registro de decisões arquiteturais

Este documento registra o estado das decisões técnicas. Recomendações não devem ser tratadas como escolhas definitivas antes da análise exigida pelo impacto.

## Decisões confirmadas

### DA-001 — Aplicação web responsiva

**Status:** CONFIRMADA.

O produto inicial será uma aplicação web responsiva para desktop, tablet e mobile. Apps nativos não fazem parte do MVP.

### DA-002 — GitHub como fonte oficial

**Status:** CONFIRMADA.

O repositório `BrunoMNoronha/techlab-acasa` é a fonte oficial de código e documentação.

### DA-003 — Sem multi-tenancy antecipado

**Status:** BASELINE DE SEGURANÇA DE ESCOPO.

Não introduzir abstrações multi-associação enquanto a decisão de produto sobre SaaS não estiver confirmada.

## Recomendações atuais — não aprovadas

### DA-R01 — TypeScript + Next.js full-stack para MVP

**Status:** RECOMENDAÇÃO.

Razões atuais: reduzir complexidade inicial, compartilhar linguagem entre frontend/backend e manter um único artefato de aplicação enquanto o domínio ainda está sendo validado.

**Não implementar antes de:** validar restrições organizacionais, experiência da equipe, custos e necessidade de portabilidade.

### DA-R02 — PostgreSQL

**Status:** RECOMENDAÇÃO.

A natureza relacional de associados, categorias, permissões, cobranças, pagamentos e auditoria favorece banco relacional transacional.

### DA-R03 — Object storage para arquivos

**Status:** RECOMENDAÇÃO.

Documentos e comprovantes devem ficar em armazenamento de objetos com acesso controlado, sem armazenar binários no banco relacional salvo justificativa específica.

### DA-R04 — Infraestrutura gerenciada para MVP

**Status:** RECOMENDAÇÃO.

Vercel, Supabase e serviços equivalentes podem reduzir esforço operacional, mas fornecedor e arquitetura de implantação permanecem pendentes.

## Decisões arquiteturais pendentes

| ID | Decisão | Impacto |
|---|---|---|
| DA-P01 | ACASA única ou SaaS/multi-associação | modelo de dados, autorização, isolamento, autenticação, custos |
| DA-P02 | Desenvolvimento tradicional ou OutSystems | licenciamento, portabilidade, governança, velocidade, integrações |
| DA-P03 | Stack web definitiva | estrutura do repositório, padrões, testes, deploy |
| DA-P04 | Provedor/estratégia de autenticação | sessões, recuperação, MFA, operação, custo |
| DA-P05 | Banco e provedor gerenciado | migrations, backup, conectividade, custo |
| DA-P06 | Object storage | autorização de arquivos, URLs assinadas, retenção |
| DA-P07 | Hospedagem | CI/CD, observabilidade, domínios, segredos |
| DA-P08 | Gateway de pagamentos, se entrar no MVP | webhooks, conciliação, segurança, custo, contrato |
| DA-P09 | Serviço de e-mail | recuperação de acesso, notificações, entregabilidade |

## Processo para nova decisão relevante

1. identificar requisito e restrições;
2. pesquisar opções atuais quando necessário;
3. comparar alternativas e trade-offs;
4. considerar custo, segurança, manutenção, portabilidade, experiência da equipe e velocidade;
5. escolher a solução adequada ao estágio do produto;
6. registrar decisão em ADR quando ela passar a afetar implementação;
7. sincronizar código, testes e documentação.

Mudanças em banco, autenticação, autorização, APIs, infraestrutura e dependências exigem análise explícita de impacto.