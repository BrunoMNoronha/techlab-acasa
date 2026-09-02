# Regras de negócio

As regras abaixo foram identificadas no planejamento e nas decisões da Fase 0. Detalhes que dependem da operação real da ACASA permanecem explicitamente pendentes.

## RB-001 — Categoria do associado

**Status:** PENDENTE DE VALIDAÇÃO DOS VALORES REAIS.

Se a ACASA utilizar categorias como parte do vínculo associativo, todo associado ativo deverá possuir uma categoria válida.

**Ainda não definido:** categorias existentes, transições, benefícios, valores, elegibilidade e documentos por categoria.

## RB-002 — Situação cadastral x financeira

**Status:** BASELINE.

Situação cadastral e situação financeira são conceitos independentes. Um associado pode permanecer cadastralmente ativo e possuir cobrança pendente.

**Ainda não definido:** estados cadastrais e estados financeiros reais.

## RB-003 — Histórico e rastreabilidade

**Status:** BASELINE.

Alterações administrativas relevantes devem produzir evidência suficiente para identificar o que ocorreu, quando ocorreu e qual usuário executou a ação.

## RB-004 — Autorização

**Status:** BASELINE.

Usuários somente podem executar ações autorizadas. Restrições de interface não substituem validação server-side.

## RB-005 — Confirmação de pagamento

**Status:** APROVADA para controle administrativo; detalhes PENDENTES.

Uma cobrança só deve ser considerada paga quando existir confirmação administrativa válida conforme as regras financeiras aprovadas. O registro deve permitir identificar, no mínimo, a cobrança, a confirmação e o responsável quando aplicável.

**Ainda não definido:** competência, vencimento, periodicidade, tolerância, regras de adimplência e campos exatos do registro.

## RB-006 — Comprovante manual

**Status:** APROVADA.

O envio de comprovante manual não equivale à confirmação do pagamento. O comprovante deve passar por análise administrativa e o resultado deve ser rastreável.

Estados exatos da análise e motivos padronizados de rejeição/correção ainda devem ser definidos.

## RB-007 — Documentos privados

**Status:** BASELINE.

Documentos privados somente podem ser acessados por usuários autorizados. O acesso ao arquivo deve respeitar a autorização, não apenas a visibilidade da tela que contém o link.

## RB-008 — Minimização de dados

**Status:** BASELINE.

Usuários e perfis administrativos devem visualizar apenas os dados necessários ao exercício de suas funções. A aplicação deve evitar coleta de dados pessoais sem finalidade definida.

A ficha cadastral atual serve como evidência do processo existente, mas não torna automaticamente obrigatórios no novo sistema dados como CPF, RG, filiação, foto, contato de emergência, profissão ou formação.

## RB-009 — Exclusão e retenção

**Status:** BASELINE CONCEITUAL; política PENDENTE.

Registros financeiros, de auditoria ou outros necessários à rastreabilidade não devem ser apagados de forma incompatível com obrigações legais, operacionais ou de investigação. Cancelamento, inativação, anonimização e retenção devem ser definidos por tipo de dado.

## RB-010 — Inscrição pública

**Status:** APROVADA para o MVP.

Novos candidatos poderão solicitar associação pelo sistema. A solicitação de ingresso deve possuir ciclo próprio e não deve transformar automaticamente o candidato em associado sem análise administrativa.

**Ainda não definido:** campos obrigatórios, documentos, estados da solicitação, responsáveis pela análise, critérios de aprovação/rejeição e momento exato de criação/ativação do vínculo.

## RB-011 — Solicitação x associado

**Status:** BASELINE.

A situação de uma solicitação de ingresso é conceito distinto da situação cadastral e financeira do associado. Quando uma solicitação for aprovada, o sistema deve reaproveitar os dados válidos necessários sem criar duplicidade desnecessária.

## RB-012 — Histórico financeiro legado

**Status:** CONFIRMADA.

O histórico da planilha atual de pagamentos não será migrado. O arquivo legado pode ser utilizado como referência para entender o modelo operacional atual, sem se tornar fonte de dados do novo sistema.

## Regras que ainda não podem ser inventadas

Até validação da ACASA, não presumir:

- nomes de categorias;
- valores e periodicidade de contribuições;
- vencimentos;
- tolerância e definição de inadimplência;
- estados cadastrais;
- regras de suspensão, reativação ou desligamento;
- campos e documentos obrigatórios na solicitação;
- estados e transições do processo de ingresso;
- responsáveis por aprovações;
- estados detalhados de análise de comprovantes;
- direito de acesso a documentos por categoria;
- regras eleitorais ou de votação.

Quando uma dessas regras bloquear uma implementação, a tarefa deve parar na fronteira segura e registrar a decisão necessária.
