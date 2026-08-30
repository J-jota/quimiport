# 4. Agregados

Um **agregado** é um cluster de entidades e objetos de valor tratado como **uma unidade de consistência transacional**. O acesso externo acontece **somente pela raiz do agregado (aggregate root)**, que protege as invariantes do conjunto.

## 4.1 Agregado principal: `CargaQuimica`

### Por que Carga Química é a raiz?

A Carga Química é o **coração do negócio**: é nela que convergem produto, quantidade, documentação, responsável técnico, inspeção e o ciclo de vida (status). Todas as decisões críticas de segurança do sistema — liberar, bloquear, cancelar, finalizar — são decisões **sobre uma carga**. Concentrar essas regras na raiz garante que:

1. **Nenhuma regra de negócio seja contornada**: não há caminho para alterar um documento ou inspeção sem passar pelos métodos da carga;
2. **Consistência transacional**: ao liberar uma carga, status + documentos + inspeção + histórico mudam juntos, em uma única operação;
3. **Auditoria completa**: a raiz é o único ponto que escreve no histórico, garantindo trilha íntegra.

### Fronteira do agregado

```
┌─────────────────────── AGREGADO: CargaQuimica ───────────────────────┐
│                                                                       │
│  RAIZ: CargaQuimica                                                   │
│  ├── produtoQuimicoId ────referência por ID────▶ Agregado ProdutoQuimico
│  ├── responsavelTecnicoId ─referência por ID──▶ Agregado ResponsavelTecnico
│  ├── areaArmazenamentoId ──referência por ID──▶ Agregado AreaArmazenamento
│  ├── quantidade: Quantidade (VO)                                      │
│  ├── classificacaoRisco: ClasseRisco (VO)                             │
│  ├── status: StatusCarga (VO)                                         │
│  ├── documentos: DocumentoCarga[] ──────── entidades INTERNAS         │
│  ├── inspecoes: Inspecao[] ──────────────── entidades INTERNAS        │
│  └── historico: EventoHistorico[] ───────── VO imutável (audit trail) │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### Regras que o agregado protege

| Regra | Como é protegida pela raiz |
|---|---|
| Carga não existe sem produto, risco, quantidade > 0 e responsável | validadas no **construtor/factory** da raiz |
| Liberação exige documentação obrigatória completa e válida | método `liberar()` verifica `documentos` internos antes de transicionar |
| Inspeção reprovada bloqueia a carga | método `registrarResultadoInspecao()` aplica bloqueio internamente |
| Transições de status apenas por caminhos válidos | máquina de estados implementada na raiz (`transicionarStatus()`) |
| Histórico sempre registrado | `transicionarStatus()` sempre anexa `EventoHistorico` |
| Documentos/inspeções não existem fora de uma carga | só expostos como leitura; mutação só via métodos da raiz |

### Métodos de domínio da raiz (comportamentos ricos)

```
CargaQuimica
├── static registrar(props)                    → factory com validações RN-01, 02, 03, 11, 12
├── anexarDocumento(documento)                 → adiciona DocumentoCarga
├── validarDocumentacao(analista)              → confere documentos obrigatórios
├── solicitarInspecao(motivo)                  → cria Inspecao + transiciona para EM_INSPECAO
├── registrarResultadoInspecao(resultado)      → APROVADA: volta ao fluxo / REPROVADA: bloqueia
├── liberar(ator, motivo)                      → verifica regras e transiciona para LIBERADA
├── bloquear(ator, motivo)                     → transiciona para BLOQUEADA
├── cancelar(ator, motivo)                     → transiciona para CANCELADA (terminal)
├── finalizar()                                → somente a partir de LIBERADA (RN-07)
└── consultarHistorico()                       → leitura da trilha de eventos
```

## 4.2 Agregados secundários

### Agregado `ProdutoQuimico`
- **Raiz:** ProdutoQuimico (entidade única, sem filhos)
- **Regras protegidas:** nome e classe de risco obrigatórios; inativação controlada
- **Justificativa da fronteira:** o produto vive de forma independente da carga (catálogo); a carga o referencia por ID, evitando carregar o produto inteiro em cada operação de carga.

### Agregado `ResponsavelTecnico`
- **Raiz:** ResponsavelTecnico
- **Regras protegidas:** registro profissional obrigatório; ativação/inativação

### Agregado `AreaArmazenamento`
- **Raiz:** AreaArmazenamento
- **Regras protegidas:** capacidade máxima, classes de risco permitidas
- **Observação:** alocação de cargas em áreas é **evolução futura**; modelada desde já para não exigir remodelagem.

## 4.3 Diretrizes de fronteira adotadas

1. **Referência entre agregados apenas por ID tipado** — nunca por objeto carregado, evitando acoplamento e consultas cascateadas;
2. **Um agregado por transação** — alterações que envolvem dois agregados serão coordenadas pela camada de aplicação (caso de uso), não por vínculo direto no domínio;
3. **Modificação de entidades internas somente via raiz** — `DocumentoCarga` e `Inspecao` não têm repositório próprio; são persistidos junto com a carga;
4. **Tamanho pequeno de agregado** — o histórico, se crescer demais, poderá virar consulta especializada (CQRS) em fase futura, sem mudar o modelo de escrita.
