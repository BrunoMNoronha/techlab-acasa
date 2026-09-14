# ADR-0002 — Fundação mínima de autorização administrativa de associados

- **Status:** aceita e implementada na fundação local em 2026-09-14.
- **Rastreabilidade:** DT-015A, Issues #22 e #24, RF-002/RF-003/RNF-002, P2-02 ↔ P2-05.

## Contexto

O futuro cadastro administrativo precisa distinguir contas autenticadas autorizadas sem criar um `ADMIN` global, permitir autoatribuição ou transformar categoria associativa/e-mail em permissão. A revogação deve valer na próxima operação sem depender da renovação de claim no JWT. A decisão organizacional sobre destinatários e autoridade de aprovação, DP-015B, não está tomada.

## Decisão

- representar somente `manage_members` em `public.member_administrators`, por UUID com FK `ON DELETE RESTRICT` para `auth.users(id)`;
- consultar a concessão corrente por `public.can_manage_members()`, função sem parâmetros, `SECURITY INVOKER`, `search_path` vazio e EXECUTE apenas para `authenticated`;
- permitir a `authenticated` apenas SELECT da própria linha, por RLS; não existir policy ou ACL de escrita para papéis clientes;
- exigir no servidor `requireMemberAdministration()`, reutilizando a identidade verificada por `getClaims()` e negando erros/respostas malformadas;
- manter concessão/revogação fora da aplicação, via PostgreSQL administrativo local parametrizado;
- validar por Vitest, pgTAP em roles clientes e integração com Auth/JWT/Data API reais.

## Consequências

O estado de autorização permanece pequeno, relacional e imediatamente revogável em uma nova operação. Há uma consulta ao banco por entrada protegida, aceita em troca da atualidade e do menor privilégio. O desenho pode ser migrado futuramente pela P2-05 sem ampliar direitos implicitamente.

Esta fundação não concede acesso de negócio: `members` e `membership_categories` continuam sem privilégios/policies para operadores. Não existe CRUD, usuário real, ambiente remoto ou segredo administrativo no runtime.

## Decisão pendente preservada no desenho original

**DP-015B ainda precisa definir quem, na ACASA, pode receber `manage_members` e quem possui autoridade organizacional para aprovar concessão/revogação.** Até essa resposta, o CRUD da P2-02 continua bloqueado.

## Atualização — Aprovação de DP-015B (2026-09-14, Issue #26)

Em 2026-09-14, o responsável pelo produto aprovou a decisão organizacional DP-015B:
- A capacidade `manage_members` é concedida exclusivamente a pessoas individualmente designadas pela ACASA para manutenção cadastral;
- Concessão e revogação dependem de autorização da Diretoria da ACASA, com referência documental;
- Cargo ou função na associação não confere acesso automático;
- O executor técnico apenas operacionaliza a concessão/revogação autorizada;
- A capacidade autoriza exclusivamente o cadastro mínimo da P2-02.

Com isso, a fundação técnica DT-015A passa a governar o acesso efetivo a `public.members` e `public.membership_categories` via grants mínimos de coluna/tabela e policies RLS condicionadas a `public.can_manage_members()`.
