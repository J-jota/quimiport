# Critérios de Aceite — Tech Challenge Fase 2

Critérios derivados do documento "POSTECH - FSDT - Tech Challenge - Fase 2". Cada critério refere-se aos requisitos do enunciado e às regras de negócio (RN-XX) e casos de uso (UC-XX) documentados na Fase 1.

Legenda de status: `[ ]` pendente · `[x]` atendido e verificado.

---

## CA-01 — API backend em Node.js

- [ ] API implementada em Node.js com TypeScript (`strict: true`), conforme ADR-004.
- [ ] Estrutura em camadas conforme ADR-001: `domain`, `application`, `infrastructure`, `interfaces` (controllers/rotas), `shared`.
- [ ] Framework escolhido e justificado no README.
- [ ] Erros de negócio mapeados para HTTP conforme ADR-005: `ValidationError` → 400, `NotFoundError` → 404, `ConflictError` → 409, `DomainError` → 422, erro interno → 500.

## CA-02 — Gestão de produtos químicos

- [ ] Produto contém: identificador, nome, descrição, número ONU (ou código simulado), classe de risco, grupo de compatibilidade, status (ativo/inativo), data de criação e data de atualização.
- [ ] `POST /produtos-quimicos` cria produto (UC-01).
- [ ] `GET /produtos-quimicos` lista produtos.
- [ ] `GET /produtos-quimicos/:id` busca por identificador; retorna 404 se inexistente.
- [ ] `PUT /produtos-quimicos/:id` atualiza produto.
- [ ] `PATCH /produtos-quimicos/:id/inativar` inativa produto (UC-02); inativação não afeta cargas já registradas.
- [ ] RN-08: cadastro sem nome é rejeitado (422).
- [ ] RN-09: cadastro sem classe de risco é rejeitado (422).
- [ ] Cadastro com status inválido é rejeitado (400/422).
- [ ] RN-10/RN-02: produto inativo não pode ser usado em novas cargas.

## CA-03 — Gestão de cargas químicas

- [ ] Carga contém: identificador, código da carga, produto químico associado, quantidade, unidade de medida, origem, destino, responsável técnico, documentação obrigatória, status, data de entrada, data de criação e data de atualização.
- [ ] `POST /cargas-quimicas` registra carga (UC-03), iniciando com status `REGISTRADA`.
- [ ] `GET /cargas-quimicas` lista cargas (com filtro por status — UC-10).
- [ ] `GET /cargas-quimicas/:id` busca por identificador; retorna 404 se inexistente.
- [ ] `PATCH /cargas-quimicas/:id/status` executa transições operacionais (UC-08).
- [ ] `PATCH /cargas-quimicas/:id/bloquear` bloqueia carga com motivo obrigatório (UC-07).
- [ ] `PATCH /cargas-quimicas/:id/liberar` libera carga (UC-06).
- [ ] `PATCH /cargas-quimicas/:id/cancelar` cancela carga (UC-09).
- [ ] RN-01: registro sem produto associado é rejeitado.
- [ ] RN-02: registro com produto inativo é rejeitado (422).
- [ ] RN-11: quantidade menor ou igual a zero é rejeitada (422).
- [ ] RN-12: registro sem responsável técnico é rejeitado (422).
- [ ] RN-04: liberação sem documentação obrigatória completa/válida é rejeitada (422).

## CA-04 — Máquina de estados da carga

Fluxo principal: `REGISTRADA → EM_ANALISE → EM_INSPECAO → LIBERADA → EM_MOVIMENTACAO → FINALIZADA`.

- [ ] Transições permitidas implementadas:
  - [ ] REGISTRADA → EM_ANALISE
  - [ ] REGISTRADA → CANCELADA
  - [ ] EM_ANALISE → EM_INSPECAO
  - [ ] EM_ANALISE → LIBERADA (com RN-04)
  - [ ] EM_ANALISE → CANCELADA
  - [ ] EM_INSPECAO → LIBERADA (com RN-04)
  - [ ] EM_INSPECAO → BLOQUEADA
  - [ ] EM_INSPECAO → CANCELADA
  - [ ] LIBERADA → EM_MOVIMENTACAO
  - [ ] LIBERADA → CANCELADA
  - [ ] EM_MOVIMENTACAO → FINALIZADA
  - [ ] BLOQUEADA → CANCELADA
