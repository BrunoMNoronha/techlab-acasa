# Segurança, privacidade e auditoria

## Objetivo

Estabelecer requisitos mínimos desde o início, independentemente da stack escolhida.

## Identidade e autenticação

- utilizar autenticação segura e recuperação de acesso controlada;
- nunca armazenar senhas em texto puro;
- impedir enumeração e exposição desnecessária de informações de conta quando possível;
- definir política de sessão compatível com risco;
- manter possibilidade futura de MFA sem tornar MFA requisito automático do MVP.

## Autorização

- validar autorização no servidor;
- aplicar menor privilégio;
- não confiar em esconder botões ou rotas no frontend como controle de segurança;
- separar permissões administrativas por capacidade relevante;
- impedir que associado consulte dados de outro associado por manipulação de identificadores.

## Dados pessoais e LGPD

- coletar somente dados necessários e com finalidade definida;
- justificar CPF, nascimento, endereço, fotografia e outros dados antes de incluí-los no modelo;
- limitar visualização por função;
- registrar políticas de retenção e descarte por tipo de dado antes de automatizar exclusões;
- permitir evolução para atendimento de direitos do titular;
- evitar dados pessoais sensíveis sem necessidade demonstrada.

## Arquivos

- usar armazenamento apropriado para documentos, comprovantes e anexos;
- arquivos privados devem exigir autorização para acesso;
- preferir mecanismos como URLs temporárias/assinadas quando compatíveis com a plataforma;
- validar tipo, tamanho e metadados relevantes de uploads;
- definir política de malware/antivírus de acordo com o risco e os tipos de arquivo aceitos;
- evitar nomes ou caminhos que exponham dados pessoais desnecessariamente.

## Financeiro

- não armazenar dados completos de cartão quando puderem permanecer com provedor especializado;
- validar autenticidade de callbacks/webhooks caso integração de pagamento seja aprovada;
- tornar alterações financeiras relevantes auditáveis;
- diferenciar registro administrativo, comprovante enviado e pagamento confirmado.

## Auditoria

Para operações críticas, registrar quando aplicável:

- usuário/ator;
- ação;
- entidade e identificador afetado;
- data/hora;
- resultado;
- contexto mínimo necessário para investigação, evitando registrar segredos ou excesso de dados pessoais.

A trilha de auditoria não deve permitir alteração ordinária pelo mesmo fluxo usado para editar dados de negócio.

## Segredos e infraestrutura

- segredos fora do repositório;
- variáveis sensíveis geridas pela plataforma/ambiente;
- HTTPS em ambientes publicados;
- dependências mantidas e justificadas;
- backups e restauração validados conforme criticidade;
- logs de erro sem exposição de tokens, senhas ou dados pessoais desnecessários.

**Implementado em P1-05** (detalhes em [`../operations/environments-observability.md`](../operations/environments-observability.md)):

- logger server-side estruturado com allow-list de campos: nunca recebe request, headers, cookies, claims, usuário, erro completo ou `process.env`; mensagem de erro só em desenvolvimento, stack nunca;
- `onRequestError` do Next.js encaminha erros do servidor ao logger apenas com template da rota, tipo de rota, método, nome do erro e `digest`;
- páginas de erro genéricas (`error.tsx`, `global-error.tsx`) sem detalhes técnicos;
- `.env*` reais ignorados pelo Git, `npm run check:secrets` na CI, GitHub secret scanning e push protection ativos (camada adicional, com limitações documentadas) e procedimento de resposta a vazamento com revogação obrigatória;
- validação de configuração que recusa chave secreta em variável `NEXT_PUBLIC_*` e não ecoa valores nas mensagens.

## Desenvolvimento seguro

Toda funcionalidade relevante deve considerar:

1. dados pessoais envolvidos;
2. ator autorizado;
3. validações de entrada;
4. possibilidade de IDOR/acesso horizontal;
5. impacto de alteração ou exclusão;
6. necessidade de auditoria;
7. tratamento de erros;
8. testes de autorização compatíveis com o risco.

## Pendências que afetam segurança

- modelo ACASA única x SaaS;
- provedor de autenticação: **decidido** (Supabase Auth, ADR-0001); política de sessão e provedor de e-mail transacional de produção seguem pendentes;
- matriz real de permissões;
- campos pessoais necessários;
- política de retenção;
- escopo financeiro;
- armazenamento de arquivos;
- RPO/RTO e estratégia de backup.