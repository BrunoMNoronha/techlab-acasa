# Riscos e decisões pendentes

## Decisões resolvidas em 2026-09-02

| ID | Decisão | Resultado |
|---|---|---|
| DP-001 | Escopo organizacional | sistema exclusivamente da ACASA no MVP; sem multi-tenancy/SaaS |
| DP-002 | Inscrição pública | faz parte do MVP; detalhes do workflow ainda precisam ser refinados |
| DP-003 | Escopo financeiro | controle administrativo + comprovantes manuais; gateway fora do MVP |
| DP-004 | Categorias reais | Estatuto 2025, Art. 12: Fundadores, Beneméritos e Contribuintes |
| DP-007 | Desenvolvimento tradicional x OutSystems | desenvolvimento tradicional; OutSystems descartado nesta implementação |
| DA-STACK | Stack/arquitetura inicial | definida no ADR-0001: monólito modular Next.js/TypeScript + Supabase + Vercel |

## Decisões prioritárias ainda abertas

| ID | Decisão | Por que importa | Bloqueia |
|---|---|---|---|
| DP-005 | Confirmar a normalização operacional da situação cadastral e fluxo de recurso/readmissão | o Estatuto define eventos do vínculo, mas não enumera estados de sistema | situação cadastral |
| DP-006A | Existem cadastros de associados a migrar? | histórico de pagamentos não será migrado, mas outros dados ainda não foram inventariados | plano de migração de cadastro |
| DP-008 | Quais campos/documentos são obrigatórios na inscrição pública e qual a finalidade de cada dado? | define formulário, LGPD, validações e storage | implementação do ingresso **e o cadastro administrativo da P2-02**; decomposta campo a campo em `../product/member-model-refinement.md` |
| DP-013 | Como representar pessoa jurídica na categoria Contribuinte, e existe hoje algum associado PJ? | o Art. 12 admite Contribuinte pessoa jurídica; a resposta determina se o modelo é uma entidade com tipo de pessoa, duas entidades ou apenas pessoa física | **estruturalmente bloqueia a P2-02**; alternativas comparadas em `../product/member-model-refinement.md`, §6 |
| DP-014 | A categoria estatutária é obrigatória desde a criação do vínculo? | todo associado atual pode não ter categoria conhecida, e a resposta define se a coluna pode ser `not null` | modelagem da P2-02; depende de DP-006A |
| DP-015 | Qual o recorte mínimo de autorização administrativa para o cadastro de associados, e quem o opera na ACASA? | sem modelo de permissão (P2-05), um CRUD de associados só poderia liberar acesso a toda conta autenticada ou a ninguém; `authenticated` não tem privilégio e `service_role` é proibida na aplicação | entrega utilizável da P2-02; alternativas em `../product/member-model-refinement.md`, §2 |
| DP-009 | Quais são os estados da solicitação de associação e quais perfis operacionalizam a análise/aprovação? | o Estatuto atribui à Diretoria competência para admitir/demitir; falta detalhar o workflow de sistema | implementação do ingresso |
| DP-010 | Quais regras reais de cobrança, competência, vencimento e adimplência? | define modelo financeiro e indicadores | financeiro |
| DP-011 | Quais estados e motivos de análise de comprovante serão usados? | define workflow e auditoria | comprovantes |
| DP-012 | Qual sistema operacional predomina no desenvolvimento local? | ajusta scripts/instruções; não bloqueia stack | apenas documentação operacional |

## Evidências recebidas

### Estatuto ACASA 2025

O Estatuto confirma:

- três categorias de sócios no Art. 12: **Fundadores, Beneméritos e Contribuintes**;
- possibilidade de exclusão por vontade própria ou ex officio;
- hipóteses estatutárias para exclusão ex officio;
- recurso da decisão de exclusão à Assembleia Geral;
- possibilidade de readmissão;
- competência da Diretoria para admitir/demitir sócios;
- participação da Assembleia Geral pelos sócios em pleno gozo de seus direitos estatutários.

O Estatuto não enumera formalmente estados cadastrais como Ativo, Inativo ou Suspenso. A normalização recomendada está registrada em `../product/membership-model.md`.

### Regimento Interno ACASA 2025

O Regimento usa **inadimplente** no contexto financeiro/operacional das taxas relacionadas ao serviço de água. Essa evidência reforça que inadimplência deve permanecer separada da situação cadastral do associado.

### Ficha cadastral atual

A ficha atual contém registro, data de nascimento, nome completo, CPF, RG, filiação, naturalidade, endereço residencial, endereço na comunidade, profissão, formação, telefone, e-mail, contato de emergência, observações administrativas, assinaturas, data de preenchimento e foto 3x4.

