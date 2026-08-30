# 2. Entidades do Sistema

Entidades são objetos do domínio com **identidade própria** que persiste ao longo do tempo — duas entidades com os mesmos atributos, mas identidades diferentes, são entidades diferentes.

---

## 2.1 Produto Químico

**Responsabilidade:** representar o catálogo de produtos químicos que podem ser movimentados como carga.

**Principais atributos:**

| Atributo | Tipo | Observação |
|---|---|---|
| `id` | `ProdutoQuimicoId` (VO) | identidade única |
| `nome` | `string` | obrigatório, único no catálogo |
| `classeRisco` | `ClasseRisco` (enum) | obrigatório |
| `numeroOnu` | `NumeroONU` (VO) | código ONU da substância |
| `descricao` | `string` | opcional |
| `ativo` | `boolean` | controla se pode ser usado em novas cargas |
| `dataCadastro` | `Date` | — |

**Regras relacionadas:**
- Não pode ser cadastrado sem nome (RN-08);
- Não pode ser cadastrado sem classe de risco (RN-09);
- Inativo não pode ser usado em novas cargas (RN-10);
- A inativação não afeta cargas já registradas (histórico preservado).

**Relacionamentos:**
- Referenciado por **Carga Química** (1 produto → N cargas);
- Define a **Classe de Risco** herdada pela carga no momento do registro.

---

## 2.2 Carga Química (raiz do agregado principal)

**Responsabilidade:** representar uma unidade física de produto químico em operação no porto, concentrando o ciclo de vida (status), a documentação, a inspeção e o histórico.

**Principais atributos:**

| Atributo | Tipo | Observação |
|---|---|---|
| `id` | `CargaId` (VO) | identidade única |
| `produtoQuimicoId` | `ProdutoQuimicoId` | referência ao produto associado |
| `quantidade` | `Quantidade` (VO) | > 0 |
| `unidadeMedida` | `UnidadeMedida` (enum) | KG, TON, LITRO, M3 |
| `responsavelTecnicoId` | `ResponsavelTecnicoId` | obrigatório |
| `status` | `StatusCarga` (enum) | inicia em `REGISTRADA` |
| `classificacaoRisco` | `ClasseRisco` | herdada do produto no registro |
| `documentos` | `DocumentoCarga[]` | entidades internas do agregado |
| `inspecoes` | `Inspecao[]` | entidades internas do agregado |
| `historico` | `EventoHistorico[]` | imutável, só cresce |
| `dataRegistro` | `Date` | — |

**Regras relacionadas:**
- Não pode existir sem produto associado (RN-01), produto inativo (RN-02) ou classificação de risco (RN-03);
- Quantidade deve ser maior que zero (RN-11);
- Deve possuir responsável técnico (RN-12);
- Todas as transições de status seguem a máquina de estados (RN-05, RN-06, RN-07 — ver fluxo em `diagramas/fluxo-status-carga.md`);
- Toda transição gera um registro no histórico.

**Relacionamentos:**
- Pertence a um **Produto Químico** (por ID — referência entre agregados);
- Contém **Documentos da Carga** e **Inspeções** (composição dentro do agregado);
- Referencia um **Responsável Técnico** (por ID);
- Pode ser alocada em uma **Área de Armazenamento** (por ID — evolução futura).

---

## 2.3 Responsável Técnico

**Responsabilidade:** representar o profissional habilitado que responde tecnicamente por uma carga.

**Principais atributos:**

| Atributo | Tipo | Observação |
|---|---|---|
| `id` | `ResponsavelTecnicoId` | — |
| `nome` | `string` | obrigatório |
| `registroProfissional` | `RegistroProfissional` (VO) | ex.: CREA/CRQ |
| `especialidade` | `string` | ex.: química, meio ambiente |
| `ativo` | `boolean` | — |

**Regras relacionadas:**
- Registro profissional obrigatório e válido no formato do conselho;
- Responsável inativo não pode ser atribuído a novas cargas (evolução futura).

**Relacionamentos:**
- Referenciado por **Carga Química** (1 responsável → N cargas).

---

## 2.4 Documento da Carga (entidade interna do agregado)

**Responsabilidade:** representar um documento obrigatório ou complementar anexado a uma carga.

**Principais atributos:**

| Atributo | Tipo | Observação |
|---|---|---|
| `id` | `DocumentoId` | — |
| `tipo` | `TipoDocumento` (enum) | FISPQ, CONHECIMENTO_EMBARQUE, CERTIFICADO_INSPECAO, ALVARA |
| `numero` | `string` | identificação do documento |
| `dataEmissao` / `dataValidade` | `Date` | validade obrigatória para documentos vencíveis |
| `validado` | `boolean` | validado pelo analista de documentação |
| `urlArquivo` | `string` | referência futura ao arquivo |

**Regras relacionadas:**
- Documento vencido não conta como válido para liberação;
- A carga só pode ser liberada se **todos os tipos obrigatórios** estiverem presentes, válidos e validados (RN-04);
- Documentos só podem ser criados/alterados através da carga (raiz do agregado).

**Relacionamentos:**
- Pertence exclusivamente a uma **Carga Química** (composição — não existe sozinho).

---

## 2.5 Inspeção (entidade interna do agregado)

**Responsabilidade:** registrar a verificação técnica da carga.

**Principais atributos:**

| Atributo | Tipo | Observação |
|---|---|---|
| `id` | `InspecaoId` | — |
| `motivo` | `string` | por que a inspeção foi solicitada |
| `dataSolicitacao` / `dataConclusao` | `Date` | — |
| `resultado` | `ResultadoInspecao` (enum) | PENDENTE, APROVADA, REPROVADA |
| `inspetor` | `string` | quem executou |

**Regras relacionadas:**
- Só pode ser concluída se a carga estiver `EM_INSPECAO`;
- Resultado **REPROVADA** acarreta bloqueio da carga;
- Uma carga pode ter múltiplas inspeções (o histórico de inspeções é preservado).

**Relacionamentos:**
- Pertence exclusivamente a uma **Carga Química** (composição).

---

## 2.6 Área de Armazenamento

**Responsabilidade:** representar uma área física do pátio onde cargas podem ser alocadas.

**Principais atributos:**

| Atributo | Tipo | Observação |
|---|---|---|
| `id` | `AreaArmazenamentoId` | — |
| `codigo` | `string` | identificação física (ex.: "A-03") |
| `capacidadeMaxima` | `Quantidade` | — |
| `classesRiscoPermitidas` | `ClasseRisco[]` | compatibilidade de risco |
| `ativa` | `boolean` | — |

**Regras relacionadas:**
- Uma carga só pode ser alocada em área que aceite sua classe de risco (evolução futura);
- A soma das quantidades alocadas não pode exceder a capacidade máxima (evolução futura).

**Relacionamentos:**
- Referenciada por **Carga Química** (por ID — referência entre agregados, fase futura).

---

## 2.7 Resumo — Entidade × Agregado

| Entidade | Identidade própria? | Pertence a qual agregado? |
|---|---|---|
| Produto Químico | ✅ | **Agregado ProdutoQuimico** (raiz) |
| Responsável Técnico | ✅ | **Agregado ResponsavelTecnico** (raiz) |
| Área de Armazenamento | ✅ | **Agregado AreaArmazenamento** (raiz) |
| Carga Química | ✅ | **Agregado CargaQuimica** (raiz) |
| Documento da Carga | ✅ (interna) | interno do agregado CargaQuimica |
| Inspeção | ✅ (interna) | interno do agregado CargaQuimica |
