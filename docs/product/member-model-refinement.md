# Refinamento do modelo mínimo de Associado (P2-02)

- **Status do documento:** REFINAMENTO — não constitui aprovação de requisito.
- **Issue:** #16
- **Escopo:** decompor as decisões que bloqueiam a P2-02, especialmente **DP-008** (campos/documentos e finalidade dos dados pessoais) e a parcela de **DP-005** necessária para separar P2-02 de P2-04.
- **Fora de escopo:** entidade `Associado`, migrations, CRUD, telas, APIs, situação cadastral, perfis, auditoria de runtime e solicitação pública.

## Convenção de classificação usada neste documento

| Marca | Significado |
|---|---|
| **FATO CONFIRMADO** | verificado no repositório, no Estatuto/Regimento ou no GitHub nesta revisão |
| **REQUISITO APROVADO** | requisito de produto já aceito e registrado como APROVADO em `requirements.md` |
| **RECOMENDAÇÃO** | proposta técnica desta análise; **não** é requisito e não autoriza implementação de regra de negócio |
| **HIPÓTESE** | leitura plausível ainda não confirmada por evidência |
| **DECISÃO PENDENTE** | exige manifestação do responsável pelo produto (ACASA) antes da implementação |

Nenhuma **RECOMENDAÇÃO** deste documento deve ser lida como regra aprovada. Recomendações puramente técnicas e reversíveis (nomes de coluna, tipos, índices) podem ser decididas pela equipe conforme a regra de escalonamento de [`../delivery/risks-decisions.md`](../delivery/risks-decisions.md); tudo que determina **coleta de dado pessoal** exige decisão da ACASA.

## 1. Estado revalidado

**FATO CONFIRMADO** (revisão de 2026-09-03, `main` em `da6befa`):

- única migration versionada: `supabase/migrations/20260902194500_create_membership_categories.sql`;
- `public.membership_categories` contém exatamente `FUNDADOR`, `BENEMERITO` e `CONTRIBUINTE`, com `code` como chave primária e `name` único;
- RLS habilitado sem policy e privilégios revogados de `anon`/`authenticated`; nenhum CRUD em runtime;
- 12/12 testes pgTAP aprovados em `supabase/tests/database/membership_categories_test.sql`;
- não existe entidade `Associado`, tabela de perfil, nem qualquer vínculo entre `auth.users` e dados de negócio;
- a autenticação (P1-04) expõe apenas `AuthenticatedIdentity = { userId }`, derivado de `getClaims()` em `src/lib/auth/identity.ts`;
- `enable_signup = false` na configuração local do Supabase.

## 2. Fronteira entre fases

| Pertence a | O quê | Justificativa |
|---|---|---|
| **P2-02** | entidade `Associado`, dados cadastrais aprovados, vínculo com `membership_categories`, unicidade/deduplicação básica | RF-003 e a parcela de categoria de RF-005 |
| **P2-03** | pesquisa, filtros e paginação | RNF-008 |
| **P2-04** | estados do vínculo, transições, motivos, histórico de desligamento/exclusão/recurso/readmissão | RF-004, RF-022, DP-005 |
| **P2-05** | perfis e permissões administrativas, incluindo quem vê quais campos | RF-002, RNF-002 |
| **P2-06** | auditoria de operações administrativas em runtime | RF-007, RNF-007 |
| **P2-08/P2-09** | solicitação pública, análise, estados da solicitação e conversão em associado | RF-016, RF-020, RF-021 |

**RECOMENDAÇÃO:** a P2-02 deve entregar o **cadastro consolidado** de quem já é associado. Ela não deve introduzir workflow, estados nem entidade de solicitação.

### Dependência de autorização entre P2-02 e P2-05

Há uma dependência real de sequenciamento que precisa ser decidida antes de a P2-02 começar. Hoje, a identidade autenticada expõe apenas `{ userId }` (P1-04), não existe modelo de permissão (P2-05), `authenticated` não possui privilégio algum sobre tabelas de negócio e a aplicação não pode usar `service_role`. Nesse estado, uma P2-02 que entregue cadastro, edição e consulta só teria dois desfechos possíveis, ambos inaceitáveis: conceder acesso administrativo a **toda** conta autenticada, ou não permitir acesso a **ninguém**.

Alternativas:

