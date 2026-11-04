# QuimiPort — Gestão de Cargas Químicas Portuárias

> **Tech Challenge — Fase 2 · Pós Tech em Full Stack Development**
> API backend para gerenciamento de produtos e cargas químicas em contexto portuário, inspirado em operações logísticas do Porto de Santos.
> A documentação de domínio e arquitetura produzida na Fase 1 permanece em [`docs/`](docs).

---

## Contexto do Problema

O Porto de Santos é um dos principais pontos de movimentação de cargas do Brasil. Entre os diversos tipos de cargas, os **produtos químicos** exigem controle cuidadoso, documentação adequada, classificação de risco e acompanhamento técnico. Hoje, esse registro é **manual e descentralizado**, dificultando consulta rápida, acompanhamento de status, validação de regras de segurança antes da liberação e controle da documentação obrigatória e do responsável técnico.

## Descrição da Solução

O **QuimiPort** é uma API REST em Node.js que permite:

- Cadastrar, listar, atualizar e inativar **produtos químicos** (nome, número ONU, classe de risco, grupo de compatibilidade);
- Cadastrar **responsáveis técnicos** (registro em conselho — CRQ, CREA, etc.);
- Registrar **cargas químicas** associadas a produto ativo e responsável técnico;
- Anexar e validar **documentos obrigatórios** (FISPQ, Conhecimento de Embarque etc.);
- Solicitar **inspeções** e registrar resultados (reprovação bloqueia a carga automaticamente — RN-15);
- Controlar o **ciclo de vida da carga** por máquina de estados (análise, inspeção, liberação, bloqueio, movimentação, finalização, cancelamento), com histórico imutável de auditoria (RN-13/RN-17).

## Tecnologias Utilizadas

| Tecnologia | Uso |
|---|---|
| Node.js 22 + TypeScript (strict) | runtime e linguagem (ADR-004) |
| Fastify 5 | framework HTTP (ADR-010) |
| Prisma 6 + PostgreSQL 16 | persistência (ADR-009) |
| Vitest | testes unitários, de integração e e2e |
| Swagger/OpenAPI (@fastify/swagger) | documentação da API |
| Docker + docker compose | execução padronizada |
| GitHub Actions | CI (typecheck, lint, build, testes) |
| pino (via Fastify) | logs estruturados |

## Arquitetura

Clean Architecture com núcleo DDD (ADR-001); dependências apontando para dentro:

```
src/
├── domain/          → entidades ricas, agregados, VOs, máquina de estados (RN-XX)
├── application/     → casos de uso (UC-01 a UC-11), portas (interfaces), DTOs
├── infrastructure/  → repositórios Prisma (PostgreSQL) e em memória, mapeadores
├── interfaces/http/ → rotas Fastify, schemas de validação, error handler, Swagger
├── shared/          → erros tipados (ADR-005), branded types
└── tests/           → unit/, integration/, e2e/, fixtures/
```

Decisões completas: [`docs/arquitetura/decisoes-arquiteturais.md`](docs/arquitetura/decisoes-arquiteturais.md) (ADR-001 a ADR-011).
Critérios de aceite da fase: [`docs/fase-2/criterios-de-aceite.md`](docs/fase-2/criterios-de-aceite.md).
Modelagem de dados: [`docs/fase-2/modelagem-de-dados.md`](docs/fase-2/modelagem-de-dados.md).
Máquina de estados: [`docs/diagramas/fluxo-status-carga.md`](docs/diagramas/fluxo-status-carga.md).

## Como Executar Localmente

Pré-requisitos: Node.js ≥ 22, npm e PostgreSQL (ou Docker para subir apenas o banco).

```bash
npm install
cp .env.example .env                    # configure as variáveis (seção abaixo)
docker compose up -d db                 # sobe só o PostgreSQL (porta 5433 no host)
npx prisma migrate deploy --schema src/infrastructure/persistence/prisma/schema.prisma
npm run dev                             # http://localhost:3000 — Swagger em /docs
```

## Como Executar com Docker

```bash
docker compose up --build
```

Sobe a API (porta 3000) e o PostgreSQL; as migrações são aplicadas automaticamente na inicialização do container da API. Para encerrar: `docker compose down` (adicione `-v` para apagar os dados).

## Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|---|---|---|
| `DATABASE_URL` | Conexão PostgreSQL | `postgresql://quimiport:quimiport@localhost:5433/quimiport?schema=public` |
| `PORT` | Porta da API | `3000` |
| `HOST` | Interface de bind | `0.0.0.0` |
| `LOG_LEVEL` | Nível de log (pino) | `info` |

## Como Executar os Testes

```bash
npm test               # unitários + e2e (integração é pulada sem banco configurado)
npm run test:coverage  # com relatório de cobertura
RUN_DB_TESTS=1 npx vitest run src/tests/integration   # integração × PostgreSQL real
```

## Documentação da API

Swagger UI interativo em **`/docs`** (OpenAPI JSON em `/docs/json`) com a API em execução. Cada endpoint documenta parâmetros, request/response, códigos de erro e as regras RN-XX aplicadas.

## Principais Endpoints

### Produtos químicos
| Método | Rota | Descrição |
|---|---|---|
| POST | `/produtos-quimicos` | Criar produto (RN-08, RN-09) |
| GET | `/produtos-quimicos` | Listar produtos |
| GET | `/produtos-quimicos/:id` | Buscar por id |
| PUT | `/produtos-quimicos/:id` | Atualizar produto |
| PATCH | `/produtos-quimicos/:id/inativar` | Inativar (RN-10) |

### Responsáveis técnicos
| Método | Rota | Descrição |
|---|---|---|
| POST | `/responsaveis-tecnicos` | Cadastrar responsável |
| GET | `/responsaveis-tecnicos` | Listar |
| GET | `/responsaveis-tecnicos/:id` | Buscar por id |

### Cargas químicas
| Método | Rota | Descrição |
|---|---|---|
| POST | `/cargas-quimicas` | Registrar carga (RN-01, 02, 03, 11, 12) |
| GET | `/cargas-quimicas?status=` | Listar (filtro por status — UC-10) |
| GET | `/cargas-quimicas/:id` | Buscar por id |
| GET | `/cargas-quimicas/:id/historico` | Trilha de auditoria (UC-11) |
| POST | `/cargas-quimicas/:id/documentos` | Anexar documento (UC-04) |
| PATCH | `/cargas-quimicas/:id/documentos/:docId/validar` | Validar documento |
| POST | `/cargas-quimicas/:id/inspecoes` | Solicitar inspeção (UC-05) |
| PATCH | `/cargas-quimicas/:id/inspecoes/:inspId/resultado` | Resultado da inspeção (RN-15) |
| PATCH | `/cargas-quimicas/:id/status` | Transições operacionais (UC-08) |
| PATCH | `/cargas-quimicas/:id/liberar` | Liberar (RN-04) |
| PATCH | `/cargas-quimicas/:id/bloquear` | Bloquear (motivo obrigatório) |
| PATCH | `/cargas-quimicas/:id/cancelar` | Cancelar (RN-06, RN-16) |

### Erros

| HTTP | Quando |
|---|---|
| 400 | Payload inválido (formato/enum inválido) |
| 404 | Recurso inexistente |
| 409 | Conflito (nome de produto/código de carga duplicado) |
| 422 | Violação de regra de negócio — corpo traz `erro.codigo` com a RN (ex.: `RN-04`) |
| 500 | Erro interno |

## Banco de Dados

PostgreSQL, acessado via Prisma (justificativa na ADR-009). Modelo relacional: `produtos_quimicos`, `responsaveis_tecnicos`, `cargas_quimicas` (FKs para produto e responsável) e as entidades internas do agregado — `documentos_carga`, `inspecoes` e `eventos_historico` (append-only). Detalhes em [`docs/fase-2/modelagem-de-dados.md`](docs/fase-2/modelagem-de-dados.md).

## CI/CD

Pipeline em [`.github/workflows/ci.yml`](.github/workflows/ci.yml): instalação de dependências → geração do Prisma Client → typecheck → lint → build → testes unitários/e2e → migrações + testes de integração contra PostgreSQL (serviço do GitHub Actions). Deploy não é escopo desta fase.

## Equipe

Jose Mariano — rm376906
