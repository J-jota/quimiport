# Arquitetura Proposta

## 1. Estilo arquitetural

O QuimiPort adotará **Clean Architecture** (Arquitetura Limpa) com **núcleo de domínio modelado com DDD**. Essa escolha atende diretamente aos requisitos da fase: separação de responsabilidades, testabilidade e capacidade de evolução nas próximas fases (backend, frontend, mobile, microsserviços).

### Regra de dependência

> Dependências apontam **sempre para dentro**. O domínio não conhece aplicação, infraestrutura ou interface. Frameworks, banco de dados e HTTP são detalhes nas bordas.

```
┌────────────────────────────────────────────────────────────┐
│  INTERFACE / APRESENTAÇÃO (futuro: REST, Web, Mobile)       │
│  controllers, rotas, serializers, middlewares               │
├────────────────────────────────────────────────────────────┤
│  INFRAESTRUTURA                                             │
│  repositórios concretos, ORM/banco, gateways externos,      │
│  mensageria, storage de arquivos                            │
├────────────────────────────────────────────────────────────┤
│  APLICAÇÃO                                                  │
│  casos de uso (UC-01 a UC-11), DTOs, portas (interfaces),   │
│  orquestração de transações entre agregados                 │
├────────────────────────────────────────────────────────────┤
│  DOMÍNIO  ◄── núcleo: não depende de nada externo           │
│  entidades, value objects, agregados, serviços de domínio,  │
│  regras de negócio, máquina de estados, eventos de domínio  │
└────────────────────────────────────────────────────────────┘
```

## 2. Camadas e responsabilidades

### 2.1 Domínio (`src/domain`)
- **O quê:** entidades, value objects, agregados, serviços de domínio (`ValidadorDocumentacao`), máquina de estados de `StatusCarga`, eventos de domínio (`CargaLiberada`, `CargaBloqueada`).
- **O que NÃO tem:** imports de framework, banco, HTTP, datas de sistema acopladas (usa injeção de clock quando necessário).
- **Por quê:** é a camada mais estável e mais valiosa — onde moram todas as RN-XX. Deve ser testável de forma 100% unitária e rápida.

### 2.2 Aplicação (`src/application`)
- **O quê:** casos de uso (um arquivo/classe por UC), DTOs de entrada/saída, **portas** (interfaces como `CargaRepository`, `ProdutoQuimicoRepository`, `UnitOfWork`, `Clock`).
- **O que NÃO tem:** regra de negócio do domínio (RN-XX ficam no domínio), detalhes de persistência ou HTTP.
- **Por quê:** orquestra fluxos entre agregados (ex.: RN-02 exige consultar ProdutoQuimico antes de criar a Carga) e define os contratos que a infraestrutura implementará.

### 2.3 Infraestrutura (`src/infrastructure`)
- **O quê (fases futuras):** implementações das portas — repositórios com ORM, adaptadores de storage para documentos, publicação de eventos em mensageria, configuração de banco.
- **Por quê separada:** trocar de banco (ex.: in-memory → PostgreSQL) não toca nem aplicação nem domínio.

### 2.4 Interface / Apresentação (futuro)
- **O quê:** controllers REST, rotas, validação de payload (entrada), serialização de resposta, autenticação/autorização por perfil.
- **Regra de borda:** validação de **formato** (JSON bem formado, tipos) acontece aqui; validação de **negócio** continua no domínio.

### 2.5 Shared (`src/shared`)
- Erros tipados (`DomainError`, `NotFoundError`, `ConflictError`, `ValidationError`), tipos utilitários, resultado `Either`/Result pattern para tratamento de erros sem exceções vazadas.

## 3. Organização inicial de pastas

```
quimiport/
├── README.md
├── docs/                          → toda a documentação desta fase
├── src/
│   ├── domain/
│   │   ├── carga/
│   │   │   ├── CargaQuimica.ts            (agregado raiz)
│   │   │   ├── DocumentoCarga.ts          (entidade interna)
│   │   │   ├── Inspecao.ts                (entidade interna)
│   │   │   └── StatusCargaMachine.ts      (máquina de estados)
│   │   ├── produto/
│   │   │   └── ProdutoQuimico.ts
│   │   ├── responsavel/
│   │   │   └── ResponsavelTecnico.ts
│   │   ├── area/
│   │   │   └── AreaArmazenamento.ts
│   │   ├── value-objects/
│   │   │   ├── Quantidade.ts
│   │   │   ├── NumeroONU.ts
│   │   │   ├── RegistroProfissional.ts
│   │   │   └── EventoHistorico.ts
│   │   ├── enums/
│   │   │   ├── StatusCarga.ts
│   │   │   ├── ClasseRisco.ts
│   │   │   ├── TipoDocumento.ts
│   │   │   ├── ResultadoInspecao.ts
│   │   │   └── UnidadeMedida.ts
│   │   ├── services/
│   │   │   └── ValidadorDocumentacao.ts   (serviço de domínio — RN-04)
│   │   └── events/
│   │       ├── CargaLiberada.ts
│   │       └── CargaBloqueada.ts
│   ├── application/
│   │   ├── use-cases/                     (um arquivo por UC-XX)
│   │   ├── ports/                         (interfaces de repositório, clock, event bus)
│   │   └── dtos/
│   ├── infrastructure/                    (fases futuras)
│   │   ├── persistence/
│   │   ├── storage/
│   │   └── messaging/
│   ├── shared/
│   │   ├── errors/
│   │   └── types/
│   └── tests/
│       ├── unit/                          (espelha domain/ e application/)
│       ├── integration/                   (futuro)
│       └── fixtures/                      (builders e dados simulados)
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## 4. Como o projeto evolui

| Evolução | Impacto por camada |
|---|---|
| **Backend REST (Fase 2)** | adiciona camada de interface + repositórios reais; domínio e aplicação **inalterados** |
| **Frontend (Fase 3)** | consome a API; contratos nascem dos DTOs da camada de aplicação |
| **Mobile (Fase 4)** | mesma API, novo cliente; nenhum impacto no núcleo |
| **Microsserviços (futuro)** | agregados viram candidatos naturais a serviços (Cargas, Catálogo de Produtos, Documentação); eventos de domínio já modelados (`CargaLiberada`) viram integração assíncrona |
| **Banco de dados** | troca apenas `infrastructure/persistence`; portas garantem o contrato |

## 5. Anti-acoplamento — garantias práticas

1. Domínio sem dependências externas (verificável com lint de fronteiras, ex.: `eslint-plugin-boundaries`);
2. Comunicação entre agregados somente por ID tipado;
3. Portas (interfaces) na aplicação, implementações na infraestrutura — inversão de dependência;
4. Eventos de domínio para efeitos colaterais (notificação, auditoria externa), evitando chamadas diretas entre contextos;
5. DTOs na borda da aplicação — entidades de domínio nunca vazam para a API.
