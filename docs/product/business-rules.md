# Regras de negócio

As regras abaixo foram identificadas no planejamento inicial. Elas devem ser tratadas como **baseline preliminar** e refinadas com evidência da operação real da ACASA antes da implementação que dependa de seus detalhes.

## RB-001 — Categoria do associado

**Status:** PENDENTE DE VALIDAÇÃO.

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

**Status:** BASELINE CONCEITUAL; fluxo PENDENTE.

Uma cobrança só deve ser considerada paga quando existir uma confirmação válida conforme a modalidade aprovada para o MVP.

## RB-006 — Comprovante manual

**Status:** PENDENTE — depende da inclusão de comprovantes no MVP.

Se comprovante manual for adotado, o envio do arquivo não equivale à confirmação do pagamento. Deve existir análise administrativa com resultado rastreável.

## RB-007 — Documentos privados

**Status:** BASELINE.

Documentos privados somente podem ser acessados por usuários autorizados. O acesso ao arquivo deve respeitar a autorização, não apenas a visibilidade da tela que contém o link.

## RB-008 — Minimização de dados

**Status:** BASELINE.

Usuários e perfis administrativos devem visualizar apenas os dados necessários ao exercício de suas funções. A aplicação deve evitar coleta de dados pessoais sem finalidade definida.

## RB-009 — Exclusão e retenção

**Status:** BASELINE CONCEITUAL; política PENDENTE.

Registros financeiros, de auditoria ou outros necessários à rastreabilidade não devem ser apagados de forma incompatível com obrigações legais, operacionais ou de investigação. Cancelamento, inativação, anonimização e retenção devem ser definidos por tipo de dado.

## Regras que não podem ser inventadas

Até validação da ACASA, não presumir:

- nomes de categorias;
- valores e periodicidade de contribuições;
- vencimentos;
- tolerância e definição de inadimplência;
- estados cadastrais;
- regras de suspensão, reativação ou desligamento;
- documentos obrigatórios;
- possibilidade de inscrição pública;
- responsáveis por aprovações;
- formas de pagamento aceitas;
- direito de acesso a documentos por categoria;
- regras eleitorais ou de votação.

Quando uma dessas regras bloquear uma implementação, a tarefa deve parar na fronteira segura e registrar a decisão necessária.