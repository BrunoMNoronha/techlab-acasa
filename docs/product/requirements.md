# Requisitos iniciais

## Convenção de status

- **APROVADO** — requisito de produto explicitamente aceito ou confirmado por fonte normativa vigente.
- **BASELINE** — faz parte do escopo preliminar aceito para detalhamento, mas regras específicas ainda podem mudar.
- **PENDENTE** — depende de decisão da ACASA antes de implementação.
- **FORA DO MVP** — não deve ser implementado sem replanejamento.

## Requisitos funcionais

| ID | Requisito | Status |
|---|---|---|
| RF-001 | Permitir autenticação, logout, recuperação de acesso e controle de sessão. | BASELINE |
| RF-002 | Restringir funcionalidades conforme perfil/permissões do usuário. | BASELINE |
| RF-003 | Permitir cadastrar, editar, consultar, pesquisar e filtrar associados. | BASELINE |
| RF-004 | Permitir encerrar e reativar/readmitir vínculo sem perda indevida de histórico, conforme regras aprovadas. | BASELINE; transições normativas parcialmente confirmadas |
| RF-005 | Permitir associar categoria estatutária e acompanhar situação cadastral separadamente da financeira. | APROVADO para categorias; **PARCIALMENTE ENTREGUE** — catálogo referenciável (P2-01) e vínculo obrigatório e íntegro entre associado e categoria no banco (P2-02, incremento 1); ainda **não** existe operação administrativa para atribuir ou alterar a categoria, bloqueada por DP-015. Normalização de estados cadastrais documentada em `membership-model.md` |
| RF-006 | Disponibilizar as categorias estatutárias Fundadores, Beneméritos e Contribuintes, impedindo alteração cotidiana sem autorização/governança adequada. | APROVADO pelo Estatuto 2025; **ENTREGUE** pela P2-01 |
| RF-007 | Registrar histórico mínimo de operações administrativas relevantes. | BASELINE |
| RF-008 | Permitir cadastrar e consultar cobranças. | APROVADO; regras de geração/competência PENDENTES |
| RF-009 | Permitir registrar administrativamente pagamentos e consultar histórico financeiro produzido pelo novo sistema. | APROVADO |
| RF-010 | Permitir identificar pendências e situação financeira do associado sem confundi-la com situação cadastral. | BASELINE; definição de adimplência PENDENTE |
| RF-011 | Oferecer área restrita ao associado para consultar os próprios dados, categoria e situações autorizadas. | BASELINE |
| RF-012 | Permitir publicar e consultar documentos conforme regras de acesso. | BASELINE |
| RF-013 | Permitir publicar comunicados internos e disponibilizá-los aos destinatários autorizados. | BASELINE |
| RF-014 | Disponibilizar dashboard administrativo somente com indicadores derivados de dados e requisitos aprovados. | BASELINE |
| RF-015 | Permitir envio e análise administrativa de comprovantes manuais, com resultado e responsável rastreáveis. | APROVADO |
| RF-016 | Permitir inscrição pública de candidatos a associado e fluxo de análise administrativa. | APROVADO; estados/campos/documentos/delegação operacional PENDENTES |
| RF-017 | Integrar gateway para Pix, boleto ou cartão. | FORA DO MVP |
| RF-018 | Oferecer apps móveis nativos. | FORA DO MVP |
| RF-019 | Oferecer votação eletrônica, cursos/LMS, Wallet, API pública e financeiro avançado. | FORA DO MVP |
| RF-020 | Converter uma solicitação aprovada em vínculo de associado sem duplicar dados desnecessariamente, conforme regras de ingresso validadas. | BASELINE |
| RF-021 | Manter situação da solicitação de ingresso separada da situação cadastral e financeira do associado. | BASELINE |
| RF-022 | Registrar desligamento voluntário, exclusão ex officio, eventual recurso e readmissão preservando histórico suficiente para auditoria. | BASELINE derivada do Estatuto |

## Requisitos não funcionais

| ID | Requisito | Status |
|---|---|---|
| RNF-001 | A aplicação deve ser responsiva em desktop, tablet e mobile. | BASELINE |
| RNF-002 | Autorização deve ser validada no servidor e seguir menor privilégio. | BASELINE |
| RNF-003 | Entradas devem ser validadas e operações críticas protegidas contra acesso indevido. | BASELINE |
| RNF-004 | Arquivos privados não podem depender de URLs públicas previsíveis para controle de acesso. | BASELINE |
| RNF-005 | Segredos devem permanecer fora do código-fonte e ser geridos pelo ambiente/plataforma. | BASELINE |
| RNF-006 | Dados pessoais devem observar minimização, finalidade, controle de acesso e retenção compatíveis com LGPD. | BASELINE |
| RNF-007 | Operações administrativas críticas devem possuir trilha de auditoria adequada. | BASELINE |
| RNF-008 | Listagens com volume relevante devem suportar paginação e consultas/indexação adequadas. | BASELINE |
| RNF-009 | Operações demoradas devem informar loading, sucesso e erro de forma clara. | BASELINE |
| RNF-010 | Acessibilidade deve usar WCAG 2.2 AA como referência de projeto. | RECOMENDAÇÃO adotada como baseline de qualidade |
| RNF-011 | Ambientes publicados devem utilizar HTTPS. | BASELINE |
| RNF-012 | A solução deve permitir backups, recuperação e observabilidade compatíveis com o ambiente definido. | BASELINE; metas PENDENTES |
| RNF-013 | Formulários públicos devem limitar abuso automatizado e validar uploads/entradas antes de persistência definitiva. | BASELINE |