| Alternativa | Consequência |
|---|---|
| **A. P2-02 apenas de schema/domínio** | entrega a entidade, o vínculo com a categoria, as constraints e os testes de integridade, sem interface administrativa; nenhuma decisão de autorização é antecipada, mas o valor visível para a ACASA é adiado |
| **B. Antecipar o mínimo de P2-05 para dentro da P2-02** | inclui na P2-02 apenas o suficiente para distinguir "administrador" de "demais usuários", com validação server-side; entrega CRUD utilizável, ao custo de decidir um recorte de permissão antes da matriz completa |
| **C. Mover a P2-05 inteira para antes da P2-02** | mais seguro em termos de autorização, mas a matriz de permissões depende de decisões de produto ainda abertas e da existência das operações a permissionar |

**RECOMENDAÇÃO:** alternativa **B**, com o menor recorte possível — um único papel administrativo validado no servidor, sem matriz de capacidades — porque a alternativa C exige decidir permissões sobre operações que ainda não existem e a alternativa A adia indefinidamente o valor.

**DECISÃO PENDENTE.** O recorte concreto de autorização depende de quem, na ACASA, opera o cadastro, e isso pertence à P2-05. Em nenhuma hipótese a P2-02 deve conceder privilégio amplo a `authenticated` nem introduzir `service_role` na aplicação para contornar a ausência do modelo de permissões.

## 3. Modelo conceitual mínimo de Associado

Proposta conceitual. **Nenhum schema é criado nesta tarefa.**

### 3.A — Dados técnicos inevitáveis

| Elemento | Necessidade | Classificação |
|---|---|---|
| identificador interno opaco e imutável (`uuid`) | chave estável para relacionamentos futuros (cobranças, comprovantes, documentos, solicitação convertida) sem expor dado pessoal em URL ou log; atende RNF-006 | **RECOMENDAÇÃO** técnica |
| `created_at` / `updated_at` | rastreabilidade mínima do registro; base para investigação enquanto a auditoria de runtime não existe (P2-06) | **RECOMENDAÇÃO** técnica |
| referência à categoria estatutária (`membership_category_code`) | RF-005; desmembrado da P2-01 para a P2-02 | **REQUISITO APROVADO** quanto a existir; a obrigatoriedade é **DECISÃO PENDENTE** (§5) |
| identificador do usuário autenticado (`auth_user_id`) | viabilizaria o portal do associado (RF-011) | **DECISÃO PENDENTE** (§9) — não incluir por conveniência |
| número de registro/matrícula visível | a ficha legada possui "número de registro" | **DECISÃO PENDENTE** (§11, D15) — só se a ACASA usar esse número operacionalmente |

**RECOMENDAÇÃO:** o identificador interno **não** deve ser CPF, e-mail, nome ou número de registro legado.

### 3.B — Dados de negócio candidatos

A análise campo a campo está em §4. O único campo cuja necessidade é dedutível com segurança é **nome/razão social**: sem ele não existe cadastro de associado utilizável, e RF-003 é escopo BASELINE aceito. Todos os demais dependem de DP-008.

## 4. Matriz de campos e finalidades (DP-008 decomposta)

Onde a finalidade não pode ser deduzida com segurança a partir do Estatuto, do Regimento ou das decisões já registradas, a célula é marcada como **DECISÃO DA ACASA NECESSÁRIA**.

