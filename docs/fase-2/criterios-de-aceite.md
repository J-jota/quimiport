# Critérios de Aceite — Tech Challenge Fase 2

Critérios derivados do documento "POSTECH - FSDT - Tech Challenge - Fase 2". Cada critério refere-se aos requisitos do enunciado e às regras de negócio (RN-XX) e casos de uso (UC-XX) documentados na Fase 1.

Legenda de status: `[ ]` pendente · `[x]` atendido e verificado.

---

## CA-01 — API backend em Node.js

- [x] API implementada em Node.js com TypeScript (`strict: true`), conforme ADR-004.
- [x] Estrutura em camadas conforme ADR-001: `domain`, `application`, `infrastructure`, `interfaces` (controllers/rotas), `shared`.
- [x] Framework escolhido e justificado no README.
- [x] Erros de negócio mapeados para HTTP conforme ADR-005: `ValidationError` → 400, `NotFoundError` → 404, `ConflictError` → 409, `DomainError` → 422, erro interno → 500.

## CA-02 — Gestão de produtos químicos

- [x] Produto contém: identificador, nome, descrição, número ONU (ou código simulado), classe de risco, grupo de compatibilidade, status (ativo/inativo), data de criação e data de atualização.
- [x] `POST /produtos-quimicos` cria produto (UC-01).
- [x] `GET /produtos-quimicos` lista produtos.
- [x] `GET /produtos-quimicos/:id` busca por identificador; retorna 404 se inexistente.
- [x] `PUT /produtos-quimicos/:id` atualiza produto.
- [x] `PATCH /produtos-quimicos/:id/inativar` inativa produto (UC-02); inativação não afeta cargas já registradas.
- [x] RN-08: cadastro sem nome é rejeitado (422).
- [x] RN-09: cadastro sem classe de risco é rejeitado (422).
- [x] Cadastro com status inválido é rejeitado (400/422).
- [x] RN-10/RN-02: produto inativo não pode ser usado em novas cargas.

## CA-03 — Gestão de cargas químicas

- [x] Carga contém: identificador, código da carga, produto químico associado, quantidade, unidade de medida, origem, destino, responsável técnico, documentação obrigatória, status, data de entrada, data de criação e data de atualização.
- [x] `POST /cargas-quimicas` registra carga (UC-03), iniciando com status `REGISTRADA`.
- [x] `GET /cargas-quimicas` lista cargas (com filtro por status — UC-10).
- [x] `GET /cargas-quimicas/:id` busca por identificador; retorna 404 se inexistente.
- [x] `PATCH /cargas-quimicas/:id/status` executa transições operacionais (UC-08).
- [x] `PATCH /cargas-quimicas/:id/bloquear` bloqueia carga com motivo obrigatório (UC-07).
- [x] `PATCH /cargas-quimicas/:id/liberar` libera carga (UC-06).
- [x] `PATCH /cargas-quimicas/:id/cancelar` cancela carga (UC-09).
- [x] RN-01: registro sem produto associado é rejeitado.
- [x] RN-02: registro com produto inativo é rejeitado (422).
- [x] RN-11: quantidade menor ou igual a zero é rejeitada (422).
- [x] RN-12: registro sem responsável técnico é rejeitado (422).
- [x] RN-04: liberação sem documentação obrigatória completa/válida é rejeitada (422).

## CA-04 — Máquina de estados da carga

Fluxo principal: `REGISTRADA → EM_ANALISE → EM_INSPECAO → LIBERADA → EM_MOVIMENTACAO → FINALIZADA`.

- [x] Transições permitidas implementadas:
  - [x] REGISTRADA → EM_ANALISE
  - [x] REGISTRADA → CANCELADA
  - [x] EM_ANALISE → EM_INSPECAO
  - [x] EM_ANALISE → LIBERADA (com RN-04)
  - [x] EM_ANALISE → CANCELADA
  - [x] EM_INSPECAO → LIBERADA (com RN-04)
  - [x] EM_INSPECAO → BLOQUEADA
  - [x] EM_INSPECAO → CANCELADA
  - [x] LIBERADA → EM_MOVIMENTACAO
  - [x] LIBERADA → CANCELADA
  - [x] EM_MOVIMENTACAO → FINALIZADA
  - [x] BLOQUEADA → CANCELADA
