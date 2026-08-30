# 5. Regras de Negócio

Catálogo das regras de negócio do QuimiPort, com identificador único (RN-XX) para rastreabilidade nos casos de uso, no código e nos testes.

## 5.1 Regras de registro e cadastro

| ID | Regra | Onde fica concentrada |
|---|---|---|
| **RN-01** | Uma carga química não pode ser registrada sem produto químico associado | Factory do agregado `CargaQuimica` |
| **RN-02** | Uma carga química não pode ser registrada com produto químico inativo | Caso de uso `RegistrarCargaQuimica` (consulta o agregado ProdutoQuimico) |
| **RN-03** | Uma carga química não pode ser registrada sem classificação de risco | Factory do agregado `CargaQuimica` (herdada do produto) |
| **RN-08** | Um produto químico não pode ser cadastrado sem nome | Factory do agregado `ProdutoQuimico` |
| **RN-09** | Um produto químico não pode ser cadastrado sem classe de risco | Factory do agregado `ProdutoQuimica` |
| **RN-10** | Um produto químico inativo não pode ser usado em novas cargas | Caso de uso `RegistrarCargaQuimica` (sinônimo de RN-02 no fluxo) |
| **RN-11** | A quantidade da carga deve ser maior que zero | Value Object `Quantidade` (invariante) |
| **RN-12** | Toda carga deve possuir um responsável técnico informado | Factory do agregado `CargaQuimica` |

## 5.2 Regras de liberação, bloqueio e ciclo de vida

| ID | Regra | Onde fica concentrada |
|---|---|---|
| **RN-04** | Uma carga química não pode ser liberada sem documentação obrigatória completa, válida e validada | Método `liberar()` da raiz `CargaQuimica` + serviço de domínio `ValidadorDocumentacao` |
| **RN-05** | Uma carga bloqueada não pode entrar em movimentação | Máquina de estados: `BLOQUEADA` não transiciona para `LIBERADA` sem desbloqueio explícito; nunca para `FINALIZADA` |
| **RN-06** | Uma carga cancelada não pode ser liberada | Máquina de estados: `CANCELADA` é estado terminal |
| **RN-07** | Uma carga em inspeção não pode ser finalizada sem antes ser liberada | Máquina de estados: `FINALIZADA` só é alcançável a partir de `LIBERADA` |

## 5.3 Regras derivadas (complementares do domínio)

| ID | Regra | Onde fica concentrada |
|---|---|---|
| **RN-13** | Toda transição de status deve gerar registro no histórico com data, ator e motivo | Método `transicionarStatus()` da raiz |
| **RN-14** | Documento vencido (data de validade < data atual) não é considerado válido | Value Object / entidade `DocumentoCarga` |
| **RN-15** | Inspeção com resultado REPROVADA acarreta bloqueio automático da carga | Método `registrarResultadoInspecao()` da raiz |
| **RN-16** | Não é possível cancelar uma carga já finalizada | Máquina de estados (`FINALIZADA` é terminal) |
| **RN-17** | O histórico da carga é imutável — eventos nunca são alterados ou removidos | VO `EventoHistorico` + coleção somente-leitura |

## 5.4 Máquina de estados da Carga Química

Transições válidas (detalhe visual em [`diagramas/fluxo-status-carga.md`](../diagramas/fluxo-status-carga.md)):

| De | Para | Gatilho | Condição |
|---|---|---|---|
| *(início)* | REGISTRADA | Registrar carga | RN-01, 02, 03, 11, 12 |
| REGISTRADA | EM_VALIDACAO | Iniciar validação documental | — |
| EM_VALIDACAO | LIBERADA | Liberar carga | RN-04 |
| EM_VALIDACAO | EM_INSPECAO | Solicitar inspeção | — |
| EM_VALIDACAO | BLOQUEADA | Bloquear | motivo obrigatório |
| EM_INSPECAO | LIBERADA | Liberar após inspeção | inspeção APROVADA + RN-04 |
| EM_INSPECAO | BLOQUEADA | Inspeção reprovada ou bloqueio manual | RN-15 |
| BLOQUEADA | EM_VALIDACAO | Desbloquear (regularizar pendência) | motivo obrigatório |
| LIBERADA | FINALIZADA | Concluir movimentação | RN-07 |
| REGISTRADA / EM_VALIDACAO / EM_INSPECAO / BLOQUEADA | CANCELADA | Cancelar carga | RN-16 |
| *(qualquer terminal)* | — | CANCELADA e FINALIZADA são terminais | RN-06, RN-16 |

## 5.5 Onde as regras moram na arquitetura (decisão-chave)

```
┌─────────────────────────────────────────────────────────┐
│  Value Objects      → invariantes de formato/valor       │
│  (Quantidade,       (RN-11, RN-14, formato ONU, etc.)    │
│   NumeroONU...)                                           │
├─────────────────────────────────────────────────────────┤
│  Entidades / Agregados → regras de consistência do       │
│  (CargaQuimica,       objeto e do conjunto               │
│   ProdutoQuimico)     (RN-01, 03, 04, 08, 09, 12, 13,    │
│                        15, 17, máquina de estados)        │
├─────────────────────────────────────────────────────────┤
│  Casos de Uso       → regras de orquestração entre       │
│  (Application)      agregados e políticas de fluxo        │
│                     (RN-02, RN-10)                        │
├─────────────────────────────────────────────────────────┤
│  Serviços de Domínio → regras que não cabem naturalmente │
│  (ValidadorDocumentacao) em uma única entidade (RN-04)   │
└─────────────────────────────────────────────────────────┘
```

> **Princípio:** regras de negócio **nunca** vivem na infraestrutura (controllers, banco) nem na interface. A camada de aplicação orquestra; o domínio decide.