- [ ] RN-05: BLOQUEADA → EM_MOVIMENTACAO é rejeitada (carga bloqueada não entra em movimentação).
- [ ] RN-06: CANCELADA é terminal — qualquer transição a partir dela é rejeitada.
- [ ] RN-16: FINALIZADA é terminal — qualquer transição a partir dela é rejeitada.
- [ ] RN-07: EM_INSPECAO → FINALIZADA sem passar por LIBERADA é rejeitada.
- [ ] Transições proibidas do enunciado rejeitadas: CANCELADA → LIBERADA; FINALIZADA → EM_MOVIMENTACAO; BLOQUEADA → EM_MOVIMENTACAO; REGISTRADA → FINALIZADA; LIBERADA → REGISTRADA.
- [ ] RN-13: toda transição registra evento no histórico (data, status anterior/novo, ator, motivo).
- [ ] RN-17: histórico é imutável e consultável (UC-11).
- [ ] Transições permitidas e proibidas documentadas (tabela/diagrama).

## CA-05 — Banco de dados e modelagem

- [ ] Banco de dados escolhido e justificado no README (tipo de dado, relacionamentos, evolução futura).
- [ ] Persistência de produtos químicos e cargas químicas.
- [ ] Relacionamento/associação entre carga e produto químico.
- [ ] Consultas básicas e atualizações funcionando.
- [ ] Inativação/cancelamento lógico (sem remoção física).
- [ ] Modelagem de dados documentada (tabelas/campos/chaves ou estrutura de documentos): como produtos e cargas são armazenados, como se relacionam, como o status é controlado e como evoluirá nas próximas fases.

## CA-06 — Docker

- [ ] `Dockerfile` da aplicação funcional.
- [ ] `docker-compose.yml` com serviço da API + serviço do banco de dados.
- [ ] Aplicação sobe com `docker compose up` sem configuração manual.
- [ ] Instruções de execução com Docker no README.

## CA-07 — Documentação da API

- [ ] Documentação acessível (Swagger/Redoc/Postman/Insomnia) contendo: lista de endpoints, métodos HTTP, parâmetros esperados, exemplos de request e response, códigos de erro possíveis e descrição das principais regras aplicadas.

## CA-08 — Logs e observabilidade inicial

- [ ] Logs estruturados registrando: requisições recebidas, erros de validação, erros internos, criação de produtos, registro de cargas, alterações de status, bloqueios e liberações.
- [ ] (Diferencial opcional) Prometheus/Grafana.

## CA-09 — CI/CD com GitHub Actions

- [ ] Pipeline executando: instalação de dependências, verificação de build/compilação (`tsc --noEmit`), execução de testes e validação básica do projeto (lint).
- [ ] Deploy não é obrigatório nesta fase.

## CA-10 — Testes automatizados

Cobertura mínima exigida pelo enunciado (unitários e/ou integração, conforme plano de qualidade):

- [ ] Cadastro de produto químico (caminho feliz).
- [ ] Bloqueio de cadastro de produto sem nome (RN-08).
- [ ] Bloqueio de cadastro de produto sem classe de risco (RN-09).
- [ ] Registro de carga química (caminho feliz).
- [ ] Bloqueio de carga com produto químico inativo (RN-02/RN-10).
- [ ] Bloqueio de carga com quantidade ≤ 0 (RN-11).
- [ ] Bloqueio de liberação sem documentação obrigatória (RN-04).
- [ ] Atualização de status da carga.
- [ ] Validação das transições permitidas de status (cada linha da tabela de transições).
- [ ] Bloqueio das transições proibidas de status.
- [ ] Cancelamento de carga.
- [ ] Tentativa de movimentar carga bloqueada (RN-05).

## CA-11 — Organização da arquitetura

- [ ] Coerência com o planejamento da Fase 1: camada de domínio, aplicação, infraestrutura, interfaces/controllers, repositórios, services, casos de uso, DTOs, validações e tratamento de erros.
- [ ] Domínio sem dependências de framework/banco/HTTP (regra de dependência para dentro).
- [ ] Regras RN-XX concentradas no domínio (modelo rico — ADR-002); casos de uso apenas orquestram.

## CA-12 — API além de REST (diferencial opcional)

- [ ] (Opcional) Query GraphQL ou método gRPC de escopo limitado e demonstrativo, documentado (motivo, cenário de uso, funcionamento), sem substituir a API REST.

## CA-13 — README

- [ ] Nome do projeto, descrição da solução e contexto do problema.
- [ ] Tecnologias utilizadas.
- [ ] Como executar localmente e com Docker.
- [ ] Como configurar variáveis de ambiente.
- [ ] Como executar os testes.
- [ ] Como acessar a documentação da API.
- [ ] Descrição dos principais endpoints.
- [ ] Descrição do banco de dados utilizado (com justificativa).
- [ ] Decisões arquiteturais.
- [ ] Integrantes do grupo.
