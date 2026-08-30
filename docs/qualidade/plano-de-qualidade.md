# Plano de Qualidade de Software

Como o QuimiPort será testado nesta fase (modelagem) e nas próximas (implementação).

## 1. Estratégia geral — pirâmide de testes

```
        ╱  E2E   ╲          ← poucos, fases de interface (Fase 3+)
       ╱ Integração╲        ← moderados, Fase 2 (repositórios reais)
      ╱   Unitários  ╲      ← base ampla: domínio + casos de uso
     ╱ (esta fase →)   ╲       100% do domínio coberto por unitários
    ╱────────────────────╲
```

- **Ferramenta planejada:** Vitest (ecossistema TS moderno, rápido, nativo ESM);
- **Meta de cobertura:** 100% das linhas do domínio; ≥ 90% dos casos de uso;
- **Cada regra RN-XX tem pelo menos um teste** com o código da regra no nome (rastreabilidade).

## 2. Quais regras de negócio precisam ser testadas

Todas as regras do catálogo ([`../dominio/05-regras-de-negocio.md`](../dominio/05-regras-de-negocio.md)). As críticas de segurança têm prioridade máxima:

| Prioridade | Regras | Justificativa |
|---|---|---|
| 🔴 Crítica | RN-04, RN-05, RN-06, RN-07 | segurança da movimentação — erro aqui = risco operacional/ambiental |
| 🟠 Alta | RN-01, RN-02, RN-03, RN-10, RN-11, RN-12 | integridade do registro da carga |
| 🟡 Média | RN-08, RN-09, RN-13, RN-14, RN-15, RN-16, RN-17 | cadastro, auditoria e documentação |

## 3. Casos de uso mais críticos

1. **UC-06 Liberar Carga** — concentra RN-04/05/06; é a decisão de segurança central;
2. **UC-03 Registrar Carga** — porta de entrada de dados; 5 regras envolvidas;
3. **UC-08 Atualizar Status** — exercita a máquina de estados completa;
4. **UC-07 Bloquear Carga** (incluindo bloqueio automático por inspeção reprovada — RN-15);
5. **UC-09 Cancelar Carga** — protege os estados terminais.

## 4. Tipos de teste que serão utilizados

| Tipo | Escopo | Quando |
|---|---|---|
| **Unitário** | VOs, entidades, agregados, máquina de estados, serviços de domínio | desde a primeira implementação |
| **Unitário de caso de uso** | orquestração com repositórios **em memória** (fakes), sem mocks pesados | desde a primeira implementação |
| **Integração** | repositórios reais contra banco, adaptadores de storage/mensageria | Fase 2 |
| **Contrato** | DTOs × API (garantir que o contrato não quebra) | Fase 2 |
| **E2E** | fluxos principais pela interface | Fase 3+ |

## 5. Como aplicaremos testes unitários

- **Domínio puro, sem mocks**: entidades e VOs não dependem de nada externo — o teste instancia diretamente e verifica comportamento;
- **Estilo AAA** (Arrange–Act–Assert) com nomes descritivos incluindo o código da regra;
- **Testes de exceção explícitos**: `expect(() => ...).toThrow(DomainError)` + verificação do código da RN;
- **Testes de transição exaustivos**: cada linha da tabela de transições ([`../diagramas/fluxo-status-carga.md`](../diagramas/fluxo-status-carga.md)) vira um teste — incluindo as **transições proibidas**;
- **Builders de fixtures**: `CargaBuilder`, `ProdutoBuilder` para montar cenários válidos com uma linha e variar só o que interessa ao teste.

Exemplos de cenários planejados (alinhados ao enunciado):

```typescript
it('RN-09: não permite cadastrar produto químico sem classe de risco', ...)
it('RN-02: não permite registrar carga com produto químico inativo', ...)
it('RN-04: não permite liberar carga sem documentação obrigatória', ...)
it('RN-04: não permite liberar carga com documento vencido', ...)
it('RN-05: não permite movimentar (finalizar) carga bloqueada', ...)
it('RN-06: não permite liberar carga cancelada', ...)
it('RN-07: não permite finalizar carga em inspeção sem liberação', ...)
it('RN-11: não permite quantidade menor ou igual a zero', ...)
it('RN-13: toda transição de status registra evento no histórico', ...)
it('RN-15: inspeção reprovada bloqueia automaticamente a carga', ...)
it('permite liberar carga com documentação completa e válida', ...)
```

## 6. Como aplicaremos testes de integração (futuro — Fase 2)

- Subir banco real em container (testcontainers) e testar os **repositórios concretos** contra as portas;
- Mesmo conjunto de testes de repositório rodando contra a implementação **em memória** e a **real** (teste de conformidade de contrato — garante que o fake usado nos unitários se comporta como o real);
- Transações: garantir que liberação de carga persiste status + histórico atomicamente.

## 7. Como validaremos os fluxos principais

Três fluxos ponta a ponta (nível de caso de uso primeiro, E2E na Fase 3):

| Fluxo | Caminho feliz |
|---|---|
| **Registro → Liberação** | cadastrar produto → registrar carga → validar documentação → liberar → finalizar |
| **Inspeção reprovada** | registrar carga → solicitar inspeção → reprovar → verificar bloqueio automático → tentar movimentar (deve falhar) |
| **Bloqueio e regularização** | bloquear carga → tentar liberar (deve falhar) → desbloquear → completar documentação → liberar |

## 8. Organização de mocks e dados simulados

| Estratégia | Onde | Por quê |
|---|---|---|
| **Repositórios em memória (fakes)** | testes de caso de uso | contratos das portas implementados com `Map` — comportamento real, sem framework de mock |
| **Mocks de porta pontuais** | somente quando o caso de uso exige verificar interação (ex.: publicação de evento futura) | portas são interfaces — mockar na fronteira, nunca detalhe interno |
| **Builders de fixtures** | `src/tests/fixtures/builders/` | dados simulados consistentes: `CargaBuilder.valida().comDocumentacaoCompleta().liberavel()` |
| **Clock fake** | testes de validade de documentos (RN-14) | injeção de `Clock` na porta permite controlar "hoje" sem flaky tests |
| **Dados de seed** | `src/tests/fixtures/seeds/` | catálogo de produtos e responsáveis válidos para testes de integração |

## 9. Qualidade contínua (Fase 2+)

- CI com: typecheck (`tsc --noEmit`), lint, testes unitários, cobertura mínima;
- Regra de PR: nenhuma RN nova entra sem teste correspondente;
- Lint de fronteiras arquiteturais para impedir import de infraestrutura no domínio.
