# Regras de negócio

As regras abaixo foram identificadas no planejamento, nas decisões da Fase 0 e nos documentos normativos da ACASA. Quando houver conflito entre exemplos anteriores e o Estatuto/Regimento vigentes, prevalece a evidência normativa mais atual.

## RB-001 — Categoria do associado

**Status:** CONFIRMADA PELO ESTATUTO 2025.

O Art. 12 do Estatuto estabelece três categorias de sócios:

- **Fundadores**;
- **Beneméritos**;
- **Contribuintes**.

Os critérios normativos e consequências para o sistema estão detalhados em `membership-model.md`.

Não criar categorias adicionais sem base normativa ou decisão formal da ACASA. Como as categorias decorrem do Estatuto, alterações devem ser controladas e auditáveis, e não tratadas como cadastro livre de uso cotidiano.

## RB-002 — Situação cadastral x financeira

**Status:** BASELINE COM FONTE NORMATIVA PARCIALMENTE DEFINIDA.

Situação cadastral e situação financeira são conceitos independentes. Um associado pode permanecer com vínculo associativo vigente e possuir obrigação financeira pendente.

O Estatuto não enumera formalmente situações cadastrais como `ATIVO`, `INATIVO` ou `SUSPENSO`, mas define eventos do vínculo: admissão, exclusão por vontade própria, exclusão ex officio e readmissão. A normalização inicial recomendada para o sistema é:

- `ATIVO`;
- `DESLIGADO_VOLUNTARIAMENTE`;
- `EXCLUIDO_EX_OFFICIO`.

Readmissão deve ser tratada como transição auditada de volta a `ATIVO`, não como situação permanente.

Não usar `INADIMPLENTE` como situação cadastral. O Regimento utiliza inadimplência no contexto financeiro/operacional das taxas nele disciplinadas.

## RB-003 — Histórico e rastreabilidade

**Status:** BASELINE.

Alterações administrativas relevantes devem produzir evidência suficiente para identificar o que ocorreu, quando ocorreu e qual usuário executou a ação.

Eventos de desligamento, exclusão e readmissão devem preservar histórico e motivo.

## RB-004 — Autorização

**Status:** BASELINE.

Usuários somente podem executar ações autorizadas. Restrições de interface não substituem validação server-side.

O Estatuto atribui à Diretoria competência para admitir e demitir sócios. A matriz de permissões do sistema deve respeitar essa governança, mesmo que a operação diária seja delegada a perfis administrativos autorizados.

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

## RB-009 — Exclusão, desligamento e retenção

**Status:** PARCIALMENTE CONFIRMADA PELO ESTATUTO; política de retenção PENDENTE.

O Art. 12 prevê exclusão por vontade própria ou ex officio. Para exclusão ex officio, o Estatuto lista hipóteses relacionadas a descumprimento de deveres/regulamentos, indisciplina, ausências reiteradas sem justificativa e falta grave, além de prever recurso à Assembleia Geral.

O sistema deve registrar, conforme aplicável:

- natureza do encerramento do vínculo;
- motivo;
- data;
- responsável/órgão decisor;
- eventual recurso e resultado;
- readmissão posterior sem apagar o histórico anterior.

Registros financeiros, de auditoria ou outros necessários à rastreabilidade não devem ser apagados de forma incompatível com obrigações legais, operacionais ou de investigação.

## RB-010 — Inscrição pública

**Status:** APROVADA para o MVP.

Novos candidatos poderão solicitar associação pelo sistema. A solicitação de ingresso deve possuir ciclo próprio e não deve transformar automaticamente o candidato em associado sem análise administrativa.

O Estatuto confirma competência da Diretoria para admitir sócios, mas o fluxo operacional, os perfis que executarão a análise e os estados da solicitação ainda devem ser detalhados.

## RB-011 — Solicitação x associado

**Status:** BASELINE.

A situação de uma solicitação de ingresso é conceito distinto da situação cadastral e financeira do associado. Quando uma solicitação for aprovada, o sistema deve reaproveitar os dados válidos necessários sem criar duplicidade desnecessária.

Estados de solicitação como `EM_ANALISE`, `APROVADA` ou `REJEITADA`, quando definidos, não devem ser reutilizados como situação cadastral do associado.

## RB-012 — Histórico financeiro legado

**Status:** CONFIRMADA.

O histórico da planilha atual de pagamentos não será migrado. O arquivo legado pode ser utilizado como referência para entender o modelo operacional atual, sem se tornar fonte de dados do novo sistema.

## Regras que ainda não podem ser inventadas

Até validação da ACASA, não presumir:

- categorias além de Fundadores, Beneméritos e Contribuintes;
- critérios operacionais adicionais de enquadramento em categoria além do Estatuto;
- valores e periodicidade de contribuições;
- vencimentos;
- tolerância e definição de inadimplência associativa;
- situação `SUSPENSO` ou `INATIVO` sem nova regra normativa;
- campos e documentos obrigatórios na solicitação;
- estados e transições do processo de ingresso;
- delegação operacional de competência para admissão/exclusão;
- estados detalhados de análise de comprovantes;
- direito de acesso a documentos por categoria;
- regras eleitorais ou de votação além do que vier a ser especificado para funcionalidade futura.

Quando uma dessas regras bloquear uma implementação, a tarefa deve parar na fronteira segura e registrar a decisão necessária.