| Campo | Evidência atual | Finalidade candidata | Necessário no cadastro administrativo? | Necessário no ingresso público? | Obrigatório? | Risco/LGPD | Recomendação |
|---|---|---|---|---|---|---|---|
| Nome completo / razão social | ficha legada | identificar o associado em qualquer operação administrativa | **Sim** — dedutível de RF-003 | provavelmente sim | sim | baixo; PII básica inevitável | **RECOMENDAÇÃO:** único campo pessoal obrigatório na P2-02 |
| Número de registro | ficha legada | continuidade com o controle atual em papel | DECISÃO DA ACASA NECESSÁRIA | não | — | baixo | adotar só se houver uso operacional real; nunca como chave técnica |
| CPF | ficha legada | identificar pessoa unicamente e evitar duplicidade (R-016) | DECISÃO DA ACASA NECESSÁRIA | DECISÃO DA ACASA NECESSÁRIA | DECISÃO DA ACASA NECESSÁRIA | **alto** — identificador nacional, alvo preferencial de vazamento; exige acesso por função | se aprovado: opcional, único quando presente, nunca em log ou URL, visível apenas a perfil autorizado (P2-05) |
| RG | ficha legada | conferência documental presencial | DECISÃO DA ACASA NECESSÁRIA | não recomendado | — | **alto** e redundante com CPF | **RECOMENDAÇÃO:** não coletar na P2-02; nenhuma finalidade de sistema foi demonstrada |
| Data de nascimento | ficha legada | verificar maioridade/capacidade civil, se houver regra | DECISÃO DA ACASA NECESSÁRIA | DECISÃO DA ACASA NECESSÁRIA | — | médio; permite inferências e reidentificação | coletar apenas se existir regra estatutária ou operacional que dependa de idade |
| Filiação (nome dos pais) | ficha legada | desambiguação de homônimos em conferência documental | DECISÃO DA ACASA NECESSÁRIA | não recomendado | — | **alto** — PII de terceiros que não são titulares no sistema | **RECOMENDAÇÃO:** não coletar; a deduplicação deve usar os critérios de §7, não filiação |
| Naturalidade | ficha legada | nenhuma finalidade de sistema identificada | DECISÃO DA ACASA NECESSÁRIA | não | — | médio | **RECOMENDAÇÃO:** não coletar |
| Endereço residencial (fora da comunidade) | ficha legada | contato postal e distinção entre residente e não residente | DECISÃO DA ACASA NECESSÁRIA | DECISÃO DA ACASA NECESSÁRIA | — | médio; localiza a pessoa | coletar apenas se houver comunicação postal ou regra que dependa de residência |
| Endereço na Comunidade Aldeia | ficha legada | vincular o associado ao imóvel/ponto atendido; o Regimento trata taxas do serviço de água | DECISÃO DA ACASA NECESSÁRIA | DECISÃO DA ACASA NECESSÁRIA | — | médio | **HIPÓTESE:** é o endereço com maior chance de finalidade real (serviço de água). Se confirmado, provavelmente pertence ao domínio de **serviço/taxas** (Fase 3), não ao cadastro básico |
| Profissão | ficha legada | nenhuma finalidade de sistema identificada | DECISÃO DA ACASA NECESSÁRIA | não | — | médio | **RECOMENDAÇÃO:** não coletar |
| Formação | ficha legada | nenhuma finalidade de sistema identificada | DECISÃO DA ACASA NECESSÁRIA | não | — | médio | **RECOMENDAÇÃO:** não coletar |
| Telefone | ficha legada | contato administrativo com o associado | DECISÃO DA ACASA NECESSÁRIA (finalidade plausível) | provavelmente sim | DECISÃO DA ACASA NECESSÁRIA | médio | **RECOMENDAÇÃO:** coletar como opcional; exigir ao menos um canal de contato é decisão da ACASA |
| E-mail | ficha legada; necessidade do portal (RF-011) | contato e, se aprovado, credencial de acesso ao portal | DECISÃO DA ACASA NECESSÁRIA | provavelmente sim | DECISÃO DA ACASA NECESSÁRIA | médio; é também identificador de conta | **RECOMENDAÇÃO:** opcional na P2-02; obrigatório apenas para quem tiver acesso ao portal (§9) |
| Contato de emergência (nome e telefone) | ficha legada | acionar terceiro em emergência | DECISÃO DA ACASA NECESSÁRIA | não recomendado | — | **alto** — PII de terceiro que não interage com o sistema | **RECOMENDAÇÃO:** não coletar na P2-02; se houver finalidade real (atividade presencial de risco), tratar em escopo próprio com base legal registrada |
| Observações da administração | ficha legada | anotações operacionais livres | DECISÃO DA ACASA NECESSÁRIA | não | — | **alto** — campo livre acumula PII não minimizada e pode receber dado sensível (saúde, convicção, origem) sem controle | **RECOMENDAÇÃO:** não criar campo livre na P2-02. Se indispensável: restrito por perfil (P2-05), auditado (P2-06) e com orientação explícita contra dado sensível |
| Foto 3x4 | ficha legada | identificação visual / carteirinha | DECISÃO DA ACASA NECESSÁRIA | **não** | — | **alto** — imagem de pessoa identificada; exige Storage privado (RNF-004), retenção e base legal | **RECOMENDAÇÃO:** adiar. Carteirinha digital está fora do MVP; sem ela, nenhuma finalidade foi demonstrada |
| Assinaturas (associado e presidente) | ficha legada | formalizar a adesão em papel | não | não | — | **alto** — assinatura digitalizada é dado biométrico comportamental | **RECOMENDAÇÃO:** não digitalizar. É artefato do processo físico; a evidência equivalente no sistema é o registro auditável da admissão (P2-06) |
| Data de preenchimento | ficha legada | data da adesão | equivale a `created_at` do registro **ou** à data de admissão pela Diretoria | não | — | baixo | **DECISÃO PENDENTE:** se a ACASA precisa registrar a **data de admissão** (evento estatutário) distinta da data de criação do registro. Se sim, o campo pertence à P2-04 |