## Dados e entidades inicialmente identificadas

Associado, Categoria, Usuário, Perfil, Permissão, Solicitação de Associação, Cobrança, Pagamento, Comprovante, Documento, Comunicado e Auditoria.

### Categorias confirmadas

Fonte: Estatuto ACASA 2025, Art. 12.

- Fundadores;
- Beneméritos;
- Contribuintes.

Ver `membership-model.md` para critérios normativos, modelagem da situação cadastral e a governança do catálogo.

#### Rastreabilidade de entrega das categorias

`Estatuto 2025, Art. 12 → RF-006 → P2-01 → migration versionada → testes pgTAP → membership-model.md`.

| Parcela do requisito | Entrega | Situação |
|---|---|---|
| Catálogo com as três categorias estatutárias, imutável em runtime e com governança de alteração normativa | P2-01 | entregue |
| Integridade estrutural do vínculo entre associado e categoria estatutária | P2-02, incremento 1: `public.members` referencia `membership_categories(code)` por chave estrangeira obrigatória, com `on update cascade`, `on delete restrict` e testes pgTAP de rejeição | entregue |
| Operação administrativa para atribuir e alterar a categoria de um associado | P2-02, incremento seguinte; depende de DP-015 | pendente |
| Acompanhamento da situação cadastral, separada da financeira | P2-04, após a decisão DP-005 | pendente |

RF-005 **não** deve ser considerado totalmente entregue enquanto não existir operação administrativa de enquadramento e o acompanhamento da situação cadastral. O que o incremento 1 da P2-02 entrega é a **integridade estrutural** do vínculo no banco — um associado não pode existir sem categoria válida —, e não uma funcionalidade de interface. A separação acima é uma divisão técnica de entrega e não altera o requisito de negócio.

### Evidência do cadastro atual

A ficha cadastral atual da ACASA contém campos para registro, data de nascimento, nome completo, CPF, RG, filiação, naturalidade, endereço residencial, endereço na comunidade, profissão, formação, telefone, e-mail, contato de emergência, observações administrativas, assinaturas, data de preenchimento e foto 3x4.

Esses campos são **evidência do processo atual**, não uma aprovação automática para coleta no novo sistema. Antes de tornar qualquer dado obrigatório, especialmente documentos de identificação, filiação, foto e contato de emergência, deve ser registrada sua finalidade e necessidade.

A análise campo a campo — finalidade candidata, necessidade, obrigatoriedade, risco LGPD e recomendação — está em [`member-model-refinement.md`](member-model-refinement.md). Esse documento é **refinamento**: suas recomendações não constituem requisito aprovado, e as decisões que exigem manifestação da ACASA estão listadas ali e refletidas em `../delivery/risks-decisions.md`.

## Migração

- histórico do controle atual de pagamentos: **não migrar**;
- planilha atual de pagamentos: usar somente como referência para compreender o processo legado;
- migração de outros cadastros/dados: **PENDENTE de inventário**.

## Dependências de detalhamento ainda abertas

Antes de implementar os requisitos afetados, devem ser resolvidas as decisões sobre:

1. critérios operacionais de enquadramento nas categorias estatutárias, especialmente Benemérito e Contribuinte;
2. confirmação da normalização operacional dos estados `ATIVO`, `DESLIGADO_VOLUNTARIAMENTE` e `EXCLUIDO_EX_OFFICIO`, além do fluxo de recurso/readmissão;
3. campos/documentos obrigatórios no ingresso e finalidade de cada dado (decomposto em decisões objetivas em `member-model-refinement.md`);
4. representação de pessoa jurídica na categoria Contribuinte, que condiciona estruturalmente o modelo de associado;
5. estados do processo de solicitação e perfis operacionais responsáveis pela análise/aprovação;
6. regras de cobrança, competência, vencimento e definição de adimplência;
7. necessidade de migração de cadastros não financeiros;
8. sistema operacional predominante do ambiente local, apenas para ajustar instruções operacionais caso necessário.
