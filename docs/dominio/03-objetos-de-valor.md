# 3. Objetos de Valor (Value Objects)

Objetos de valor são **imutáveis**, sem identidade própria, e se definem **pelos seus atributos**. Dois VOs com os mesmos valores são considerados iguais. Eles encapsulam **invariantes** — validações que garantem que o valor nunca existe em estado inválido.

## 3.1 Catálogo de Value Objects

### `Quantidade`
- **Atributos:** `valor: number`, `unidade: UnidadeMedida`
- **Invariante:** `valor > 0` (RN-11); unidade deve pertencer ao enum `UnidadeMedida`
- **Comportamentos:** `somar(outra)`, `subtrair(outra)` (somente mesma unidade — lança `DomainError` caso contrário)

### `ClasseRisco` (enum, tratado como VO)
- **Valores:** `INFLAMAVEL`, `TOXICO`, `CORROSIVO`, `OXIDANTE`, `EXPLOSIVO`, `RADIOATIVO`, `NAO_PERIGOSO`
- **Uso:** classificação obrigatória do produto e da carga (RN-03, RN-09)

### `NumeroONU`
- **Atributos:** `codigo: string`
- **Invariante:** formato `"ONU " + 4 dígitos` (ex.: `ONU 1993`)
- **Uso:** identificação regulatória da substância

### `StatusCarga` (enum)
- **Valores:** `REGISTRADA`, `EM_VALIDACAO`, `EM_INSPECAO`, `LIBERADA`, `BLOQUEADA`, `CANCELADA`, `FINALIZADA`
- **Uso:** estado atual da carga; transições válidas definidas na máquina de estados (ver `diagramas/fluxo-status-carga.md`)

### `TipoDocumento` (enum)
- **Valores:** `FISPQ`, `CONHECIMENTO_EMBARQUE`, `CERTIFICADO_INSPECAO`, `ALVARA`
- **Uso:** tipos de documento; subconjunto obrigatório definido pela regra de liberação (RN-04)

### `ResultadoInspecao` (enum)
- **Valores:** `PENDENTE`, `APROVADA`, `REPROVADA`

### `RegistroProfissional`
- **Atributos:** `conselho: string` (ex.: CRQ, CREA), `numero: string`
- **Invariante:** número não vazio e conselho reconhecido

### `EventoHistorico`
- **Atributos:** `dataHora: Date`, `statusAnterior: StatusCarga`, `statusNovo: StatusCarga`, `ator: string`, `motivo: string`
- **Característica:** **imutável** — eventos só são adicionados, nunca alterados ou removidos (trilha de auditoria)

### IDs tipados
- `CargaId`, `ProdutoQuimicoId`, `ResponsavelTecnicoId`, `DocumentoId`, `InspecaoId`, `AreaArmazenamentoId`
- **Motivação:** evitar confusão entre IDs (branded types em TypeScript) — um `ProdutoQuimicoId` não pode ser passado onde se espera um `CargaId`.

## 3.2 Por que VOs em vez de primitivas soltas?

| Primitiva solta | Value Object |
|---|---|
| `quantidade: number` (pode ser -50) | `Quantidade` nunca é ≤ 0 — inválido nem existe |
| `status: string` (qualquer string vale) | `StatusCarga` limita aos 7 estados do domínio |
| `numeroOnu: string` | `NumeroONU` valida formato regulatório |
| `id: string` (todos iguais) | IDs tipados impedem troca acidental entre entidades |

> **Decisão:** as invariantes vivem **dentro** dos VOs e das entidades. Nenhum objeto do domínio pode ser construído em estado inválido — validação não é responsabilidade de camadas externas.