### Síntese da matriz

- **Dedutível com segurança:** apenas nome/razão social.
- **Sem finalidade demonstrada até aqui:** RG, filiação, naturalidade, profissão, formação, assinaturas, foto.
- **Finalidade plausível, pendente de confirmação:** CPF (deduplicação), telefone e e-mail (contato), endereço na comunidade (serviço), data de nascimento (capacidade civil).
- **Maior risco estrutural isolado:** observações livres.

**RECOMENDAÇÃO geral:** dado sem necessidade demonstrável deve ser **removido** ou **adiado**, e não mantido "porque já existia na ficha" (RB-008, R-006).

## 5. Categoria estatutária

**FATO CONFIRMADO:** o catálogo existe, é referenciável e não é editável em runtime.

**RECOMENDAÇÃO técnica** para quando a P2-02 for implementada:

- referenciar `public.membership_categories (code)` por **chave estrangeira**, e não por texto livre ou enum duplicado — a FK é o que impede código inexistente;
- `on update cascade`, para acompanhar eventual renormalização de código feita por migration; `on delete restrict`, para impedir que a remoção de uma categoria apague silenciosamente o enquadramento de associados;
- cobrir com teste pgTAP a **rejeição efetiva** de um código inexistente, no mesmo padrão adotado pela P2-01.

**DECISÃO PENDENTE — obrigatoriedade.** Se a categoria for `not null`, todo associado precisa ser enquadrado no momento da criação. Porém [`association-intake.md`](association-intake.md) registra que a categoria não deve ser inferida pelo formulário sem regra aprovada e que o momento e o responsável pelo enquadramento ainda precisam ser definidos. Há, portanto, tensão real:

| Opção | Consequência |
|---|---|
| categoria obrigatória desde a criação | força o enquadramento no ato do cadastro; impede associado sem categoria; pode travar a importação de cadastros legados cuja categoria não seja conhecida (DP-006A) |
| categoria nula permitida | admite cadastro incompleto; exige regra de quando o enquadramento se torna obrigatório e algum acompanhamento de pendências |

**RECOMENDAÇÃO:** obrigatória desde a criação, **se** a ACASA confirmar que todo associado atual tem categoria conhecida. Caso contrário, permitir nula e reforçar a obrigatoriedade em fase posterior. A resposta depende de DP-006A e deve existir antes da migration.

## 6. Pessoa física versus pessoa jurídica

**FATO CONFIRMADO:** o Art. 12 define Contribuinte como pessoa física **ou jurídica** da comunidade. [`membership-model.md`](membership-model.md) registra "como registrar pessoa jurídica quando classificada como Contribuinte" entre as decisões abertas.

Esta decisão é **estruturalmente bloqueante**: determina se existe uma tabela ou duas, quais colunas podem ser `not null` e como a deduplicação funciona.

| Opção | Simplicidade | Integridade | Validações | Ingresso | Documentos | Duplicidade | Evolução |
|---|---|---|---|---|---|---|---|
| **1. Entidade única com tipo de pessoa** | alta — um cadastro, uma FK de categoria, uma listagem | média — exige `check` condicional para não aceitar CPF em PJ nem CNPJ em PF; colunas de PF ficam nulas em PJ | condicionais por tipo, no banco e no servidor | um formulário com ramo condicional | um único ponto de vínculo de anexos | uma única chave natural: CPF **ou** CNPJ, conforme o tipo | boa; acrescentar campos de PJ não afeta PF |
| **2. Entidades separadas** | baixa — duas tabelas, duas telas, e todo relacionamento futuro (cobrança, comprovante, documento) precisa apontar para duas origens | alta dentro de cada tabela, baixa no conjunto — exige supertipo ou FK polimórfica | naturais por tabela | dois formulários | vínculo duplicado ou polimórfico | duas chaves independentes | custo alto e imediato por um benefício futuro |
| **3. Adiar suporte a PJ** | máxima — apenas PF na P2-02 | alta | simples | um formulário | simples | uma chave | **risco:** se a ACASA já possui associado PJ, o sistema não representa a realidade e exigirá migration estrutural depois |

