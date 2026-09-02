# Registro de decisões arquiteturais

Este documento registra o estado das decisões técnicas. Recomendações não devem ser tratadas como escolhas definitivas antes da análise exigida pelo impacto.

## Decisões confirmadas

### DA-001 — Aplicação web responsiva

**Status:** CONFIRMADA.

O produto inicial será uma aplicação web responsiva para desktop, tablet e mobile. Apps nativos não fazem parte do MVP.

### DA-002 — GitHub como fonte oficial

**Status:** CONFIRMADA.

O repositório `BrunoMNoronha/techlab-acasa` é a fonte oficial de código e documentação.

### DA-003 — Sistema exclusivo da ACASA no MVP

**Status:** CONFIRMADA em 2026-09-02.

O produto será inicialmente exclusivo da ACASA. Não introduzir `tenant_id`, abstrações multi-associação, white-label ou isolamento de tenants sem uma decisão futura explícita de transformar o produto em SaaS.

### DA-004 — Desenvolvimento tradicional

**Status:** CONFIRMADA em 2026-09-02.

O projeto seguirá desenvolvimento tradicional. OutSystems não será utilizado nesta implementação.

### DA-005 — Monólito modular full-stack

**Status:** ACEITA.

A fundação técnica adotará um monólito modular para o MVP, mantendo frontend, backend web e regras de aplicação no mesmo projeto/deploy, sem microserviços.

Detalhes e alternativas estão em [`adr/0001-stack-mvp.md`](adr/0001-stack-mvp.md).

### DA-006 — Stack web

**Status:** ACEITA.

- Node.js 24 LTS;
- TypeScript;
- Next.js 16 App Router;
- React;
- Tailwind CSS;
- componentes acessíveis reutilizáveis conforme necessidade.

Versões concretas devem ser fixadas pelo lockfile e mantidas em patches de segurança suportados. Como referência de segurança em 2026-09-02, Next.js 16.3 está na linha Active LTS e deve permanecer atualizado.

### DA-007 — Dados, autenticação e arquivos

**Status:** ACEITA para o MVP.

- PostgreSQL gerenciado pelo Supabase;
- Supabase Auth;
- Supabase Storage em buckets privados;
- migrations SQL versionadas via Supabase CLI.

Autorização deverá existir no servidor e, quando tabelas forem acessíveis pela Data API, também usar grants mínimos e Row Level Security compatível com o caso de uso.

### DA-008 — Hospedagem web

**Status:** ACEITA como opção preferencial do MVP.

Vercel será a hospedagem preferencial para a aplicação Next.js devido à integração com Git e previews por branch/PR. Evitar dependência de recursos proprietários quando não houver benefício concreto, mantendo possibilidade de mudança de provedor.

Esta decisão não autoriza contratação de plano pago.

## Decisões arquiteturais pendentes

| ID | Decisão | Impacto |
|---|---|---|
| DA-P01 | Região, conta e plano de Supabase para produção | residência/latência, custo, backup, operação |
| DA-P02 | Plano/conta Vercel para produção | custo, ambientes, observabilidade, limites |
| DA-P03 | Serviço de e-mail transacional | recuperação de acesso, confirmação de cadastro, notificações |
| DA-P04 | Estratégia de backup de arquivos privados | recuperação de comprovantes/documentos; Storage não está coberto pelo backup do banco |
| DA-P05 | RPO/RTO e política operacional de backup/restauração | disponibilidade e recuperação |
| DA-P06 | Observabilidade de produção | detecção de erros, logs, alertas e diagnóstico |

## Decisões retiradas do MVP

- gateway Pix/boleto/cartão: fora do MVP após definição de financeiro administrativo + comprovantes manuais;
- arquitetura SaaS/multi-tenant: fora do MVP;
- OutSystems: descartado para esta implementação;
- API backend independente/NestJS: não justificada no estágio atual.

## Processo para nova decisão relevante

1. identificar requisito e restrições;
2. pesquisar opções atuais quando necessário;
3. comparar alternativas e trade-offs;
4. considerar custo, segurança, manutenção, portabilidade, experiência da equipe e velocidade;
5. escolher a solução adequada ao estágio do produto;
6. registrar decisão em ADR quando ela passar a afetar implementação;
7. sincronizar código, testes e documentação.

Mudanças em banco, autenticação, autorização, APIs, infraestrutura e dependências exigem análise explícita de impacto.
