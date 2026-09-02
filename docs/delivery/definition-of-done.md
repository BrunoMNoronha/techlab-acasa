# Definition of Done e conclusão do MVP

## Definition of Done — tarefa

Uma tarefa de implementação só pode ser considerada pronta quando, conforme aplicável:

1. requisito e critérios de aceite estão identificados;
2. regra de negócio necessária está aprovada ou a implementação não depende de hipótese;
3. código está pequeno, legível e coerente com a arquitetura vigente;
4. autorização e validação de entrada foram tratadas;
5. impactos de dados, privacidade e auditoria foram avaliados;
6. testes compatíveis com o risco foram criados/atualizados;
7. lint, typecheck, testes e build aplicáveis passam;
8. erros, loading e estados vazios relevantes foram tratados;
9. acessibilidade e responsividade foram consideradas no fluxo alterado;
10. documentação afetada foi atualizada;
11. diff foi revisado sem alterações acidentais;
12. CI passa ou qualquer exceção está explicitamente registrada e aceita;
13. PR contém contexto, escopo, testes, riscos e evidências suficientes;
14. deploy foi validado quando a tarefa o exige.

## Critérios objetivos para considerar o MVP concluído

O MVP somente deve ser declarado concluído quando todos os itens abaixo aplicáveis estiverem satisfeitos.

### Produto

- escopo organizacional definido;
- categorias e situações cadastrais usadas no sistema foram validadas pela ACASA;
- escopo financeiro implementado corresponde à decisão aprovada;
- fluxos administrativos essenciais possuem critérios de aceite cumpridos;
- portal do associado permite executar as consultas aprovadas sem expor dados de terceiros;
- funcionalidades explicitamente fora do MVP não foram introduzidas sem replanejamento.

### Funcional

- autenticação e recuperação de acesso funcionam conforme estratégia aprovada;
- permissões administrativas essenciais estão implementadas;
- associado pode ser cadastrado, consultado, editado e inativado/reativado conforme regras aprovadas;
- categorias e situação cadastral funcionam conforme domínio validado;
- financeiro básico aprovado funciona e mantém histórico necessário;
- documentos e comunicados respeitam regras de acesso;
- dashboard não apresenta indicadores sem fonte de dados confiável;
- operações críticas definidas possuem auditoria.

### Segurança e privacidade

- autorização é validada no servidor;
- testes negativos cobrem acessos horizontais/verticais relevantes;
- arquivos privados não ficam publicamente acessíveis por padrão;
- nenhum segredo está versionado;
- dados pessoais coletados possuem finalidade documentada;
- logs não expõem segredos ou dados pessoais desnecessários;
- dependências críticas e configuração de produção foram revisadas.

### Qualidade

- lint, typecheck, testes automatizados e build aplicáveis passam no CI;
- jornadas críticas possuem testes proporcionais ao risco;
- não existem erros conhecidos de severidade crítica/alta sem aceite explícito;
- interface principal foi validada em desktop e viewport mobile;
- fluxos principais atendem a baseline de acessibilidade definida para o projeto.

### Operação

- ambientes e processo de deploy estão documentados;
- observabilidade mínima de erros está ativa;
- estratégia de backup está configurada quando houver dados persistentes relevantes;
- restauração foi validada em nível compatível com o ambiente;
- migração, caso exista, possui reconciliação dos dados importados;
- documentação operacional essencial está sincronizada com a solução publicada.

### Aceite

- critérios de aceite das funcionalidades do MVP estão aprovados;
- pendências restantes estão classificadas como pós-MVP, risco aceito ou melhoria não bloqueadora;
- versão candidata foi validada no ambiente destinado ao aceite;
- release/deploy do MVP é rastreável a commits e PRs do repositório oficial.