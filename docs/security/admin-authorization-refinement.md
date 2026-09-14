# Autorização administrativa mínima de associados — DP-015

- **Data:** 2026-09-14.
- **Rastreabilidade:** [Issue #22](https://github.com/BrunoMNoronha/techlab-acasa/issues/22), [Issue #24](https://github.com/BrunoMNoronha/techlab-acasa/issues/24), [Issue #26](https://github.com/BrunoMNoronha/techlab-acasa/issues/26), RF-002/RF-003/RNF-002, P2-02 ↔ P2-05, D13.
- **Status:** DT-015A implementada na fundação local; **DP-015B APROVADA** pelo responsável pelo produto em 2026-09-14. Cadastro administrativo desbloqueado para o escopo mínimo da P2-02.
- **Fonte principal:** este documento especifica autorização; campos e decisões já aprovados permanecem em [member-model-refinement.md, §0](../product/member-model-refinement.md).

## 1. Evidência e classificação

| Classificação | Significado e resultado desta revisão |
|---|---|
| **FATO CONFIRMADO** | Evidência inspecionada em código/documentação e GitHub, sem inferir estado de ambiente remoto |
| **REQUISITO APROVADO** | D13 e o pacote de dados de §0 continuam válidos; categorias de RF-005/RF-006 permanecem aprovadas. RF-002, RF-003 e RNF-002 continuam **BASELINE**, sem promoção automática de status |
| **DECISÃO TÉCNICA** | DT-015A, abaixo: mecanismo mínimo e fronteiras de segurança escolhidos e implementados na fundação da Issue #24 |
| **RECOMENDAÇÃO** | Medidas operacionais e sequência de entrega propostas, distintas de regra organizacional aprovada |
| **DECISÃO DE PRODUTO PENDENTE** | DP-015B: pessoas elegíveis e autoridade organizacional para autorizar sua concessão; nenhuma resposta inferida do Estatuto |

**FATO CONFIRMADO no início da Issue #24:** `origin/main` em `27aad5d916e073d787f3667f650c10eb6d893604`, working tree limpo, PR #23 integrado e CI da `main` verde. Fase 1 e P2-01 concluídas; P2-02 em andamento, com schema mínimo entregue por #21 e refinamento técnico entregue por #23.

| Evidência versionada | Constatação |
|---|---|
| `src/lib/auth/identity.ts` e `member-administration.ts` | `getClaims()` verifica identidade; o guard consulta o RPC sem receber identidade do cliente e falha fechado |
| `src/proxy.ts`, `src/lib/supabase/proxy.ts`, `/area-restrita` | renovação/redirecionamento otimista; página revalida identidade no servidor; não é autorização de negócio |
| `src/lib/supabase/server.ts`, `env.ts` | cliente SSR usa chave publicável e sessão do usuário; aplicação sem `service_role` |
| `supabase/config.toml` | signup público e login anônimo desabilitados; sem Auth Hook ativo; configuração local, não prova de configuração remota |
| migration `20260914190000` | `member_administrators`, RLS de leitura própria, ACL mínima e `can_manage_members()`; tabelas de negócio permanecem fechadas |
| `supabase/tests/database/*` e integração | 59 testes anteriores preservados, 44 novos pgTAP e integração com contas fictícias, Auth/JWT/Data API reais |

Não apareceu decisão posterior liberando CRUD. A divergência operacional é o uso legado de npm/`package-lock.json` no repositório frente à instrução vigente de pnpm: a Issue #22 inclui a adequação do fluxo local/CI, sem alterar versões diretas, autenticação ou migrations.

## 2. Perguntas separadas e decisão técnica

**DT-015A — DECISÃO TÉCNICA:** representar uma única concessão de capacidade, de escopo **cadastro de associados**, em tabela específica da aplicação referenciada pelo `auth.users.id`. Consultar a concessão corrente no servidor e reforçá-la com grants mínimos/RLS no banco. Não representar autorização por e-mail, categoria associativa ou claim administrativa persistida no JWT.

O nome conceitual da capacidade é `manage_members`; não é novo papel organizacional, enum de perfis nem framework de permissões. Evitar `ADMIN` global: permitir administrar cadastro não implica administrar o sistema. A tabela conceitual `public.member_administrators` representa somente quem tem essa capacidade, admitindo zero ou várias contas. Os nomes físicos serão confirmados na migration do incremento futuro.

**DP-015B — DECISÃO DE PRODUTO APROVADA (2026-09-14):** A capacidade `manage_members` poderá ser concedida exclusivamente a pessoas individualmente designadas pela ACASA para manutenção cadastral. A concessão e a revogação dependem de autorização da Diretoria da ACASA, devidamente referenciada no procedimento operacional. Cargo, função ou simples participação na Diretoria ou em qualquer outro órgão da associação não concede acesso automaticamente. O executor técnico autorizado realiza a concessão ou revogação, mas não possui autoridade para decidir quem deve recebê-la. `manage_members` autoriza somente a consulta, cadastro e edição dos dados mínimos pertencentes à P2-02. Essa capacidade não concede, por implicação, poderes para admissão/desligamento de associados, situação cadastral, financeiro, solicitações de ingresso, gestão de usuários, concessão de permissões ou qualquer outro domínio. Eventuais níveis diferentes de acesso ou matriz mais ampla de permissões permanecem para a P2-05.

**DP-015 foi resolvida integralmente** (DT-015A como fundação técnica e DP-015B como decisão organizacional), desbloqueando o incremento 3 da P2-02 (cadastro administrativo).

## 3. Alternativas avaliadas

A comparação abaixo é **análise da equipe** aplicada ao projeto, apoiada nas fontes de §10. Não há equivalência entre uma concessão consultada no banco e uma cópia dela no token.

| Alternativa | Segurança, menor privilégio e escalada | Servidor e RLS | Revogação | Bootstrap e auditabilidade |
|---|---|---|---|---|
| Tabelas genéricas de papéis/permissões por `auth.users.id` | Segura se concessões não forem graváveis por clientes; mais relações e superfícies de erro | Consultas e policies com junções; guard obrigatório | Próxima consulta ao banco, sem depender de refresh | Provisionamento SQL controlado; exige evidência de cada mudança e futura auditoria |
| **Tabela específica por UUID (escolhida)** | Escopo único, sem autoatribuição e sem herança implícita | Mesma concessão corrente para guard e RLS; consulta indexada por PK | Próximo comando com snapshot posterior ao commit da revogação | SQL operacional controlado; evidência externa de concessão/revogação; tabela corrente não é histórico |
| `app_metadata` do Auth | Usuário não pode alterá-la via atualização comum, mas gestão exige canal administrativo; não usar `user_metadata` | Guard/`auth.jwt()` leem claim assinada; assinatura não garante atualidade | Claim antiga pode continuar autorizando até refresh/expiração; consulta extra seria necessária | Admin API/console protegido; exige gestão operacional de credenciais e evidência das alterações |
| Custom Access Token Hook / claims | Emite claim de fonte confiável, mas amplia superfície de configuração e privilégios do hook | Facilita policies e guard; emissão não consulta autorização a cada operação | Hook roda na emissão; token já emitido continua com valor antigo | Tabela de origem + hook + provisionamento; mais componentes a testar e rastrear |
| Allow-list por e-mail/configuração | E-mail é mutável; risco de reatribuição, comparação inconsistente e confusão com contato de associado | Lista só no servidor não protege Data API; duplicá-la em RLS gera divergência | Depende de configuração, cache e deploy; token pode carregar e-mail antigo | Fácil inicialmente, difícil rastrear por ambiente; PII não deve ir ao Git |
| Backend SQL dedicado, sem Data API de negócio | Possível com credencial restrita; uma conexão com bypass RLS seria insegura | Exige propagar identidade confiável e manter guard/transações; outra integração | Consulta transacional possível | Mais segredos, pool e operação; desnecessário no stack atual |

| Alternativa | Manutenção e complexidade MVP | Testabilidade | Portabilidade / acoplamento | Evolução P2-05 |
|---|---|---|---|---|
| RBAC genérico | Alta para uma capacidade | Mais combinações de papéis, concessões e joins | Núcleo PostgreSQL portável; adaptador Auth | Flexível, porém antecipa matriz sem requisitos |
| **Tabela específica** | Baixa: tabela, predicado e guard pequenos | Fixtures de 3 identidades; pgTAP e chamadas diretas | Tabela SQL portável; FK Auth/`auth.uid()` são acoplamento explícito | Migrar concessões para modelo futuro mantendo contrato do guard |
| `app_metadata` | Pouco schema, mais dependência de Auth e renovação | Testar tokens antigos/novos e API administrativa | Alto acoplamento ao Supabase Auth | Exige sincronização/migração se surgirem permissões relacionais |
| Hook | Complexidade desproporcional agora | Emissão, falha de hook, grants do hook e tokens antigos | Alto acoplamento ao protocolo de hooks | Útil se necessidade de claims for comprovada futuramente |
| Allow-list | Baixa inicial, alta com troca de pessoas/ambientes | Mudança de e-mail, configuração, cache e deploy | Config portável, sem integridade referencial | Migração difícil se a identidade continuar sendo e-mail |
| SQL dedicado | Alta; duplica infraestrutura de acesso | Conexão, identidade e isolamento por requisição | SQL portável, mas precisa adaptador adicional | Não resolve quem recebe permissão; sem benefício atual |

**Justificativa:** a opção escolhida concentra o estado de autorização em uma relação pequena e revogável, reaproveita SSR/Data API e dispensa administração de claims e uma matriz genérica. O custo aceito é consultar a concessão no banco e manter um procedimento operacional protegido. A tabela não deve crescer silenciosamente para um cadastro de dados pessoais de operadores.

## 4. Modelo conceitual e superfície autorizada

**DECISÃO TÉCNICA — contrato para implementação futura, não DDL nesta tarefa:**

- `member_administrators.user_id`: UUID, PK e FK para `auth.users(id)`; conta existente é pré-condição; nunca usar e-mail ou `members.id`. Recomenda-se `ON DELETE RESTRICT`, exigindo revogar a concessão antes de remover a conta.
- `granted_at`: instante imposto pelo banco; não substituir evidência operacional de quem aprovou/executou a concessão.
- Existência da linha significa concessão; ausência significa negar. Revogação remove a linha em transação. Sem coluna de papel, perfil pessoal, `tenant_id`, estado associativo ou vínculo com `members`.
- Nenhuma migration/seed deve cadastrar operador real ou escolher automaticamente o primeiro usuário. Fixtures locais/testes usam identidades fictícias explícitas e não se tornam provisionamento de ambiente.

| Após implementação e decisão de produto | Limite da capacidade |
|---|---|
| Consultar cadastro, inclusive por ID; criar e editar dados mínimos já aprovados | O conjunto de registros pode ser acessado pelos destinatários autorizados; a ACASA deve confirmar que esses destinatários podem manter esse conjunto de dados |
| Informar/alterar a referência de categoria conforme operação aprovada | Não altera códigos, nomes ou governança do catálogo estatutário; não decide mérito de admissão/enquadramento por nova regra |
| Ler o catálogo para alimentar o cadastro | Somente leitura condicionada à mesma capacidade |
| Fora da capacidade | Conceder/revogar autorização, criar contas Auth pela aplicação, apagar associados, admitir/demitir/readmitir, financeiro, portal, auditoria, importação e exportação em massa |

“CRUD” é usado no backlog como abreviação de cadastro administrativo. **Não inclui DELETE físico**: RF-003 enumera cadastro/edição/consulta/pesquisa, e retenção/encerramento pertencem a decisões próprias. Pesquisa avançada, filtros e paginação continuam na P2-03. Todos esses limites permanecem sem implementação neste refinamento.

## 5. Aplicação, banco e revogação

**DECISÃO TÉCNICA — aplicação:** criar futuramente um guard server-only com contrato equivalente a `requireMemberAdministration()`. Cada leitura protegida, Server Action e handler deve verificar identidade pelo mecanismo atual e consultar a concessão com cliente SSR/chave publicável e JWT da própria requisição. O guard não recebe `userId`, papel ou booleano do formulário. Erro de Auth, banco, timeout ou resposta malformada resulta em negação, nunca fallback permissivo. Anônimo segue para login; autenticado sem concessão recebe acesso negado genérico, sem consultar/expor o associado. Layout, Proxy e botão não substituem essa verificação em cada entrada. Não armazenar autorização em cache compartilhado, cookie próprio ou cache entre requisições; páginas/dados administrativos não devem ser publicados em cache/CDN.

**DECISÃO TÉCNICA — banco:** o desenho mínimo dispensa `SECURITY DEFINER`:

1. Tabela de concessões com RLS e revogação de privilégios herdados de `PUBLIC`, `anon` e `authenticated`; conceder a `authenticated` **somente SELECT**, com policy que permita ler exclusivamente a linha cujo `user_id = auth.uid()` e identidade não nula. Sem INSERT/UPDATE/DELETE, TRUNCATE, REFERENCES, TRIGGER ou policies de escrita para clientes, incluindo operadores autorizados.
2. Predicado reutilizável sem parâmetros de identidade, equivalente a “existe a minha concessão corrente”. Pode ser função SQL `SECURITY INVOKER`, sem SQL dinâmico, objetos qualificados e `search_path` fixo. Sua consulta à tabela usa a policy de leitura própria; essa policy não chama o predicado, evitando recursão. Se exposto como RPC para o guard, retorna somente booleano da própria sessão.
3. Criar função e ACL na mesma transação: retirar EXECUTE padrão de `PUBLIC`/`anon` e permitir somente ao papel necessário. Não dar CREATE em schemas aos clientes. Verificar privilégios efetivos, inclusive herdados. `SECURITY DEFINER` não é necessário; se uma implementação propuser usá-lo, exige justificativa/revisão específica de owner, search_path, grants e bypass antes de alterar este desenho.
4. No futuro incremento de acesso a `members`, conceder a `authenticated` somente SELECT, INSERT e UPDATE das colunas de negócio editáveis (`person_type`, `name`, `membership_category_code`, `email`, `phone`), junto das policies específicas: SELECT com USING do predicado; INSERT com WITH CHECK; UPDATE com USING e WITH CHECK. ID e timestamps continuam controlados pelo banco. Sem DELETE/TRUNCATE, sem `USING (true)` e sem grants de tabela inteira para escrita.
5. `membership_categories` recebe futuramente apenas SELECT condicionado ao mesmo predicado; nenhum privilégio de manutenção cotidiana. Grants e policies devem chegar juntos na migration que libera acesso, com testes positivos e negativos. **Nesta tarefa e na fundação isolada de autorização, as duas tabelas de negócio continuam fechadas.**

O grant a `authenticated` habilita a operação SQL, mas não significa acesso a todas as contas: RLS exige a concessão específica. O guard melhora a proteção de entrada e a resposta da aplicação; o banco é a barreira contra chamadas diretas. Uma chamada direta de operador autorizado está sujeita à mesma capacidade e constraints; validações que sejam invariantes de segurança/domínio não podem depender só da UI/Server Action. Views, RPCs e futuras rotas alternativas não podem contornar essa proteção.

**Revogação:** remover a linha e confirmar o commit. Uma consulta iniciada depois desse commit nega acesso mesmo com JWT ainda válido. RLS reconsulta a autorização na operação de dados, fechando a janela entre guard e consulta posterior. Pelo MVCC, não há promessa de interromper comando/transação já iniciado antes da revogação, nem de recolher dados já enviados ao navegador. Evitar transações longas e testar essa fronteira. Revogar a concessão é diferente de revogar sessão Auth; em perda/comprometimento de conta, remover a concessão primeiro e tratar recuperação/invalidação de sessão pelo canal operacional de Auth. `getClaims()` não é prova de ausência de revogação da sessão.

## 6. Bootstrap, concessão, revogação e recuperação

**RECOMENDAÇÃO operacional para o próximo incremento:** provisionamento fora da aplicação, sem endpoint de bootstrap e sem segredo administrativo no app. A pessoa que administra cadastro não recebe por isso credenciais de banco nem direito de conceder privilégios.

1. Antes de executar, registrar referência de aprovação, ambiente/destino, executor técnico, UUID destinatário e ação. No local usar somente conta fictícia criada pelo Studio local já documentado; conferir host/porta e identidade. Não executar este procedimento agora.
2. Com a migration de fundação aprovada, usar o [procedimento local parametrizado](../operations/member-administration.md) por conexão administrativa PostgreSQL controlada (não chave `service_role` da aplicação) para inserir a concessão em transação. Confirmar existência da conta pelo UUID, impedir duplicidade pela PK e registrar o resultado; não procurar automaticamente por e-mail ou “primeiro usuário”. O executor técnico é quem possui acesso operacional autorizado ao banco; **quem pode autorizar esse executor/destinatário é DP-015B**.
3. Confirmar o estado por leitura administrativa e testar, com a sessão do destinatário, apenas o booleano/guard da fundação. Verificar que outra conta continua negada e que `members`/categorias permanecem fechadas nessa etapa.
4. Para revogar, conferir destino/UUID e autorização, remover exatamente a concessão em transação, verificar ausência e testar a sessão anterior sem refresh. O processo deve registrar antes/depois, horário, executor e referência de aprovação em registro operacional de acesso restrito. GitHub registra a mudança estrutural e referência da evidência, sem nomes, e-mails, tokens, senhas ou dados reais de contas.
5. Em perda de acesso, revogar imediatamente a concessão da conta comprometida pelo canal operacional; recuperar Auth ou provisionar outra conta após aprovação e conferir novo UUID. Não recriar privilégio automaticamente por recuperação de senha, troca de e-mail ou existência de um associado.
6. **RECOMENDAÇÃO, não regra aprovada:** alertar ao revogar o último operador e exigir conferência operacional explícita para evitar acidente. Não criar trigger que impeça revogar a última conta comprometida. Zero operadores é seguro por padrão e recuperável pelo canal administrativo; a necessidade de disponibilidade contínua deve ser validada pela ACASA.

Preview/Production exigirão tarefa própria, ambiente aprovado, credenciais operacionais protegidas, acesso nominal ao provedor, evidência restrita e validação do destino. Não versionar concessões reais em migrations/seed, não copiar UUIDs do local e não criar credenciais ou ambientes remotos nesta tarefa. Provisionamento operacional não é uma tela de gestão de usuários; caso essa tela se torne necessária, será refinada na P2-05.

## 7. Threat model e testes esperados

Os cenários de concessão, isolamento, revogação e falha fechada aplicáveis à fundação estão implementados na Issue #24. Os cenários que exigem CRUD continuam como **aceite técnico da futura implementação**, condicionada a DP-015B. Em todos os casos, usar anônimo, conta comum A e conta autorizada B, com dados fictícios, e verificar ausência de dados/mutação, não somente código HTTP.

| Cenário | Aplicação/server-side | Banco/RLS | Evidência futura |
|---|---|---|---|
| Anônimo consulta associados | Negar antes de ler; login quando página | Sem grants de negócio para `anon` | Rota e Data API sem JWT não retornam dados |
| A tenta listar | Guard nega | Predicado falso | HTTP/UI e SELECT direto sem linhas expostas |
| A tenta consultar ID válido ou inventado | Mesma negação, sem informar existência | SELECT filtrado | Testar os dois IDs; nenhuma enumeração |
| A tenta criar | Action/handler nega | INSERT WITH CHECK rejeita | Contagem e conteúdo inalterados |
| A tenta editar ID de B | Negar, sem confiar no ID do browser | UPDATE USING/WITH CHECK | Nenhuma linha alterada; tratar zero linhas como ausência de sucesso |
| A ou B tenta atribuir privilégio a si/outro | Não existe entrada de concessão | Sem DML na tabela de concessões | INSERT/UPDATE/DELETE/UPSERT diretos rejeitados; SELECT não revela concessões alheias |
| B é revogado e reutiliza JWT | Nova consulta do guard nega | Consulta posterior ao commit nega | Mesmo token antes/depois, sem refresh, na aplicação e Data API |
| Cliente ignora UI e usa Supabase diretamente | Guard não participa dessa chamada | Mesma RLS e constraints obrigatórias | Testar REST/RPC com A e B; B só executa operações previstas |
| Browser manipula ID de usuário, booleano ou claim | Ignorar parâmetros de autorização; JWT precisa ser validado | `auth.uid()` derivado do token verificado, não de payload | JWT adulterado recusado; `user_metadata` administrativo não concede nada |
| Erro/timeout ao consultar concessão | Falhar fechado | Erro não produz acesso alternativo | Mock de falha e integração; nenhuma consulta permissiva |
| B tenta apagar associado ou editar catálogo | Sem fluxo autorizado | Sem grants/policies correspondentes | DELETE/TRUNCATE e escrita no catálogo rejeitados |
| Guard autoriza, depois ocorre revogação | Tratar negação da operação seguinte | Reconsulta no comando seguinte | Teste de duas conexões: commit de revogação antes da consulta de dados |

O pgTAP da fundação confirma FK/PK, RLS e ACL efetiva, leitura própria sem recursão, função invoker sem argumentos de identidade, predicado positivo de B, DML negado sobre concessões e preservação das constraints anteriores. Executa como roles clientes com contexto de JWT explícito, não somente como dono do banco; dono/superusuário pode contornar RLS. O futuro CRUD deverá acrescentar SELECT/INSERT/UPDATE válidos de B sobre as tabelas de negócio somente após DP-015B, mantendo EXECUTE negado a `PUBLIC`/`anon`.

Testes de integração devem exercitar o JWT real pela Data API, pois definir claims manualmente em pgTAP não testa assinatura. Testes server-side devem invocar cada entrada protegida independentemente do Proxy e conferir isolamento entre sessões/cache. O incremento de fundação testa concessão/guard e preserva os 59 testes atuais; o futuro incremento de dados substituirá explicitamente as asserções de “zero policy/zero grants” pelas garantias de acesso seletivo, sem simplesmente apagar proteção para fazer a suíte passar.

## 8. Fronteiras e sequência de entrega

| Etapa | Entrega especificável | Gate |
|---|---|---|
| Este refinamento | Documento, comparação, DT-015A, pacote DP-015B e rastreabilidade | Pode integrar com pendência explícita; nenhum acesso concedido |
| Fundação mínima local — Issue #24 | Migration só da concessão/predicado, guard sem telas de negócio, procedimento operacional parametrizado, testes fictícios positivos/negativos | **Implementada**; `members` e categorias continuam fechadas e DP-015B pendente |
| Incremento seguinte de P2-02 | Cadastro, consulta e edição com proteção do servidor e banco | **DP-015B respondida**, fundação verificada e critérios de aceite do cadastro registrados; não iniciar CRUD diretamente deste refinamento |
| P2-05 | Matriz futura, segregação de capacidades, eventual gestão de concessões | Requisitos reais aprovados; migrar concessões existentes sem ampliar direitos implicitamente |
| P2-06 | Auditoria de operações administrativas em runtime | Permanece própria; timestamps e registro operacional não cumprem RF-007/RNF-007 |

Ao evoluir para P2-05, manter um contrato de consulta de capacidade e migrar explicitamente as concessões para o modelo aprovado, preservando revogação e testes. Não conceder por herança acesso financeiro, ingresso ou gestão de usuários aos destinatários atuais. A proteção por campo, se necessária, exige novo refinamento; o recorte proposto é indivisível apenas para os dados mínimos já aprovados.

## 9. Pacote de decisão da ACASA — DP-015B (Aprovado em 2026-09-14)

A decisão organizacional **DP-015B** foi formalmente aprovada pelo responsável pelo produto em 2026-09-14 (Issue #26):

> A capacidade `manage_members` poderá ser concedida exclusivamente a pessoas individualmente designadas pela ACASA para manutenção cadastral.
>
> A concessão e a revogação dependem de autorização da Diretoria da ACASA, devidamente referenciada no procedimento operacional.
>
> Cargo, função ou simples participação na Diretoria ou em qualquer outro órgão da associação não concede acesso automaticamente.
>
> O executor técnico autorizado realiza a concessão ou revogação, mas não possui autoridade para decidir quem deve recebê-la.
>
> `manage_members` autoriza somente a consulta, cadastro e edição dos dados mínimos pertencentes à P2-02.
>
> Essa capacidade não concede, por implicação, poderes para admissão/desligamento de associados, situação cadastral, financeiro, solicitações de ingresso, gestão de usuários, concessão de permissões ou qualquer outro domínio.
>
> Eventuais níveis diferentes de acesso ou matriz mais ampla de permissões permanecem para a P2-05.

Com esta aprovação e a fundação DT-015A já consolidada, a decisão agregadora **DP-015 está resolvida**, autorizando a liberação do cadastro administrativo mínimo da P2-02 com proteção completa no servidor e no banco de dados.

## 10. Fontes oficiais consultadas em 2026-09-14

- [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security): grants/policies, identidade, diferença entre metadados de usuário e aplicação, JWT desatualizado.
- [Supabase — Custom claims e RBAC](https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac): alternativa de papéis e claims, não requisito deste projeto.
- [Supabase — Custom Access Token Hook](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook): execução antes da emissão do token.
- [Supabase — getClaims](https://supabase.com/docs/reference/javascript/auth-getclaims): validação de JWT e limite frente à sessão atual do Auth.
- [Supabase — updateUserById](https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid): gestão administrativa de dados de Auth como alternativa operacional.
- [Supabase — Database Functions](https://supabase.com/docs/guides/database/functions): invoker/definer e grants de execução.
- [PostgreSQL — CREATE FUNCTION](https://www.postgresql.org/docs/current/sql-createfunction.html): search_path seguro e retirada de EXECUTE padrão na mesma transação.
- [PostgreSQL — Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html): negação por padrão, owners e limites transacionais de policies com subconsultas.

As escolhas foram implementadas e verificadas somente na stack local/CI. Isso não equivale à aprovação organizacional da ACASA nem provisiona pessoa real.
