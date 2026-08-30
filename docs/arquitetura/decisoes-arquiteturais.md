# Decisões Arquiteturais (ADRs)

Registro das principais decisões tomadas pelo grupo, no formato **ADR** (Architecture Decision Record): contexto → decisão → consequências.

---

## ADR-001 — Separação em Domínio, Aplicação e Infraestrutura

- **Status:** Aceita
- **Contexto:** O projeto nascerá como documentação/modelagem e evoluirá para backend, frontend e possivelmente microsserviços. Regras de negócio de segurança (RN-XX) precisam ser estáveis e testáveis independentemente de framework ou banco.
- **Decisão:** Adotar Clean Architecture com três círculos internos explícitos: `domain`, `application` e `infrastructure`, com dependências apontando para dentro.
- **Consequências:**
  - ✅ Regras de negócio testáveis sem subir banco ou servidor;
  - ✅ Troca de tecnologia de persistência não afeta o núcleo;
  - ⚠️ Maior quantidade de arquivos/camadas para funcionalidades simples (custo aceito pelo ganho de evolução).

## ADR-002 — Regras de negócio concentradas no domínio (modelo rico)

- **Status:** Aceita
- **Contexto:** Regras como "carga não pode ser liberada sem documentação" são críticas de segurança. Se espalhadas em controllers ou serviços de aplicação, podem ser contornadas.
- **Decisão:** Entidades e agregados ricos (comportamentos, não getters/setters); factory methods com validação; invariantes em value objects; casos de uso apenas orquestram. Regras que envolvem dois agregados (ex.: RN-02, produto ativo) ficam no caso de uso; todas as demais no domínio.
- **Consequências:**
  - ✅ Impossível criar uma carga inválida fora da factory;
  - ✅ Máquina de estados única e auditável;
  - ⚠️ Exige disciplina da equipe para não recriar regras na borda.

## ADR-003 — Agregado `CargaQuimica` como fronteira transacional principal

- **Status:** Aceita
- **Contexto:** Documentos, inspeções e histórico só fazem sentido no contexto de uma carga; alterações neles afetam decisões da carga (liberação/bloqueio).
- **Decisão:** `DocumentoCarga` e `Inspecao` são entidades internas do agregado `CargaQuimica`, sem repositório próprio. Demais entidades (Produto, Responsável, Área) são agregados independentes, referenciados por ID.
- **Consequências:**
  - ✅ Consistência forte nas decisões de segurança;
  - ✅ Carregamento/persistência atômicos;
  - ⚠️ Histórico pode crescer — mitigável com projeções de leitura (CQRS) futuras.

## ADR-004 — TypeScript como linguagem do projeto

- **Status:** Aceita
- **Contexto:** O domínio tem muitos estados e classificações (status, classes de risco, tipos de documento). Erros de digitação ou troca de IDs são riscos reais.
- **Decisão:** TypeScript com `strict: true`, enums para status/classificações, branded types para IDs, interfaces para portas e DTOs.
- **Consequências:**
  - ✅ Erros de domínio capturados em tempo de compilação;
  - ✅ Refatorações seguras ao longo das fases;
  - ⚠️ Curva de configuração inicial (tsconfig, build).

## ADR-005 — Tratamento de erros com hierarquia tipada

- **Status:** Aceita
- **Contexto:** É preciso distinguir erro de negócio (ex.: documentação incompleta) de erro técnico (ex.: banco indisponível) — as respostas ao usuário diferem.
- **Decisão:** Hierarquia de erros em `shared/errors`: `DomainError` (violação de RN), `NotFoundError`, `ConflictError`, `ValidationError` (entrada). Camada de interface mapeia cada um para o HTTP status adequado (422, 404, 409, 400).
- **Consequências:**
  - ✅ Semântica clara e testável ("espero DomainError com código RN-04");
  - ⚠️ Exige convenção de códigos de erro documentada.

## ADR-006 — Máquina de estados explícita para StatusCarga

- **Status:** Aceita
- **Contexto:** O ciclo de vida da carga tem regras estritas (RN-05, RN-06, RN-07). Transições soltas em ifs espalhados gerariam inconsistência.
- **Decisão:** Tabela de transições centralizada em `StatusCargaMachine`, invocada unicamente pelo método `transicionarStatus()` da raiz, que sempre registra `EventoHistorico`.
- **Consequências:**
  - ✅ Toda transição auditável e testável de forma exaustiva (tabela × testes);
  - ✅ Novos estados futuros exigem mudança em um só lugar.

## ADR-007 — Evolução para backend/frontend/mobile/microsserviços

- **Status:** Aceita (planejamento)
- **Contexto:** As próximas fases adicionarão tecnologia real sobre este núcleo.
- **Decisão:**
  - **Backend:** Node.js + TypeScript, camada HTTP fina sobre os casos de uso existentes; repositórios implementando as portas;
  - **Frontend:** SPA consumindo os DTOs da aplicação; nenhuma regra de negócio duplicada no cliente (apenas validação de UX);
  - **Mobile:** mesmo contrato de API;
  - **Microsserviços:** agregados são as fronteiras naturais de serviço; eventos de domínio (`CargaLiberada`, `CargaBloqueada`) serão publicados em mensageria para integração assíncrona.
- **Consequências:**
  - ✅ Nenhuma remodelagem do domínio nas próximas fases;
  - ⚠️ Contratos de API devem ser versionados desde a Fase 2.

## ADR-008 — Testes na pirâmide, com domínio 100% unitário

- **Status:** Aceita
- **Contexto:** As regras de segurança são o maior risco do produto; precisam de cobertura máxima com feedback rápido.
- **Decisão:** Pirâmide de testes: base ampla de unitários (domínio + casos de uso com repositórios em memória), integração na Fase 2 (repositórios reais), e2e enxuto nas fases de interface. Detalhes em [`../qualidade/plano-de-qualidade.md`](../qualidade/plano-de-qualidade.md).
- **Consequências:**
  - ✅ Feedback em segundos para regras críticas;
  - ✅ Mocks concentrados nas portas (interfaces), não em detalhes de implementação.