Esses campos são referência do processo existente, não lista automática de campos obrigatórios do novo sistema. Finalidade e minimização devem ser avaliadas antes de implementação.

A avaliação campo a campo — com finalidade candidata, necessidade, risco LGPD e recomendação — está em [`../product/member-model-refinement.md`](../product/member-model-refinement.md), §4. Nenhuma recomendação daquele documento aprova coleta de dado pessoal: as perguntas que exigem resposta da ACASA estão consolidadas em sua §12.

### Controle atual de pagamentos

O histórico da planilha não será migrado. Ela deverá ser analisada apenas para entendimento do processo legado de registro de pagamentos.

Na revisão de 2026-09-02, o conteúdo tabular do arquivo anexado não ficou acessível no runtime utilizado, portanto nenhuma regra financeira foi inferida a partir dele.

## Decisões posteriores

- critérios operacionais de enquadramento nas categorias estatutárias;
- região/plano/conta de Supabase e Vercel para produção;
- serviço de e-mail transacional;
- matriz detalhada de permissões;
- política de retenção e descarte;
- backup de arquivos privados;
- RPO/RTO e testes de restauração;
- observabilidade de produção;
- metas numéricas de performance e disponibilidade.

## Registro de riscos

| ID | Risco | Prob. | Impacto | Tratamento inicial |
|---|---|---:|---:|---|
| R-001 | Expansão do MVP por copiar capacidades da referência Softaliza | Alta | Alto | exigir problema, usuário, valor e aceite para nova funcionalidade |
| R-002 | Divergir do Estatuto ao inventar categorias ou estados | Média | Alto | usar `membership-model.md`; não criar categorias extras nem suspensão/inatividade sem nova base normativa |
| R-003 | Escolha prematura de arquitetura/stack | Baixa após ADR-0001 | Alto | manter ADR e revisar somente diante de nova restrição relevante |
| R-004 | Multi-tenancy antecipado sem necessidade | Baixa | Alto | decisão explícita: ACASA única no MVP; proibir abstrações de tenant |
| R-005 | Financeiro crescer para contabilidade/conciliação completa | Média | Alto | escopo confirmado: administrativo + comprovantes; gateway/ERP fora do MVP |
| R-006 | Coleta excessiva de dados pessoais no formulário de ingresso | Alta | Alto | finalidade e minimização antes de transformar campos legados em obrigatórios |
| R-007 | Autorização apenas no frontend | Média | Crítico | controles server-side, RLS quando aplicável e testes negativos de acesso |
| R-008 | Exposição de documentos/comprovantes privados | Média | Crítico | storage privado, autorização e URLs assinadas curtas quando necessárias |
| R-009 | Falta de trilha de auditoria em ações críticas | Média | Alto | definir eventos auditáveis por módulo, incluindo exclusão/readmissão |
| R-010 | Migração de cadastro descoberta tarde ou com dados de baixa qualidade | Média | Alto | inventariar apenas dados não financeiros que realmente precisem ser migrados |
| R-011 | Dependência forte de fornecedor sem análise | Média | Médio/Alto | manter núcleo em PostgreSQL, isolar integrações e revisar custos antes de produção |
| R-012 | Build/testes/documentação divergirem do produto | Média | Alto | Definition of Done, CI e revisão de diff |
| R-013 | Backups existirem sem teste de restauração | Baixa/Média | Alto | validar restauração antes de operação crítica |
| R-014 | Acessibilidade ser tratada apenas no fim | Média | Médio | padrões acessíveis desde componentes e testes de jornadas |
| R-015 | Formulário público ser alvo de spam, upload malicioso ou abuso | Média | Alto | validação server-side, limites de upload, rate limiting/anti-abuso proporcional e logs |
| R-016 | Fluxo de ingresso criar duplicidade de pessoa/associado | Média | Alto | definir identidade, deduplicação e conversão de solicitação para associado antes da implementação |
| R-017 | Tratar inadimplência de taxa de serviço como estado cadastral do associado | Média | Alto | separar domínios cadastral, financeiro associativo e taxas/serviços no modelo |

## Regra de escalonamento

Uma decisão deve ser solicitada ao responsável pelo produto quando não puder ser deduzida com segurança e afetar regra de negócio, contrato/custo relevante, tratamento jurídico sensível, mudança irreversível de dados ou direção estratégica.

Questões técnicas reversíveis e de baixo risco podem ser decididas pela equipe, desde que documentadas e justificadas.