**RECOMENDAÇÃO:** opção **1 — entidade única com tipo de pessoa**, porque preserva um único ponto de relacionamento para as fases financeira e de documentos e evita FK polimórfica, ao custo de validações condicionais, que são baratas em PostgreSQL.

**DECISÃO PENDENTE — prioritária.** Antes da migration, a ACASA precisa responder: **existe hoje algum associado pessoa jurídica, ou trata-se apenas de uma possibilidade estatutária?** A resposta separa a opção 1 (existe, ou é provável) da opção 3 (nunca ocorreu na prática). Implementar a opção 1 sem essa resposta cria colunas e validações para um caso que pode não existir; implementar a opção 3 sem ela contraria o Estatuto no modelo de dados.

## 7. Identidade, unicidade e deduplicação

**FATO CONFIRMADO:** R-016 já registra o risco de o fluxo de ingresso criar duplicidade de pessoa/associado.

Critérios que a implementação da P2-02 deve observar:

1. **Identificador técnico:** `uuid` opaco, imutável, gerado pelo sistema. **CPF não deve ser chave primária** — pode estar ausente, é PII replicada em toda FK e em toda URL, e inviabiliza pessoa jurídica.
2. **Nome não é chave.** Homônimos são esperados em uma comunidade pequena; unicidade por nome produziria falso positivo e bloquearia cadastro legítimo.
3. **Chave natural condicionada à DP-008:** se CPF for aprovado, unicidade **parcial** (única apenas quando não nula), permitindo cadastros ainda sem CPF durante a transição do papel. O mesmo vale para CNPJ, se PJ for suportada.
4. **Sem CPF aprovado não existe chave natural confiável.** Nesse cenário a deduplicação deve ser **assistida**, não automática: a interface administrativa alerta sobre candidatos semelhantes e a decisão é humana. Deduplicação automática por nome mais data de nascimento é **HIPÓTESE** e não deve ser implementada sem aprovação.
5. **Número de registro legado**, se adotado, é identificador **de negócio**: pode ser único, mas não substitui a chave técnica nem é confiável para deduplicação, por poder estar duplicado ou ausente no papel.
6. **PF versus PJ:** a chave natural depende do tipo de pessoa, e a restrição de unicidade precisa refletir isso.
7. **Conversão de solicitação:** a P2-09 deve **vincular** a solicitação aprovada ao associado criado, preservando a origem, em vez de copiar dados sem rastro (RF-020).

## 8. Situação cadastral e a fronteira com a P2-04

**FATO CONFIRMADO:** DP-005 está formalmente aberta. `ATIVO`, `DESLIGADO_VOLUNTARIAMENTE` e `EXCLUIDO_EX_OFFICIO` são **normalização recomendada**, não aprovada. `SUSPENSO`, `INATIVO`, `INADIMPLENTE` e `REJEITADO` não devem ser criados como situação cadastral do associado.

A divisão proposta — P2-02 cria o cadastro e o vínculo com categoria; P2-04 implementa estados, transições e histórico — é **coerente com os requisitos atuais**: RF-003 (cadastro) e RF-004/RF-022 (encerramento, readmissão, histórico auditável) são requisitos distintos, e o backlog já os separa nos itens P2-02 e P2-04.

### Se `ATIVO` for indispensável na criação

Um associado recém-cadastrado é, de fato, um associado com vínculo vigente. Há duas formas de refletir isso sem transformar a P2-02 em P2-04:

| Abordagem | Como funciona | Efeito sobre o histórico |
|---|---|---|
| **A. Ausência de estado significa vínculo vigente** | a P2-02 não cria coluna de situação; a P2-04 introduz a tabela de eventos do vínculo e registra o evento de admissão para os associados já cadastrados | histórico íntegro; nenhum estado precisa ser reescrito |
| **B. Coluna de situação restrita a `ATIVO`** | a P2-02 cria a coluna já limitada a `ATIVO`; a P2-04 amplia o domínio e introduz o histórico | funciona, mas cria um estado sem o evento que o originou, e a P2-04 terá de retroceder e sintetizar a admissão |

