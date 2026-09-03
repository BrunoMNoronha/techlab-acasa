# Categorias e situação cadastral do associado

## Fonte normativa

Esta especificação foi consolidada a partir do **Estatuto da Associação Comunitária de São Sebastião da Aldeia — ACASA (2025)** e do **Regimento Interno da ACASA (2025)** recebidos durante o planejamento.

A terminologia estatutária prevalece sobre exemplos anteriores de planejamento.

## Categorias estatutárias confirmadas

O Art. 12 do Estatuto estabelece três categorias de sócios:

1. **Fundadores** — os que assinaram a ata originária de constituição da ACASA e participaram de sua formação inicial, conforme o Estatuto.
2. **Beneméritos** — os que se destacarem na realização de obras relevantes por meio da ACASA, indicados a juízo da Diretoria.
3. **Contribuintes** — pessoa física ou jurídica da comunidade que se comprometa a auxiliar a ACASA com trabalho voluntário ou contribuição financeira, conforme condições definidas pela associação.

### Consequência para o sistema

- os valores iniciais de categoria devem ser `FUNDADOR`, `BENEMERITO` e `CONTRIBUINTE`;
- a interface deve exibir os nomes estatutários em português;
- não criar categorias como Titular, Estudante, Honorário ou outras sem nova base normativa/decisão formal;
- como as categorias decorrem do Estatuto, alterações não devem ser tratadas como cadastro livre de uso cotidiano;
- o modelo de dados pode evitar enum rígido para permitir futura alteração estatutária, mas mudanças devem ser autorizadas e auditáveis.