- [x] RN-05: BLOQUEADA → EM_MOVIMENTACAO é rejeitada (carga bloqueada não entra em movimentação).
- [x] RN-06: CANCELADA é terminal — qualquer transição a partir dela é rejeitada.
- [x] RN-16: FINALIZADA é terminal — qualquer transição a partir dela é rejeitada.
- [x] RN-07: EM_INSPECAO → FINALIZADA sem passar por LIBERADA é rejeitada.
- [x] Transições proibidas do enunciado rejeitadas: CANCELADA → LIBERADA; FINALIZADA → EM_MOVIMENTACAO; BLOQUEADA → EM_MOVIMENTACAO; REGISTRADA → FINALIZADA; LIBERADA → REGISTRADA.
- [x] RN-13: toda transição registra evento no histórico (data, status anterior/novo, ator, motivo).
- [x] RN-17: histórico é imutável e consultável (UC-11).
- [x] Transições permitidas e proibidas documentadas (tabela/diagrama).

## CA-05 — Banco de dados e modelagem

- [x] Banco de dados escolhido e justificado no README (tipo de dado, relacionamentos, evolução futura).
- [x] Persistência de produtos químicos e cargas químicas.
- [x] Relacionamento/associação entre carga e produto químico.
- [x] Consultas básicas e atualizações funcionando.
- [x] Inativação/cancelamento lógico (sem remoção física).
- [x] Modelagem de dados documentada (tabelas/campos/chaves ou estrutura de documentos): como produtos e cargas são armazenados, como se relacionam, como o status é controlado e como evoluirá nas próximas fases.

## CA-06 — Docker

- [x] `Dockerfile` da aplicação funcional.
- [x] `docker-compose.yml` com serviço da API + serviço do banco de dados.
- [x] Aplicação sobe com `docker compose up` sem configuração manual.
- [x] Instruções de execução com Docker no README.

## CA-07 — Documentação da API

- [x] Documentação acessível (Swagger/Redoc/Postman/Insomnia) contendo: lista de endpoints, métodos HTTP, parâmetros esperados, exemplos de request e response, códigos de erro possíveis e descrição das principais regras aplicadas.

## CA-08 — Logs e observabilidade inicial

- [x] Logs estruturados registrando: requisições recebidas, erros de validação, erros internos, criação de produtos, registro de cargas, alterações de status, bloqueios e liberações.
- [ ] (Diferencial opcional) Prometheus/Grafana — **não implementado** (logs organizados atendem o mínimo).

## CA-09 — CI/CD com GitHub Actions

- [x] Pipeline executando: instalação de dependências, verificação de build/compilação (`tsc --noEmit`), execução de testes e validação básica do projeto (lint).
- [x] Deploy não é obrigatório nesta fase.

## CA-10 — Testes automatizados

Cobertura mínima exigida pelo enunciado (unitários e/ou integração, conforme plano de qualidade):

- [x] Cadastro de produto químico (caminho feliz).
- [x] Bloqueio de cadastro de produto sem nome (RN-08).
- [x] Bloqueio de cadastro de produto sem classe de risco (RN-09).
- [x] Registro de carga química (caminho feliz).
- [x] Bloqueio de carga com produto químico inativo (RN-02/RN-10).
- [x] Bloqueio de carga com quantidade ≤ 0 (RN-11).
- [x] Bloqueio de liberação sem documentação obrigatória (RN-04).
- [x] Atualização de status da carga.
- [x] Validação das transições permitidas de status (cada linha da tabela de transições).
- [x] Bloqueio das transições proibidas de status.
- [x] Cancelamento de carga.
- [x] Tentativa de movimentar carga bloqueada (RN-05).

## CA-11 — Organização da arquitetura

- [x] Coerência com o planejamento da Fase 1: camada de domínio, aplicação, infraestrutura, interfaces/controllers, repositórios, services, casos de uso, DTOs, validações e tratamento de erros.
- [x] Domínio sem dependências de framework/banco/HTTP (regra de dependência para dentro).
- [x] Regras RN-XX concentradas no domínio (modelo rico — ADR-002); casos de uso apenas orquestram.

## CA-12 — API além de REST (diferencial opcional)

- [ ] (Opcional) Query GraphQL ou método gRPC — **não implementado nesta iteração** (diferencial; a API REST obrigatória está completa).

## CA-13 — README

- [x] Nome do projeto, descrição da solução e contexto do problema.
- [x] Tecnologias utilizadas.
- [x] Como executar localmente e com Docker.
- [x] Como configurar variáveis de ambiente.
- [x] Como executar os testes.
- [x] Como acessar a documentação da API.
- [x] Descrição dos principais endpoints.
- [x] Descrição do banco de dados utilizado (com justificativa).
- [x] Decisões arquiteturais.
- [x] Integrantes do grupo.