**RECOMENDAÇÃO:** abordagem **A**. O que confere valor ao vínculo não é o rótulo do estado, mas o **evento** (admissão pela Diretoria, desligamento, exclusão, readmissão) com motivo, data e responsável — exatamente o escopo da P2-04, dependente de DP-005. Criar a coluna antes significa afirmar no schema um domínio que a ACASA ainda não confirmou.

**Atenção à data de admissão no backfill.** `created_at` registra quando a linha entrou no novo sistema, **não** quando a Diretoria admitiu o associado. Usar `created_at` como data de admissão fabricaria histórico associativo e poderia produzir tempo de vínculo e resultado de auditoria incorretos. Portanto, ao registrar retroativamente o evento de admissão, a P2-04 deve preservar a **data de admissão de origem** quando houver evidência documental (ficha, ata, planilha) e marcá-la explicitamente como **desconhecida** quando não houver — nunca substituí-la pela data de criação do registro. Se a ACASA confirmar que precisa dessa data, ela é um campo de negócio e deve ser coletada já na P2-02 (ver §4, "Data de preenchimento").

**Consequência aceita:** entre a P2-02 e a P2-04 o sistema não distingue associado desligado de associado com vínculo vigente. Isso é adequado enquanto o cadastro for apenas administrativo e não houver operação que dependa da distinção. **A P2-04 deve preceder qualquer funcionalidade que dependa de vínculo vigente** — cobrança, portal do associado ou apuração de quórum.

**Readmissão** permanece conceitualmente como **transição auditada** de volta ao vínculo vigente, preservando o histórico do desligamento ou exclusão anterior — nunca como substituição silenciosa do estado.

## 9. Identidade autenticada versus Associado

**FATO CONFIRMADO:** a autenticação (P1-04) conhece apenas `{ userId }`, obtido do JWT verificado em `src/lib/auth/identity.ts`. Não existe tabela de perfil, `enable_signup` está desabilitado e nenhum vínculo entre `auth.users` e dados de negócio foi criado.

| Pergunta | Análise |
|---|---|
| Todo associado precisa de usuário Auth? | **Não.** O Estatuto não condiciona o vínculo associativo a acesso digital. Exigir conta excluiria associados sem e-mail ou sem uso de internet — realidade plausível na comunidade. |
| Um associado administrativo pode existir sem conta? | **Sim, e deve poder.** O cadastro administrativo (RF-003) é independente do portal do associado (RF-011). |
| Como seria o vínculo futuro? | Coluna `auth_user_id` **nula por padrão** no associado, com FK para `auth.users(id)` e unicidade parcial, de modo que uma conta sirva no máximo um associado. O vínculo é criado quando — e só quando — o acesso ao portal for concedido. |
| Impacto no portal do associado (Fase 4) | O portal passa a exigir que a sessão resolva para um associado vinculado; sem vínculo, a área do associado simplesmente não se aplica àquele usuário. |
| Impacto na inscrição pública (P2-08/P2-09) | Uma solicitação **não** deve criar conta de acesso. `enable_signup = false` já reflete essa postura. Se o candidato precisar acompanhar a solicitação, isso é decisão da P2-08/P2-09, não da P2-02. |
| Risco de acoplar cadastro à autenticação | Alto: criar uma conta por associado geraria usuários órfãos, tornaria o e-mail obrigatório sem finalidade, ampliaria a superfície de credenciais e criaria dependência de um provedor de e-mail transacional que ainda não existe. |

**RECOMENDAÇÃO:** modelagem **desacoplada**. A P2-02 não deve criar linha em `auth.users` para associado, não deve introduzir tabela `profiles` e não deve tornar o e-mail obrigatório apenas para viabilizar login futuro. A coluna de vínculo pode ser adicionada quando o portal entrar em escopo; adicioná-la antes é criar uma FK sem consumidor.

## 10. LGPD e segurança

