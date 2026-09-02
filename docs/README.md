# Documentação — TechLab+ ACASA

Este diretório é a fonte oficial da documentação do projeto, em conjunto com o código e o histórico do repositório.

## Princípios de governança

- O GitHub é a fonte de verdade do projeto.
- Softaliza para Associações é referência funcional e de domínio, nunca requisito automático, especificação técnica ou identidade visual a copiar.
- Requisitos, decisões e implementação devem permanecer rastreáveis.
- Informações devem ser classificadas como **fato confirmado**, **requisito aprovado**, **hipótese**, **recomendação** ou **decisão pendente**.
- Não implementar regra de negócio não validada.
- O MVP deve permanecer pequeno e orientado às necessidades reais da ACASA.

## Estrutura

### Produto
- [`product/vision-mvp.md`](product/vision-mvp.md) — visão, usuários, objetivos, escopo e limites do MVP.
- [`product/requirements.md`](product/requirements.md) — requisitos funcionais e não funcionais iniciais.
- [`product/business-rules.md`](product/business-rules.md) — regras de negócio conhecidas e seu status de validação.
- [`product/association-intake.md`](product/association-intake.md) — baseline do processo de inscrição pública e decisões ainda necessárias.

### Arquitetura
- [`architecture/decision-log.md`](architecture/decision-log.md) — decisões arquiteturais, recomendações e pendências.
- [`architecture/adr/0001-stack-mvp.md`](architecture/adr/0001-stack-mvp.md) — ADR da stack e arquitetura do MVP.

### Segurança e privacidade
- [`security/security-privacy.md`](security/security-privacy.md) — baseline de segurança, LGPD, acesso e auditoria.

### Entrega
- [`delivery/backlog.md`](delivery/backlog.md) — backlog inicial por fases.
- [`delivery/risks-decisions.md`](delivery/risks-decisions.md) — riscos e decisões de produto/técnicas pendentes.
- [`delivery/definition-of-done.md`](delivery/definition-of-done.md) — definição de pronto e critérios objetivos de conclusão do MVP.

### Agentes de IA
- [`agents/project-instructions.md`](agents/project-instructions.md) — instrução permanente do projeto.
- [`agents/bootstrap-prompt.md`](agents/bootstrap-prompt.md) — prompt inicial para um novo chat de planejamento/orquestração.
- [`agents/executor-prompt.md`](agents/executor-prompt.md) — prompt-base para agentes executores como Claude ou Antigravity.

## Próximos documentos

Devem ser criados conforme o produto evoluir, e não antecipadamente:

- catálogo de categorias e situações cadastrais;
- matriz de perfis e permissões;
- modelo inicial de dados;
- contratos de API somente quando houver contratos externos ou handlers relevantes a documentar;
- estratégia de testes detalhada;
- guia de desenvolvimento local;
- arquitetura de implantação e observabilidade;
- plano de migração de cadastros, caso existam dados não financeiros a importar.

A criação desses documentos depende das decisões registradas em `delivery/risks-decisions.md`.
