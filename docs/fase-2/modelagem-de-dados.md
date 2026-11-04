# Modelagem de Dados — Fase 2

Banco: **PostgreSQL** (relacional), acesso via **Prisma ORM** (ADR-009). Migrações versionadas em `src/infrastructure/persistence/prisma/migrations/`.

## Visão geral (DER textual)

```
produtos_quimicos ──1:N── cargas_quimicas ──1:N── documentos_carga
                       │                  ├──1:N── inspecoes
responsaveis_tecnicos ─1:N──                └──1:N── eventos_historico
```

## Tabelas

### produtos_quimicos
| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid (PK) | identificador |
| nome | varchar (unique) | RN-08; unicidade do catálogo (409 em duplicidade) |
| descricao | varchar (null) | |
| numeroOnu | varchar | formato "ONU 9999" validado no domínio |
| classeRisco | varchar | RN-09; enum ClasseRisco validado no domínio |
| grupoCompatibilidade | varchar | grupos de compatibilidade (A–S, inspirado no IMDG) |
| ativo | boolean | RN-10: inativo não entra em novas cargas (inativação lógica, sem delete) |
| criadoEm / atualizadoEm | timestamptz | |

### responsaveis_tecnicos
| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid (PK) | |
| nome | varchar | |
| conselho + numeroRegistro | varchar | unique composto (ex.: CRQ-12345) |
| especialidade | varchar (null) | |
| ativo | boolean | |
| criadoEm / atualizadoEm | timestamptz | |

### cargas_quimicas
| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid (PK) | |
| codigo | varchar (unique) | código da carga (409 em duplicidade) |
| produtoQuimicoId | uuid (FK → produtos_quimicos) | RN-01: associação obrigatória |
| quantidade | decimal(14,3) | RN-11 validada no domínio (> 0) |
| unidadeMedida | varchar | KG, TON, LITRO, M3 |
| classificacaoRisco | varchar | RN-03: herdada do produto no registro |
| responsavelTecnicoId | uuid (FK → responsaveis_tecnicos) | RN-12 |
| origem / destino | varchar | |
| status | varchar | enum StatusCarga; índice para o filtro de listagem |
| dataEntrada | timestamptz | |
| criadoEm / atualizadoEm | timestamptz | |

### documentos_carga (entidade interna do agregado)
| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid (PK) | |
| cargaId | uuid (FK → cargas_quimicas, ON DELETE CASCADE) | composição |
| tipo | varchar | FISPQ, CONHECIMENTO_EMBARQUE, CERTIFICADO_INSPECAO, ALVARA |
| numero | varchar | |
| dataEmissao / dataValidade | timestamptz (null) | RN-14: vencido não conta para liberação |
| validado | boolean | validação do analista (RN-04) |
| urlArquivo | varchar (null) | referência futura a storage |

### inspecoes (entidade interna do agregado)
| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid (PK) | |
| cargaId | uuid (FK, CASCADE) | |
| motivo | varchar | |
| dataSolicitacao / dataConclusao | timestamptz (null) | |
| resultado | varchar | PENDENTE, APROVADA, REPROVADA (RN-15) |
| inspetor | varchar (null) | |

### eventos_historico (append-only — RN-17)
| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid (PK) | |
| cargaId | uuid (FK, CASCADE) | índice composto (cargaId, dataHora) |
| dataHora | timestamptz | |
| statusAnterior / statusNovo | varchar (null) | null apenas no evento de registro |
| ator / motivo | varchar | RN-13 |

## Decisões

1. **Relacionamento carga ↔ produto por FK**: a carga referencia o produto por ID (referência entre agregados, ADR-003) e copia a `classificacaoRisco` no registro — mudanças posteriores no produto não afetam cargas históricas.
2. **Controle de status**: coluna `status` na carga + tabela append-only `eventos_historico` com a trilha completa (auditoria). As transições válidas são regra de domínio (máquina de estados), não constraint de banco — o banco persiste o resultado das decisões do agregado.
3. **Consistência do agregado**: `salvar()` do repositório de cargas grava raiz + documentos + inspeções + novos eventos em **uma única transação**.
4. **Inativação/cancelamento lógico**: produtos são inativados (`ativo = false`); cargas são canceladas via máquina de estados. Nenhum dado é removido fisicamente em operação normal.
5. **Evolução nas próximas fases**: `areaArmazenamentoId` na carga (alocação em áreas), storage de arquivos para `urlArquivo`, publicação de eventos de domínio (`CargaLiberada`, `CargaBloqueada`) em mensageria, e eventuais projeções de leitura (CQRS) se o histórico crescer — tudo via novas migrações, sem remodelar o núcleo.