| Dimensão | Posição |
|---|---|
| Minimização | apenas o nome é dedutível como necessário; todo o restante depende de finalidade confirmada (RNF-006, RB-008) |
| Finalidade | deve ser registrada **antes** da coleta, campo a campo, conforme §4 — nunca retroativamente |
| Necessidade | a evidência da ficha legada **não** é finalidade; a pergunta relevante é o que o sistema faz com o dado |
| Acesso | nenhum acesso amplo de `authenticated` ao futuro cadastro. O padrão da P2-01 — RLS habilitado, privilégios revogados, autorização server-side — deve ser mantido; visibilidade por campo é escopo da P2-05 |
| Logs | **nenhum dado pessoal em log.** O logger de P1-05 já opera com allow-list de campos; identificar registros em log deve usar o `uuid` interno, nunca CPF, e-mail ou nome |
| URLs | o `uuid` opaco em rotas evita expor PII em query string, histórico de navegador e logs de borda |
| Auditoria | operações sobre dados pessoais são candidatas naturais a evento auditável na P2-06; a P2-02 não implementa auditoria de runtime |
| Retenção | permanece **DECISÃO PENDENTE**; nenhum descarte automático deve ser implementado antes dela (RB-009) |
| Exportação e exclusão | o modelo deve permitir localizar todos os dados de um titular a partir do `uuid` — argumento adicional para não espalhar PII em campos livres |
| Observações livres | maior risco isolado do modelo: acumulam PII não minimizada e podem receber dado sensível sem controle |
| Credenciais versus cadastro | senhas e credenciais permanecem exclusivamente no Supabase Auth; o cadastro de associado nunca armazena credencial |
| `service_role` | não é usada pela aplicação e não deve ser introduzida; `src/lib/supabase/env.ts` recusa chave secreta em variável pública |

## 11. Pacote de decisão

| Decisão | Recomendação | Evidência | Risco se adotada | Alternativa | Precisa aprovação do produto? |
|---|---|---|---|---|---|
| **D1** — Coletar CPF? | coletar como **opcional e único quando presente**, apenas se a ACASA confirmar uso para identificação/deduplicação | ficha legada; R-016 | dado de alto valor: exige controle de acesso e jamais pode ir a log ou URL | não coletar e usar deduplicação assistida (§7.4) | **Sim** |
| **D2** — Coletar RG, filiação, naturalidade, profissão, formação? | **não coletar** | nenhuma finalidade de sistema identificada | perda de paridade com a ficha de papel | coletar como opcional se a ACASA demonstrar finalidade | **Sim** |
| **D3** — Coletar foto 3x4? | **adiar** | carteirinha digital está fora do MVP | sem carteirinha, nenhuma finalidade demonstrada | coletar em fase própria, com Storage privado e retenção definida | **Sim** |
| **D4** — Contato de emergência? | **não coletar na P2-02** | ficha legada | PII de terceiro sem base legal registrada | escopo próprio, com finalidade e ciência do terceiro | **Sim** |
| **D5** — Campo livre de observações? | **não criar na P2-02** | ficha legada | acumula PII e possível dado sensível sem controle | criar restrito por perfil (P2-05), auditado (P2-06) e com orientação explícita | **Sim** |
| **D6** — Telefone e e-mail? | coletar como **opcionais**; exigir ao menos um canal é decisão da ACASA | ficha legada; contato administrativo | baixo | tornar um deles obrigatório | **Sim** |
| **D7** — Quais endereços e para quê? | confirmar se o **endereço na comunidade** serve ao serviço de água; se sim, provavelmente pertence ao domínio de serviço/taxas (Fase 3) | o Regimento trata taxas do serviço de água | modelar endereço no lugar errado gera retrabalho | manter ambos os endereços no cadastro, como opcionais | **Sim** |
| **D8** — Data de nascimento? | coletar apenas se houver regra que dependa de idade ou capacidade civil | ficha legada | dado que permite inferência sem uso definido | não coletar | **Sim** |
| **D9** — Pessoa física versus jurídica | **entidade única com tipo de pessoa** (opção 1) | Art. 12: Contribuinte pode ser PJ | colunas nulas e validações condicionais | entidades separadas; ou adiar suporte a PJ | **Sim — prioritária e estruturalmente bloqueante** |
| **D10** — Categoria obrigatória na criação? | obrigatória, **se** todo associado atual tiver categoria conhecida | RF-005; `association-intake.md` deixa o momento do enquadramento em aberto | pode travar cadastro ou importação de registro legado sem categoria | permitir nula, com pendência acompanhada | **Sim** (depende de DP-006A) |
| **D11** — FK e integridade da categoria | FK para `membership_categories(code)`, `on update cascade` e `on delete restrict`, com teste pgTAP de rejeição | padrão já adotado na P2-01 | nenhum relevante | — | Não — decisão técnica |
| **D12** — Situação cadastral na P2-02 | **não criar** coluna de situação; a P2-04 introduz os eventos do vínculo e registra a admissão retroativamente (§8, abordagem A) | DP-005 aberta; o backlog já separa P2-02 de P2-04 | entre P2-02 e P2-04 não se distingue vínculo vigente de encerrado | coluna restrita a `ATIVO` desde já (abordagem B) | Não para adiar; **sim** para o domínio final (DP-005) |
| **D13** — Vínculo com `auth.users` | **desacoplado**: sem conta por associado, sem `profiles`; coluna nula acrescentada quando o portal entrar em escopo | P1-04 não criou perfil; `enable_signup = false` | o portal exigirá uma migration futura, de baixo custo | criar `auth_user_id` desde já | Não — decisão técnica reversível |
| **D14** — Identificador técnico | `uuid` opaco e imutável; **CPF nunca como chave** | RNF-006; risco de PII em URL e log | nenhum relevante | número de registro legado como chave | Não — decisão técnica |
| **D15** — Número de registro legado | adotar apenas se houver uso operacional real; nunca como chave técnica | ficha legada | pode estar duplicado ou ausente no papel | não adotar | **Sim** |
| **D16** — Autorização do cadastro: P2-02 x P2-05 | antecipar para a P2-02 o **menor recorte** de autorização administrativa, validado no servidor (§2, alternativa B) | P1-04 expõe só `{ userId }`; `authenticated` sem privilégio; `service_role` proibida na aplicação | decide um recorte de permissão antes da matriz completa da P2-05 | P2-02 apenas de schema (A); ou P2-05 completa antes (C) | **Sim** — depende de quem opera o cadastro na ACASA |
| **D17** — Data de admissão no backfill | preservar a data de origem quando houver evidência documental; marcar como desconhecida quando não houver; **nunca** usar `created_at` como data de admissão | `created_at` registra a entrada no sistema, não o ato da Diretoria | exige campo próprio e possível dado ausente | derivar da data de criação do registro (fabrica histórico) | **Sim** — a ACASA precisa dizer se essa data é necessária |

