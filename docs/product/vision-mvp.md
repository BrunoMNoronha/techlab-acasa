# Visão do produto e MVP

## Status

**Baseline de planejamento aprovada para evolução documental.** Regras específicas da ACASA ainda dependem das decisões registradas em `../delivery/risks-decisions.md`.

## Objetivo

O **TechLab+ ACASA** será uma plataforma web para centralizar a gestão administrativa da ACASA e o relacionamento digital com seus associados, reduzindo controles dispersos e oferecendo dados confiáveis, rastreáveis e acessíveis conforme autorização.

## Problemas a resolver

- cadastro de associados distribuído ou desatualizado;
- dificuldade para conhecer situação cadastral e financeira;
- controles manuais de cobranças e pagamentos;
- documentos e comunicações sem centralização;
- permissões administrativas pouco rastreáveis;
- baixa visibilidade de indicadores;
- dificuldade de auditoria e proteção adequada de dados pessoais.

## Público-alvo

- administração;
- diretoria;
- secretaria;
- financeiro/tesouraria;
- associados;
- candidatos a associado somente se o fluxo público de ingresso for aprovado.

## Experiência esperada

- aplicação web responsiva;
- atenção especial ao uso desktop pela administração;
- atenção especial ao uso mobile pelo associado;
- apps Android/iOS nativos fora do MVP.

## Capacidades centrais candidatas ao MVP

1. autenticação e controle de sessão;
2. usuários administrativos, perfis e permissões básicas;
3. cadastro, edição, consulta, pesquisa e ativação/inativação de associados;
4. categorias e situação cadastral;
5. dashboard administrativo derivado dos requisitos aprovados;
6. controle financeiro básico de cobranças e pagamentos;
7. portal do associado para consulta dos próprios dados e situação;
8. documentos com controle de acesso;
9. comunicados internos;
10. auditoria de operações administrativas críticas.

## Fora do MVP neste momento

Salvo decisão posterior devidamente registrada:

- apps nativos;
- Apple Wallet e Google Wallet;
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
- arquitetura SaaS/multi-tenant sem requisito confirmado.

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

O MVP será considerado funcionalmente bem-sucedido quando a ACASA puder operar o ciclo básico de administração de associados em uma única aplicação: manter cadastro e categorias, controlar acesso, acompanhar situação financeira básica, disponibilizar documentos/comunicados e permitir que o associado consulte suas próprias informações, com segurança e auditoria compatíveis com o risco.

Os critérios objetivos de conclusão estão em `../delivery/definition-of-done.md`.