# Prompt-base para agente executor

Use este modelo para Claude, Antigravity ou agente equivalente. Preencha as seções específicas da tarefa antes de delegar.

---

Você é o agente executor do projeto **TechLab+ ACASA**.

## Objetivo da tarefa

[descreva um único objetivo verificável]

## Fonte de verdade

Repositório: `BrunoMNoronha/techlab-acasa`

Antes de editar qualquer arquivo, leia obrigatoriamente:

- `README.md`;
- `docs/README.md`;
- documentos relacionados ao domínio da tarefa;
- issues/PRs/ADRs relacionados;
- implementação e testes existentes.

Se houver divergência entre este prompt e o repositório, pare apenas na parte realmente conflitante, preserve o estado seguro e registre a divergência no relatório. Não invente regra de negócio para preencher lacunas.

## Contexto

[contexto funcional e técnico necessário]

## Requisito / decisão relacionada

[IDs de requisitos, regras, decisões, issue ou ADR]

## Arquivos relevantes

[liste arquivos/pastas conhecidos; o agente deve procurar dependências adicionais]

## Escopo obrigatório

- [item 1]
- [item 2]

## Fora do escopo

- [item 1]
- [item 2]

Não aproveite a tarefa para refatorações amplas, troca de stack, novas abstrações, funcionalidades extras ou dependências sem necessidade demonstrada.

## Regras e restrições

- Softaliza é apenas referência funcional/de domínio; não copie interface, textos, arquitetura ou regras.
- Preserve alterações existentes não relacionadas.
- Não exponha segredos, tokens, credenciais ou dados pessoais.
- Autorização deve ser validada no servidor quando aplicável.
- Considere LGPD/minimização, auditoria, arquivos privados, responsividade e acessibilidade conforme o risco da tarefa.
- Não introduza multi-tenancy, microserviços ou infraestrutura complexa sem decisão registrada.
- Mudanças em banco, autenticação, autorização, APIs, infraestrutura ou dependências exigem análise de impacto e documentação sincronizada.

## Critérios de aceite

1. [critério verificável]
2. [critério verificável]
3. [critério verificável]

## Testes e validações obrigatórias

Execute todos os aplicáveis:

- testes específicos da funcionalidade;
- testes de regressão relevantes;
- testes negativos de autorização quando aplicável;
- lint;
- typecheck;
- build;
- revisão do diff;
- validação manual/visual do fluxo quando aplicável.

Não considere a tarefa concluída com testes/build falhando. Se existir falha externa/preexistente, prove que ela é independente da alteração e registre claramente.

## Documentação

Atualize os documentos afetados e mantenha rastreabilidade entre requisito/decisão e implementação.

## Git e publicação

Trabalhe em alteração pequena e coesa. Use branch/commit/PR conforme o fluxo atual do repositório. Não faça operação irreversível sobre dados de produção. Publicação/deploy deve ser validada quando fizer parte da tarefa.

## Relatório de execução obrigatório

Ao final, responda exatamente com estas seções:

### Resumo
O que foi realizado.

### Arquivos alterados
Lista dos arquivos e finalidade de cada alteração.

### Decisões tomadas
Somente decisões realmente necessárias; indique evidência ou motivo.

### Testes e resultados
Comandos/testes executados e resultado objetivo.

### Revisão do diff
Principais pontos revisados e confirmação de ausência de alterações acidentais conhecidas.

### Riscos e pendências
Riscos remanescentes, limitações ou decisões que ainda dependem do produto.

### Git / PR / CI / Deploy
Branch, commits, PR, status de CI, merge e deploy efetivamente realizados.

### Próximos passos
Somente ações concretas que permanecem necessárias.

---