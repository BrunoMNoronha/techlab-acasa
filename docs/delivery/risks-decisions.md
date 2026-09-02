# Riscos e decisões pendentes

## Decisões prioritárias

| ID | Decisão | Por que importa | Bloqueia |
|---|---|---|---|
| DP-001 | ACASA única ou SaaS/multi-associação? | define isolamento, modelo de dados, autorização e complexidade | arquitetura de dados e tenancy |
| DP-002 | Haverá inscrição pública de novos associados? | define perfil candidato, documentos, workflow e segurança | fluxo de ingresso |
| DP-003 | Qual o escopo financeiro do MVP? | diferencia controle interno, comprovante e gateway | modelo financeiro e integrações |
| DP-004 | Quais categorias reais existem? | evita hardcode e regras fictícias | categorias e associado |
| DP-005 | Quais situações cadastrais reais existem? | define estados e transições válidas | situação cadastral |
| DP-006 | Existe migração de dados? | afeta modelo, validação, cronograma e risco operacional | plano de migração |
| DP-007 | Qual o ambiente local e quais restrições técnicas/organizacionais existem? | necessário para escolher stack com segurança | ADR de stack |

## Decisões posteriores

- autenticação e eventual MFA;
- stack web definitiva;
- banco/provedor;
- object storage;
- hospedagem;
- e-mail transacional;
- gateway de pagamento se aprovado;
- matriz de permissões;
- campos pessoais obrigatórios e sua finalidade;
- retenção e descarte;
- RPO/RTO e operação de backup;
- metas numéricas de performance e disponibilidade.

## Registro de riscos

| ID | Risco | Prob. | Impacto | Tratamento inicial |
|---|---|---:|---:|---|
| R-001 | Expansão do MVP por copiar capacidades da referência Softaliza | Alta | Alto | exigir problema, usuário, valor e aceite para nova funcionalidade |
| R-002 | Implementar regras fictícias de categoria/situação | Alta | Alto | bloquear implementação até validação dos valores reais |
| R-003 | Escolha prematura de arquitetura/stack | Média | Alto | decidir somente após requisitos e restrições mínimas |
| R-004 | Multi-tenancy antecipado sem necessidade | Média | Alto | manter single-context até decisão de produto |
| R-005 | Financeiro crescer para contabilidade/conciliação completa | Alta | Alto | separar controle associativo de ERP financeiro |
| R-006 | Coleta excessiva de dados pessoais | Média | Alto | finalidade e minimização antes de adicionar campos |
| R-007 | Autorização apenas no frontend | Média | Crítico | controles server-side e testes negativos de acesso |
| R-008 | Exposição de documentos/comprovantes privados | Média | Crítico | storage privado e autorização de download |
| R-009 | Falta de trilha de auditoria em ações críticas | Média | Alto | definir eventos auditáveis por módulo |
| R-010 | Migração descoberta tarde ou com dados de baixa qualidade | Média | Alto | inventário e amostra de dados na Fase 0 |
| R-011 | Dependência forte de fornecedor sem análise | Média | Médio/Alto | comparar custo, lock-in, portabilidade e operação |
| R-012 | Build/testes/documentação divergirem do produto | Média | Alto | Definition of Done, CI e revisão de diff |
| R-013 | Backups existirem sem teste de restauração | Baixa/Média | Alto | validar restauração antes de operação crítica |
| R-014 | Acessibilidade ser tratada apenas no fim | Média | Médio | padrões acessíveis desde componentes e testes de jornadas |

## Regra de escalonamento

Uma decisão deve ser solicitada ao responsável pelo produto quando não puder ser deduzida com segurança e afetar regra de negócio, contrato/custo relevante, tratamento jurídico sensível, mudança irreversível de dados ou direção estratégica.

Questões técnicas reversíveis e de baixo risco podem ser decididas pela equipe, desde que documentadas e justificadas.