## 12. Perguntas objetivas para a ACASA

As respostas abaixo destravam a implementação da P2-02:

1. Existe hoje algum associado **pessoa jurídica**, ou isso é apenas uma possibilidade estatutária? *(D9 — bloqueante)*
2. O sistema deve armazenar **CPF**? Em caso afirmativo, para qual finalidade concreta? *(D1)*
3. Todo associado atual tem **categoria estatutária conhecida**? *(D10)*
4. Quais canais de contato a administração realmente usa: telefone, e-mail, ambos ou nenhum? *(D6)*
5. O **endereço na Comunidade Aldeia** é usado para o serviço de água ou para outra operação? *(D7)*
6. Existe alguma regra que dependa da **idade** do associado? *(D8)*
7. O **número de registro** da ficha é usado no dia a dia da administração? *(D15)*
8. Há necessidade real de **observações livres** no cadastro? Em caso afirmativo, quem pode lê-las? *(D5)*
9. A normalização `ATIVO` / `DESLIGADO_VOLUNTARIAMENTE` / `EXCLUIDO_EX_OFFICIO` está confirmada? *(DP-005, para a P2-04)*
10. Existem cadastros de associados em papel ou planilha a importar? *(DP-006A; afeta D10 e D1)*
11. Quem, na ACASA, opera o cadastro de associados — um único responsável ou vários papéis distintos? *(D16, define o recorte mínimo de autorização)*
12. A **data de admissão** de cada associado precisa ser registrada, e existe evidência documental dela? *(D17)*

## 13. Compromisso de escopo desta etapa

Nenhuma migration de associado, entidade, CRUD, tela, API, estado cadastral, perfil, auditoria de runtime ou solicitação pública foi criada nesta tarefa. A implementação da P2-02 depende das respostas de §12, em especial **D9**, **D1**, **D10** e **D16**.
