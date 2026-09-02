# Processo de ingresso de novos associados

## Status

**Inscrição pública aprovada para o MVP.** O fluxo detalhado e as regras de negócio permanecem em refinamento.

## Objetivo

Permitir que uma pessoa solicite associação à ACASA por meio do sistema e que a administração analise a solicitação antes da criação/ativação do vínculo associativo.

## Princípios

- solicitação de associação não equivale a associado ativo;
- situação da solicitação deve ser separada da situação cadastral e financeira do associado;
- nenhum estado, documento ou critério de aprovação deve ser inventado;
- dados pessoais só devem ser coletados quando houver finalidade e necessidade justificadas;
- uploads devem ser privados e validados;
- ações administrativas relevantes devem ser auditáveis;
- uma solicitação aprovada deve reaproveitar dados válidos e evitar duplicidade desnecessária.

## Evidência do processo atual

A ficha cadastral atual da ACASA apresenta os seguintes campos:

- número de registro;
- data de nascimento;
- nome completo;
- CPF;
- RG;
- filiação;
- naturalidade;
- endereço residencial em outra cidade: CEP, rua, número, bairro e cidade;
- profissão;
- formação;
- endereço na Comunidade Aldeia;
- telefone de contato;
- e-mail;
- contato de emergência: nome e telefone;
- observações da administração;
- assinatura do associado;
- assinatura do presidente da ACASA;
- data do preenchimento;
- foto 3x4.

## Interpretação para o sistema

A lista acima é **evidência do formulário físico atual**, não especificação automática do formulário web.

Antes da implementação, cada campo deve ser classificado como:

1. obrigatório na solicitação pública;
2. opcional na solicitação pública;
3. coletado somente após aprovação;
4. exclusivamente administrativo;
5. desnecessário no novo processo.

Para dados de maior impacto de privacidade — especialmente CPF, RG, filiação, foto, data de nascimento e contato de emergência — deve existir finalidade registrada antes de torná-los obrigatórios.

## Fluxo mínimo já aprovado

1. candidato acessa o formulário público;
2. envia a solicitação com os dados aprovados;
3. sistema registra a solicitação separadamente do cadastro de associado;
4. administração consulta e analisa a solicitação conforme permissões;
5. a solicitação recebe um resultado/transição conforme estados que ainda serão definidos;
6. quando houver aprovação, o sistema cria ou vincula o associado conforme regras de deduplicação;
7. liberação de acesso e situação cadastral seguem regras próprias, ainda a detalhar.

Os nomes dos estados do passo 5 **não estão definidos**. Termos como `pendente`, `aprovada`, `rejeitada` ou `correção` só devem ser implementados após validação explícita.

## Decisões pendentes

- campos obrigatórios e opcionais;
- documentos/anexos necessários;
- finalidade de cada dado pessoal;
- estados e transições da solicitação;
- responsável ou perfil autorizado a analisar;
- critérios de aprovação/rejeição;
- necessidade de dupla validação ou assinatura;
- tratamento de solicitação duplicada;
- regra de identificação de pessoa existente;
- momento de criação do usuário de acesso;
- momento de definição da categoria;
- momento de ativação do associado;
- notificações ao candidato;
- retenção de solicitações rejeitadas/abandonadas.

## Critérios mínimos de segurança para implementação

- validação server-side de todos os campos;
- limites de tamanho e tipos permitidos para uploads;
- armazenamento privado de anexos;
- prevenção proporcional contra spam/abuso automatizado;
- mensagens de erro sem expor dados internos;
- proteção contra enumeração de cadastros existentes;
- logs/auditoria de análise administrativa;
- acesso administrativo pelo menor privilégio;
- política de retenção antes de produção.
