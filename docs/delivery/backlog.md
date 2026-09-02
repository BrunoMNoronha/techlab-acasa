# Backlog inicial por fases

Este backlog organiza trabalho, mas **não transforma itens pendentes em requisitos aprovados**. Cada item que depender de regra da ACASA deve ser refinado antes de implementação.

## Fase 0 — Descoberta e decisões bloqueadoras

### P0-01 — Definir escopo organizacional
**Objetivo:** decidir ACASA única x SaaS/multi-associação.

**Aceite:** decisão registrada com impacto em dados, autorização e infraestrutura.

### P0-02 — Mapear processo real de associação
**Objetivo:** confirmar se existe ingresso pelo sistema e, se existir, levantar estados, campos, documentos e responsáveis.

**Aceite:** fluxo e regras documentados ou decisão explícita de manter fora do MVP.

### P0-03 — Definir financeiro do MVP
**Objetivo:** escolher entre controle administrativo, comprovantes e/ou gateway.

**Aceite:** modalidades, estados e responsabilidade pela confirmação de pagamento documentados.

### P0-04 — Levantar categorias e situações reais
**Objetivo:** obter valores e regras usadas pela ACASA.

**Aceite:** catálogo validado e transições relevantes documentadas.

### P0-05 — Avaliar migração
**Objetivo:** identificar planilhas, sistemas e históricos existentes.

**Aceite:** fontes, volume, qualidade, campos e estratégia preliminar registrados; ou confirmação de que não haverá migração.

### P0-06 — Definir restrições técnicas e ambiente
**Objetivo:** confirmar ambiente local, experiência/equipe, licenças e restrições que afetam stack.

**Aceite:** restrições suficientes para comparação arquitetural.

## Fase 1 — Fundação técnica

Somente iniciar após decisões suficientes da Fase 0.

### P1-01 — ADR de stack e arquitetura do MVP
- comparar alternativas atuais;
- registrar decisão;
- definir estrutura inicial do projeto.

### P1-02 — Aplicação base e pipeline de qualidade
- projeto inicial;
- lint;
- typecheck quando aplicável;
- testes;
- build;
- CI.

### P1-03 — Banco e migrations
- modelo mínimo aprovado;
- estratégia de migrations;
- seeds somente se seguros e úteis.

### P1-04 — Autenticação e autorização base
- login/logout/recuperação conforme provedor;
- sessão;
- proteção server-side;
- testes de acesso.

### P1-05 — Observabilidade e gestão de segredos
- configuração por ambiente;
- erros/logs mínimos;
- ausência de segredos no repositório.

## Fase 2 — Administração de associados

### P2-01 — Categorias
CRUD compatível com regras aprovadas.

### P2-02 — Associados
Cadastro, edição, consulta e validações.

### P2-03 — Pesquisa e filtros
Paginação e filtros necessários à operação real.

### P2-04 — Situação cadastral
Estados/transições apenas conforme decisão aprovada.

### P2-05 — Perfis e permissões
Matriz mínima de administração com validação server-side.

### P2-06 — Auditoria administrativa
Registrar operações críticas definidas para o módulo.

### P2-07 — Dashboard administrativo inicial
Somente indicadores derivados das capacidades já implementadas e validadas.

## Fase 3 — Financeiro básico

O conteúdo exato depende de P0-03.

### P3-01 — Cobranças
Modelo, criação e consulta.

### P3-02 — Pagamentos
Registro/consulta conforme modalidade aprovada.

### P3-03 — Situação financeira
Pendências e adimplência sem alterar automaticamente situação cadastral sem regra explícita.

### P3-04 — Comprovantes
**Condicional:** implementar somente se aprovado.

### P3-05 — Gateway de pagamento
**Condicional:** implementar somente se aprovado e após decisão de provedor, segurança e webhooks.

## Fase 4 — Portal do associado

### P4-01 — Área autenticada
Acesso somente ao próprio contexto autorizado.

### P4-02 — Dados e situação
Consulta dos próprios dados, categoria e situação.

### P4-03 — Financeiro
Consulta de cobranças/pagamentos permitidos.

### P4-04 — Documentos
Listagem e acesso autorizado a arquivos.

### P4-05 — Comunicados
Consulta dos comunicados aplicáveis.

## Fase 5 — Fechamento do MVP

### P5-01 — Testes de jornadas críticas
Cobrir administração e portal do associado.

### P5-02 — Segurança e privacidade
Revisar autorização, uploads, dados pessoais, segredos, logs e auditoria.

### P5-03 — Acessibilidade e responsividade
Validar fluxos principais com referência WCAG 2.2 AA.

### P5-04 — Migração inicial
**Condicional:** executar estratégia validada, com reconciliação e possibilidade segura de recuperação.

### P5-05 — Operação
Validar backup/restauração compatíveis, monitoramento, deploy e documentação operacional.

### P5-06 — Aceite do MVP
Avaliar todos os critérios de `definition-of-done.md`.

## Evolução pós-MVP

Somente após priorização explícita: carteirinha digital, eventos, votações, cursos, cupons, WhatsApp, Wallet, apps nativos, API pública, multi-idioma, financeiro avançado e eventual SaaS/multi-tenancy.