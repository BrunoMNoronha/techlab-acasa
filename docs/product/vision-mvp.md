# Visão do produto e MVP

## Status

**Baseline de produto aprovada para evolução do MVP.** Regras específicas ainda dependem das decisões registradas em `../delivery/risks-decisions.md`.

## Objetivo

O **TechLab+ ACASA** será uma plataforma web exclusiva da ACASA para centralizar a gestão administrativa da associação e o relacionamento digital com seus associados, reduzindo controles dispersos e oferecendo dados confiáveis, rastreáveis e acessíveis conforme autorização.

## Problemas a resolver

- cadastro de associados distribuído ou desatualizado;
- dificuldade para conhecer situação cadastral e financeira;
- controles manuais de cobranças e pagamentos;
- documentos e comunicações sem centralização;
- permissões administrativas pouco rastreáveis;
- baixa visibilidade de indicadores;
- dificuldade de auditoria e proteção adequada de dados pessoais;
- ingresso de novos associados sem fluxo digital centralizado.

## Público-alvo

- administração;
- diretoria;
- secretaria;
- financeiro/tesouraria;
- associados;
- candidatos a associado por meio de inscrição pública.

## Experiência esperada

- aplicação web responsiva;
- atenção especial ao uso desktop pela administração;
- atenção especial ao uso mobile pelo associado e candidato;
- apps Android/iOS nativos fora do MVP.

## Capacidades centrais do MVP

1. autenticação e controle de sessão;
2. usuários administrativos, perfis e permissões básicas;
3. inscrição pública de candidatos e análise administrativa da solicitação;
4. cadastro, edição, consulta, pesquisa e ativação/inativação de associados;
5. categorias e situação cadastral conforme valores reais da ACASA;
6. dashboard administrativo derivado dos requisitos aprovados;
7. controle financeiro administrativo de cobranças e pagamentos;
8. envio e análise de comprovantes manuais;
9. portal do associado para consulta dos próprios dados e situação;
10. documentos com controle de acesso;
11. comunicados internos;
12. auditoria de operações administrativas críticas.

## Escopo financeiro confirmado

O MVP terá:

- controle administrativo de cobranças;
- registro administrativo de pagamentos;
- consulta de histórico financeiro produzido pelo novo sistema;
- identificação de pendências/adimplência conforme regras que ainda serão detalhadas;
- envio de comprovantes pelo associado;
- análise administrativa de comprovantes, com resultado rastreável.

O MVP **não terá geração automática de Pix, boleto ou cartão por gateway**.

## Migração

O histórico do controle atual de pagamentos **não será migrado** para o novo sistema. A planilha existente poderá ser analisada apenas como referência para compreender como a ACASA registra pagamentos hoje.

A necessidade de migração de outros dados de associados ainda deve ser confirmada separadamente.

## Fora do MVP neste momento

Salvo decisão posterior devidamente registrada:

- apps nativos;
- Apple Wallet e Google Wallet;
- gateway de pagamentos/Pix/boleto/cartão automatizado;
- votação eletrônica e eleições;
- cursos/LMS, webinars e certificados;
- eventos avançados, credenciamento e check-in;
- cupons e programa de indicação;
- fluxo de caixa contábil completo e conciliação avançada;
- WhatsApp;
- API pública completa;
- multi-idioma;
- pagamentos internacionais;
- white-label;
- site institucional;
- arquitetura SaaS/multi-tenant.

## Referência funcional

A Softaliza para Associações pode ser usada para compreender possibilidades do domínio, comparar fluxos e levantar perguntas. Nenhuma funcionalidade, regra, interface, texto, arquitetura ou identidade visual observada na referência é automaticamente requisito do TechLab+ ACASA.

## Princípios de produto

- resolver primeiro o problema real da ACASA;
- minimizar dados coletados;
- separar situação cadastral de situação financeira;
- validar autorização no servidor;
- preservar rastreabilidade de operações críticas;
- evitar complexidade arquitetural antecipada;
- evoluir em incrementos pequenos e verificáveis.

## Critério de sucesso do MVP

O MVP será considerado funcionalmente bem-sucedido quando a ACASA puder operar em uma única aplicação o ciclo básico de ingresso e administração de associados: receber solicitações, analisar e transformar solicitações aprovadas em vínculos associativos conforme regras aprovadas, manter cadastro e categorias, controlar acesso, acompanhar situação financeira básica, receber/analisar comprovantes, disponibilizar documentos/comunicados e permitir que o associado consulte suas próprias informações, com segurança e auditoria compatíveis com o risco.

Os critérios objetivos de conclusão estão em `../delivery/definition-of-done.md`.
