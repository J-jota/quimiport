# Diagrama de Domínio — Agregados e Entidades *(obrigatório)*

Visão dos agregados, entidades, value objects e seus relacionamentos, com as fronteiras de agregado destacadas.

```mermaid
classDiagram
    direction LR

    class ProdutoQuimico {
        <<agregado raiz>>
        +ProdutoQuimicoId id
        +string nome
        +ClasseRisco classeRisco
        +NumeroONU numeroOnu
        +boolean ativo
        +inativar()
    }

    class ResponsavelTecnico {
        <<agregado raiz>>
        +ResponsavelTecnicoId id
        +string nome
        +RegistroProfissional registroProfissional
        +boolean ativo
    }

    class AreaArmazenamento {
        <<agregado raiz>>
        +AreaArmazenamentoId id
        +string codigo
        +Quantidade capacidadeMaxima
        +ClasseRisco[] classesRiscoPermitidas
        +boolean ativa
    }

    class CargaQuimica {
        <<agregado raiz — principal>>
        +CargaId id
        +Quantidade quantidade
        +ClasseRisco classificacaoRisco
        +StatusCarga status
        +static registrar(props)
        +anexarDocumento(doc)
        +solicitarInspecao(motivo)
        +registrarResultadoInspecao(resultado)
        +liberar(ator, motivo)
        +bloquear(ator, motivo)
        +cancelar(ator, motivo)
        +finalizar()
        +consultarHistorico()
    }

    class DocumentoCarga {
        <<entidade interna>>
        +DocumentoId id
        +TipoDocumento tipo
        +string numero
        +Date dataValidade
        +boolean validado
        +estaValido() boolean
    }

    class Inspecao {
        <<entidade interna>>
        +InspecaoId id
        +string motivo
        +ResultadoInspecao resultado
        +Date dataSolicitacao
        +Date dataConclusao
    }

    class EventoHistorico {
        <<value object imutável>>
        +Date dataHora
        +StatusCarga statusAnterior
        +StatusCarga statusNovo
        +string ator
        +string motivo
    }

    class Quantidade {
        <<value object>>
        +number valor  (maior que 0)
        +UnidadeMedida unidade
    }

    %% Relações dentro do agregado CargaQuimica (composição)
    CargaQuimica *-- DocumentoCarga : contém 1..*
    CargaQuimica *-- Inspecao : contém 0..*
    CargaQuimica *-- EventoHistorico : contém 1..*
    CargaQuimica *-- Quantidade : possui

    %% Referências ENTRE agregados (somente por ID)
    CargaQuimica --> ProdutoQuimico : produtoQuimicoId
    CargaQuimica --> ResponsavelTecnico : responsavelTecnicoId
    CargaQuimica ..> AreaArmazenamento : areaArmazenamentoId (futuro)
```

## Leitura do diagrama

- **Composição (`*--`)**: `DocumentoCarga`, `Inspecao` e `EventoHistorico` vivem **dentro** do agregado `CargaQuimica` — não existem sozinhos e só são alterados pela raiz;
- **Referência por ID (`-->`)**: entre agregados, apenas IDs tipados — `CargaQuimica` não carrega `ProdutoQuimico` inteiro;
- **Linha tracejada (`..>`)**: relação planejada para evolução futura (alocação de carga em área).

## Visão de fronteiras (bounded view)

```mermaid
flowchart TB
    subgraph AG_PRODUTO["Agregado: ProdutoQuimico"]
        P["ProdutoQuimico (raiz)"]
    end

    subgraph AG_RESP["Agregado: ResponsavelTecnico"]
        R["ResponsavelTecnico (raiz)"]
    end

    subgraph AG_AREA["Agregado: AreaArmazenamento"]
        A["AreaArmazenamento (raiz)"]
    end

    subgraph AG_CARGA["Agregado: CargaQuimica  ★ principal"]
        C["CargaQuimica (raiz)"]
        D["DocumentoCarga"]
        I["Inspecao"]
        H["EventoHistorico"]
        C --> D & I & H
    end

    C -. "por ID" .-> P
    C -. "por ID" .-> R
    C -. "por ID (futuro)" .-> A
```
