# src/ — Organização inicial do código

> Nesta fase **não há implementação**. Esta estrutura é o **mapa de diretórios** que guiará o desenvolvimento nas próximas fases, conforme [`docs/arquitetura/arquitetura-proposta.md`](../docs/arquitetura/arquitetura-proposta.md).

```
src/
├── domain/                    ← núcleo DDD (sem dependências externas)
│   ├── carga/                 → CargaQuimica (raiz), DocumentoCarga, Inspecao, StatusCargaMachine
│   ├── produto/               → ProdutoQuimico (raiz)
│   ├── responsavel/           → ResponsavelTecnico (raiz)
│   ├── area/                  → AreaArmazenamento (raiz)
│   ├── value-objects/         → Quantidade, NumeroONU, RegistroProfissional, EventoHistorico
│   ├── enums/                 → StatusCarga, ClasseRisco, TipoDocumento, ResultadoInspecao, UnidadeMedida
│   ├── services/              → ValidadorDocumentacao (RN-04)
│   └── events/                → CargaLiberada, CargaBloqueada
├── application/               ← casos de uso e contratos
│   ├── use-cases/             → um arquivo por UC-01..UC-11
│   ├── ports/                 → CargaRepository, ProdutoQuimicoRepository, Clock, EventBus
│   └── dtos/                  → contratos de entrada/saída (base da API futura)
├── infrastructure/            ← fases futuras
│   ├── persistence/           → repositórios concretos (ORM/banco)
│   ├── storage/               → armazenamento de documentos
│   └── messaging/             → publicação de eventos de domínio
├── shared/                    ← compartilhado entre camadas
│   ├── errors/                → DomainError, NotFoundError, ConflictError, ValidationError
│   └── types/                 → branded IDs, Result<T, E>
└── tests/
    ├── unit/                  → espelha domain/ e application/
    ├── integration/           → Fase 2
    └── fixtures/              → builders (CargaBuilder, ProdutoBuilder) e seeds
```

## Convenções

1. **Regra de dependência:** imports sempre apontando para dentro (interface → infra → application → domain);
2. **Nomenclatura:** arquivos em `PascalCase` para classes/entidades e `kebab-case` para módulos utilitários; termos da [linguagem ubíqua](../docs/dominio/01-linguagem-ubiqua.md);
3. **Rastreabilidade:** cada regra RN-XX referenciada em comentário no ponto do código que a implementa e no nome do teste que a cobre;
4. **Fronteira de agregado:** entidades internas (`DocumentoCarga`, `Inspecao`) não são exportadas fora de `domain/carga/` para escrita — apenas leitura.