O modo como essas consequências foram implementadas está na seção [Governança do catálogo de categorias](#governança-do-catálogo-de-categorias).

## Governança do catálogo de categorias

Implementado na P2-01 (Issue #14); a tabela foi criada na P1-03.

### Como o catálogo existe hoje

As categorias vivem em `public.membership_categories`, uma **tabela de referência** (não um enum rígido), com código estável como chave primária e nome de exibição único. Os três pares oficiais são carregados pela própria migration versionada, que é a fonte de verdade:

| Código | Nome de exibição |
|---|---|
| `FUNDADOR` | Fundador |
| `BENEMERITO` | Benemérito |
| `CONTRIBUINTE` | Contribuinte |

### O catálogo não é cadastro cotidiano

No estágio atual, categorias estatutárias:

- **não são editáveis pela aplicação**;
- não possuem endpoint, Route Handler ou Server Action de CRUD;
- não possuem tela administrativa de manutenção;
- não recebem `insert`, `update` ou `delete` de roles comuns: `anon` e `authenticated` não têm privilégio algum sobre a tabela, e o RLS está habilitado sem nenhuma policy, o que nega o acesso por padrão;
- só mudam mediante base normativa ou decisão formal compatível.

A aplicação nunca usa a chave `service_role`, que contornaria essas proteções: apenas variáveis públicas são lidas, e a validação de configuração recusa uma chave secreta ou de `service_role` em variável pública (ver [`../operations/environments-observability.md`](../operations/environments-observability.md)).

As constraints que impedem o catálogo de degenerar em cadastro livre — formato do código, nome não vazio, nome único e nome obrigatório — possuem testes pgTAP que verificam a **rejeição efetiva** de valores inválidos, e não apenas a estrutura da tabela.

### Procedimento para alterar uma categoria estatutária

Uma alteração futura (inclusão, remoção ou renomeação) exige, no mínimo:

1. identificação da nova base normativa ou decisão formal que a autoriza;
2. issue rastreável registrando essa base e o impacto;
3. migration SQL versionada, sem reescrever migrations já aplicadas;
4. atualização dos testes pgTAP, incluindo a contagem e os pares esperados;
5. atualização deste documento e dos requisitos/backlog afetados;
6. revisão via Pull Request;
7. CI verde antes do merge.

### Trilha de auditoria

Para um catálogo que **não é editável em runtime**, a trilha de auditoria apropriada é o próprio histórico do repositório: migration versionada, issue, Pull Request e revisão registram quem alterou, quando, com qual base normativa e com qual aprovação.

Não foi criada tabela genérica de auditoria para isso. Auditoria de **operações administrativas em runtime** é responsabilidade da P2-06, quando existirem operações administrativas a auditar.

## Situação cadastral: o que o Estatuto efetivamente define

O Estatuto **não apresenta uma enumeração formal de “situações cadastrais”** como Ativo, Inativo ou Suspenso.

Ele define, porém, eventos e condições do vínculo associativo suficientes para modelar o ciclo de vida:

- a Diretoria pode **admitir sócios**;
- a Assembleia Geral é constituída pelos sócios **em pleno gozo de seus direitos estatutários**;
- a exclusão pode ocorrer **por vontade própria**;
- a exclusão pode ocorrer **ex officio**, nas hipóteses estatutárias;
- da decisão de exclusão cabe recurso à Assembleia Geral;
- associado anteriormente excluído/retirado pode ser **readmitido**, conforme decisão dos órgãos previstos no Estatuto.

## Normalização recomendada para o sistema

Para representar os eventos estatutários sem inventar suspensão ou inatividade não previstas, adotar inicialmente:

| Código | Nome de exibição | Significado |
|---|---|---|
| `ATIVO` | Ativo | associado admitido e com vínculo vigente |
| `DESLIGADO_VOLUNTARIAMENTE` | Desligado a pedido | vínculo encerrado por vontade própria do associado |
| `EXCLUIDO_EX_OFFICIO` | Excluído | vínculo encerrado por decisão administrativa nas hipóteses do Estatuto |

### Readmissão

`READMITIDO` não deve ser uma situação permanente. A readmissão deve ser uma **transição auditada** que conduz o vínculo novamente a `ATIVO`, preservando o histórico do desligamento/exclusão anterior e da decisão de readmissão.

### Situações que não devem ser criadas sem nova regra

Não usar como situação cadastral do associado, neste momento:

- `SUSPENSO` — não há regra estatutária identificada que defina suspensão do vínculo;
- `INATIVO` — não há situação estatutária equivalente claramente definida;
- `INADIMPLENTE` — é situação financeira/operacional, não cadastral;
- `REJEITADO` — pertence ao workflow de solicitação de ingresso, não ao vínculo de quem já é associado;
- `FALECIDO` — deve ser tratado como motivo de encerramento quando aplicável, não como categoria ou situação principal sem regra específica.

## Exclusão ex officio

O Art. 12 prevê como causas de exclusão ex officio, em síntese:

- inobservância ou recusa de cumprimento dos deveres estatutários e regulamentares;
- indisciplina perante os órgãos sociais;
- ausências reiteradas nas convocações/reuniões indicadas pelo Estatuto sem justificativa;
- falta grave, a juízo da Diretoria.

A implementação do processo de exclusão deve preservar:

- motivo;
- responsável pela decisão;
- data;
- evidência necessária;
- possibilidade/resultado de recurso à Assembleia Geral;
- histórico imutável suficiente para auditoria.

## Situação financeira separada

O Regimento Interno trata o contribuinte como **inadimplente** quando há atraso nas taxas nele reguladas e prevê consequências operacionais relacionadas ao serviço de água.

Portanto:

- `INADIMPLENTE` pertence ao domínio financeiro/serviço;
- inadimplência não deve alterar automaticamente a situação cadastral do associado;
- regras específicas de contribuição associativa e taxas de serviços devem permanecer separadas no modelo.

## Solicitação de ingresso

A solicitação pública de associação, aprovada para o MVP, possui workflow próprio. Estados como `EM_ANALISE`, `APROVADA` ou `REJEITADA` não devem ser misturados com `ATIVO`, `DESLIGADO_VOLUNTARIAMENTE` ou `EXCLUIDO_EX_OFFICIO`.

A Diretoria é o órgão estatutariamente competente para admitir/demitir sócios. A definição de quais perfis do sistema operacionalizarão a análise ainda deve ser detalhada na matriz de permissões.

## Decisões ainda abertas

O refinamento da P2-02 em [`member-model-refinement.md`](member-model-refinement.md) decompõe parte destas decisões em alternativas comparadas e perguntas objetivas para a ACASA. As recomendações registradas ali **não** aprovam nenhuma das decisões abaixo.

- critérios práticos de enquadramento inicial em cada categoria;
- como registrar pessoa jurídica quando classificada como Contribuinte (alternativas comparadas em `member-model-refinement.md`, §6; decisão estruturalmente bloqueante para a P2-02);
- campos obrigatórios do ingresso por categoria;
- estados detalhados da solicitação pública;
- tratamento operacional do recurso contra exclusão;
- motivos padronizados de desligamento voluntário e exclusão;
- regra de readmissão na aplicação;
- eventual relação entre categoria Contribuinte e cobranças associativas, distinta das taxas de serviços reguladas pelo Regimento.
