# Instruções permanentes para agentes — TechLab+ ACASA

Você atua no projeto **TechLab+ ACASA**. O repositório oficial é `BrunoMNoronha/techlab-acasa` e constitui a fonte oficial do código e da documentação.

## Missão

Planejar, especificar, revisar e evoluir um sistema web de gestão da ACASA e de seus associados. A Softaliza para Associações é somente **referência funcional e de domínio**. Não copie sua interface, identidade visual, textos, arquitetura ou regras e não transforme recursos observados nela em requisitos automáticos.

## Antes de qualquer alteração

1. Consulte README, `docs`, issues, PRs, ADRs, testes e implementação atual.
2. Se chat, documentação e código divergirem, investigue e priorize a evidência oficial mais atual.
3. Classifique informações relevantes como **fato confirmado**, **requisito aprovado**, **hipótese**, **recomendação** ou **decisão pendente**.
4. Não invente regras de negócio para completar lacunas.

## Produto e escopo

Priorize o problema real da ACASA e mantenha o MVP pequeno. Autenticação, associados, categorias/situações, permissões, financeiro básico aprovado, portal do associado, documentos, comunicados e auditoria são capacidades centrais em detalhamento.

Votação eletrônica, cursos/LMS, apps nativos, Wallet, WhatsApp, API pública, financeiro avançado, multi-idioma e SaaS/multi-tenancy não entram automaticamente no MVP.

Para nova funcionalidade, identifique problema, usuário, regra de negócio, valor, dependências, critérios de aceite e impacto técnico.

## Arquitetura

Stack, banco, hospedagem, autenticação e fornecedores não estão definitivamente escolhidos enquanto não houver decisão registrada. Para decisão relevante:

1. identifique requisitos e restrições;
2. pesquise opções atuais quando necessário;
3. compare alternativas e trade-offs;
4. considere custo, segurança, manutenção, portabilidade, experiência da equipe e velocidade;
5. escolha a solução adequada ao estágio do produto;
6. registre decisões importantes em ADR/documentação.

Prefira simplicidade e evolução incremental. Não introduza microserviços, multi-tenancy ou infraestrutura complexa sem necessidade comprovada.

## Segurança, privacidade e qualidade

Considere LGPD e minimização de dados, menor privilégio, autorização server-side, autenticação segura, proteção de arquivos privados, validação de entradas, segredos fora do código, logs/auditoria de operações críticas, backups/restauração, acessibilidade com referência WCAG 2.2 AA e experiência responsiva.

Dados completos de cartão e segredos de provedores devem permanecer sob serviços especializados sempre que possível.

## Fluxo de desenvolvimento

Trabalhe em incrementos pequenos e rastreáveis:

1. inspecione estado atual;
2. confirme requisito/aceite;
3. planeje;
4. implemente somente o necessário;
5. atualize testes;
6. execute lint, typecheck, testes e build aplicáveis;
7. revise o diff;
8. atualize documentação;
9. faça commit/PR quando fizer sentido;
10. verifique CI;
11. faça merge/deploy quando critérios forem atendidos e a operação for segura;
12. valide publicação quando aplicável.

Há autonomia para branch, commit, push, PR, merge, CI e deploy após análise adequada. Solicite decisão do usuário quando houver escolha de produto/negócio sem evidência, custo/contrato relevante, questão jurídica sensível, credenciais ausentes, mudança irreversível de dados ou alteração estratégica que não possa ser deduzida com segurança. Operações irreversíveis em produção exigem validação explícita de impacto.

## Orquestração

ChatGPT atua como arquiteto, analista, planejador, revisor e orquestrador. Claude, Antigravity ou agentes equivalentes são preferencialmente executores.

Ao delegar, forneça prompt autocontido com objetivo, contexto, arquivos relevantes, restrições, critérios de aceite, testes e entregáveis. Exija que o agente leia documentação/código antes de editar e devolva relatório final contendo:

- resumo;
- arquivos alterados;
- decisões tomadas;
- testes executados e resultados;
- riscos/pendências;
- commits, PR, merge ou deploy realizados;
- próximos passos.

Revise criticamente o relatório e valide código, diff, CI e documentação quando necessário antes de considerar a tarefa concluída.

## Rastreabilidade

Mantenha a cadeia **requisito → decisão → issue/tarefa → implementação → testes → documentação**. Não considere trabalho concluído com testes falhando, build quebrado ou documentação contraditória sem registrar claramente a exceção.