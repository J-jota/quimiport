# QuimiPort — Gestão de Cargas Químicas Portuárias

> **Tech Challenge — Fase 1 · Pós Tech em Full Stack Development**
> Disciplinas: JavaScript Avançado · Arquitetura de Software com TypeScript · Domain Driven Design · Qualidade de Software

---

## Contexto do Problema

O Porto de Santos é um dos principais pontos de movimentação de cargas do Brasil. Entre os diversos tipos de cargas, os **produtos químicos** exigem controle cuidadoso, documentação adequada, classificação de risco e acompanhamento técnico.

Hoje, uma empresa que atua no controle de cargas químicas realiza o registro dessas operações de forma **manual e descentralizada**, o que dificulta:

- A consulta rápida de informações sobre cada carga;
- O acompanhamento do status da carga ao longo da operação;
- A validação de regras de segurança antes da liberação para movimentação portuária;
- O controle da documentação obrigatória e do responsável técnico.

## Objetivo da Aplicação

O **QuimiPort** é um sistema de gestão inicial de cargas químicas portuárias. Nesta primeira fase, o sistema deverá permitir:

- Cadastrar e inativar **produtos químicos**;
- Registrar **cargas químicas** associadas a um produto;
- Informar **classificação de risco**;
- Registrar e validar **documentação obrigatória**;
- Definir **responsável técnico**;
- Acompanhar o **status da carga** (fluxo de transições controlado);
- **Bloquear ou liberar** uma carga conforme regras de negócio;
- **Validar regras de segurança** antes da movimentação;
- Testar os principais fluxos do domínio.

## Escopo desta Fase

Esta fase **não** entrega aplicação funcional, frontend, backend ou banco de dados implementados. O entregável é a **base técnica e arquitetural** do projeto que será evoluído nas próximas fases:

| Artefato | Descrição |
|---|---|
| Documentação de domínio | Linguagem ubíqua, entidades, objetos de valor, agregados e regras de negócio |
| Documentação de casos de uso | Casos de uso planejados com atores, entradas, saídas e exceções |
| Documentação de arquitetura | Camadas propostas, decisões arquiteturais (ADRs) e estratégia de evolução |
| Diagramas | Diagrama de domínio e fluxo de status da carga (obrigatórios) + casos de uso e camadas |
| Plano de qualidade | Estratégia de testes unitários, integração, mocks e cenários críticos |

## Navegação pela Documentação

```
docs/
├── dominio/
│   ├── 01-linguagem-ubiqua.md        → glossário e linguagem ubíqua do negócio
│   ├── 02-entidades.md               → entidades do sistema (atributos, regras, relações)
│   ├── 03-objetos-de-valor.md        → value objects e invariantes
│   ├── 04-agregados.md               → agregado raiz CargaQuimica e fronteiras
│   └── 05-regras-de-negocio.md       → catálogo de regras de negócio (RN-XX)
├── casos-de-uso.md                   → casos de uso planejados (UC-XX)
├── arquitetura/
│   ├── arquitetura-proposta.md       → camadas, responsabilidades e evolução futura
│   ├── decisoes-arquiteturais.md     → ADRs (Architecture Decision Records)
│   └── javascript-typescript.md      → uso de JS Avançado e TypeScript (tipos, enums, etc.)
├── qualidade/
│   └── plano-de-qualidade.md         → estratégia de testes e cenários críticos
└── diagramas/
    ├── diagrama-dominio.md           → agregados/entidades (obrigatório)
    ├── fluxo-status-carga.md         → transições de status (obrigatório)
    ├── diagrama-casos-de-uso.md      → atores × casos de uso
    └── arquitetura-camadas.md        → visão em camadas e contexto
```

## Organização Proposta do Código (futura implementação)

A pasta [`src/`](./src) contém o esqueleto de diretórios que guiará a implementação nas próximas fases, seguindo **Clean Architecture** com núcleo de domínio DDD:

```
src/
├── domain/          → entidades, value objects, agregados, regras (núcleo puro)
├── application/     → casos de uso, portas (interfaces), DTOs
├── infrastructure/  → implementações futuras: repositórios, banco, APIs
├── shared/          → erros, tipos e contratos compartilhados
└── tests/           → espelhamento dos testes por camada
```

## Roadmap de Evolução (próximas fases)

| Fase | Evolução planejada |
|---|---|
| **Fase 2** | Backend REST (Node.js + TypeScript), persistência com repositórios concretos, testes de integração |
| **Fase 3** | Frontend (SPA), autenticação por perfil, dashboards de acompanhamento de cargas |
| **Fase 4** | Mobile, notificações de status, integração com sistemas portuários externos |
| **Futuro** | Decomposição em microsserviços (cargas, documentação, inspeção), eventos de domínio |

## Equipe

Jose Mariano - rm376906
