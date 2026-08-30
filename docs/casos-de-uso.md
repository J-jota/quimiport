# Casos de Uso Planejados

Mapeamento dos casos de uso do QuimiPort. Cada UC referencia as regras de negócio (RN-XX) do catálogo em [`dominio/05-regras-de-negocio.md`](./dominio/05-regras-de-negocio.md).

---

## UC-01 — Cadastrar Produto Químico

| Campo | Descrição |
|---|---|
| **Objetivo** | Incluir um novo produto químico no catálogo |
| **Ator** | Administrador do Sistema |
| **Entrada** | nome, classeRisco, numeroOnu, descrição (opcional) |
| **Saída** | Produto criado com `ativo = true` e ID gerado |
| **Regras** | RN-08, RN-09 |
| **Erros/Exceções** | Nome ausente ou vazio → `DomainError`; classe de risco ausente/inválida → `DomainError`; número ONU em formato inválido → `DomainError`; produto duplicado (mesmo nome) → `ConflictError` |

## UC-02 — Inativar Produto Químico

| Campo | Descrição |
|---|---|
| **Objetivo** | Impedir que um produto seja usado em novas cargas, preservando o histórico |
| **Ator** | Administrador do Sistema |
| **Entrada** | produtoQuimicoId |
| **Saída** | Produto com `ativo = false` |
| **Regras** | RN-10 (efeito da inativação) |
| **Erros/Exceções** | Produto não encontrado → `NotFoundError`; produto já inativo → `DomainError` |

## UC-03 — Registrar Carga Química

| Campo | Descrição |
|---|---|
| **Objetivo** | Dar entrada de uma nova carga química no pátio |
| **Ator** | Operador Portuário |
| **Entrada** | produtoQuimicoId, quantidade, unidadeMedida, responsavelTecnicoId |
| **Saída** | Carga criada com status `REGISTRADA`, classificação de risco herdada do produto e primeiro evento no histórico |
| **Regras** | RN-01, RN-02, RN-03, RN-11, RN-12, RN-13 |
| **Erros/Exceções** | Produto inexistente → `NotFoundError`; produto inativo → `DomainError`; quantidade ≤ 0 → `DomainError`; responsável técnico inexistente → `NotFoundError` |

## UC-04 — Validar Documentação da Carga

| Campo | Descrição |
|---|---|
| **Objetivo** | Anexar e conferir os documentos obrigatórios da carga |
| **Ator** | Analista de Documentação |
| **Entrada** | cargaId, documentos (tipo, número, datas de emissão/validade, arquivo) |
| **Saída** | Documentos registrados e marcados como validados; carga transiciona para `EM_VALIDACAO` (se estava `REGISTRADA`) |
| **Regras** | RN-04 (preparação), RN-13, RN-14 |
| **Erros/Exceções** | Carga não encontrada → `NotFoundError`; documento com validade vencida é aceito mas **não conta** para liberação; tipo de documento desconhecido → `DomainError`; carga em status terminal → `DomainError` |

## UC-05 — Solicitar Inspeção

| Campo | Descrição |
|---|---|
| **Objetivo** | Solicitar verificação técnica da carga |
| **Ator** | Operador Portuário / Analista de Qualidade |
| **Entrada** | cargaId, motivo |
| **Saída** | Inspeção criada com resultado `PENDENTE`; carga transiciona para `EM_INSPECAO` |
| **Regras** | RN-13 |
| **Erros/Exceções** | Carga em status não permitido (LIBERADA, FINALIZADA, CANCELADA) → `DomainError`; motivo vazio → `DomainError` |

## UC-06 — Liberar Carga Química

| Campo | Descrição |
|---|---|
| **Objetivo** | Autorizar a movimentação da carga após todas as validações de segurança |
| **Ator** | Gestor Operacional / Responsável Técnico |
| **Entrada** | cargaId, ator, motivo |
| **Saída** | Carga com status `LIBERADA` + evento no histórico |
| **Regras** | RN-04, RN-05, RN-06, RN-13; se veio de inspeção, exige resultado APROVADA |
| **Erros/Exceções** | Documentação obrigatória incompleta/vencida/não validada → `DomainError`; carga `BLOQUEADA` sem regularização → `DomainError`; carga `CANCELADA` → `DomainError`; transição não permitida → `DomainError` |

## UC-07 — Bloquear Carga Química

| Campo | Descrição |
|---|---|
| **Objetivo** | Impedir a movimentação da carga por irregularidade ou pendência |
| **Ator** | Gestor Operacional / Responsável Técnico / Analista de Qualidade |
| **Entrada** | cargaId, ator, motivo (obrigatório) |
| **Saída** | Carga com status `BLOQUEADA` + evento no histórico |
| **Regras** | RN-13, RN-15 (bloqueio automático por inspeção reprovada usa este mesmo caminho) |
| **Erros/Exceções** | Carga em status terminal → `DomainError`; motivo ausente → `DomainError` |

## UC-08 — Atualizar Status da Carga (transições internas)

| Campo | Descrição |
|---|---|
| **Objetivo** | Executar transições operacionais: iniciar validação, desbloquear, finalizar |
| **Ator** | Operador Portuário / Gestor Operacional |
| **Entrada** | cargaId, statusDestino, ator, motivo |
| **Saída** | Carga com novo status + evento no histórico |
| **Regras** | RN-05, RN-07, RN-13, RN-16; máquina de estados completa |
| **Erros/Exceções** | Transição inexistente na máquina de estados → `DomainError`; finalização sem liberação prévia → `DomainError` |

## UC-09 — Cancelar Carga Química

| Campo | Descrição |
|---|---|
| **Objetivo** | Encerrar a operação de uma carga por desistência ou erro de registro |
| **Ator** | Gestor Operacional |
| **Entrada** | cargaId, ator, motivo (obrigatório) |
| **Saída** | Carga com status `CANCELADA` (terminal) + evento no histórico |
| **Regras** | RN-06 (efeito), RN-13, RN-16 |
| **Erros/Exceções** | Carga já `FINALIZADA` → `DomainError`; carga já `CANCELADA` → `DomainError` |

## UC-10 — Consultar Cargas por Status

| Campo | Descrição |
|---|---|
| **Objetivo** | Listar cargas filtradas por status para acompanhamento operacional |
| **Ator** | Gestor Operacional / Operador Portuário / Analista de Qualidade |
| **Entrada** | status (obrigatório), filtros opcionais (produto, responsável, período) |
| **Saída** | Lista de cargas com dados resumidos (id, produto, quantidade, status, data) |
| **Regras** | Somente leitura — nenhuma regra de escrita |
| **Erros/Exceções** | Status inválido → `DomainError`; resultado vazio retorna lista vazia (não é erro) |

## UC-11 — Consultar Histórico da Carga

| Campo | Descrição |
|---|---|
| **Objetivo** | Exibir a trilha completa de eventos e transições de uma carga (auditoria) |
| **Ator** | Todos os perfis |
| **Entrada** | cargaId |
| **Saída** | Lista cronológica de `EventoHistorico` (data, status anterior/novo, ator, motivo) |
| **Regras** | RN-17 (histórico imutável — somente leitura) |
| **Erros/Exceções** | Carga não encontrada → `NotFoundError` |

---

## Matriz Ator × Caso de Uso

| Caso de uso | Operador Portuário | Responsável Técnico | Analista Documentação | Analista Qualidade | Gestor Operacional | Administrador |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| UC-01 Cadastrar produto | | | | | | ✅ |
| UC-02 Inativar produto | | | | | | ✅ |
| UC-03 Registrar carga | ✅ | | | | | |
| UC-04 Validar documentação | | | ✅ | | | |
| UC-05 Solicitar inspeção | ✅ | | | ✅ | | |
| UC-06 Liberar carga | | ✅ | | | ✅ | |
| UC-07 Bloquear carga | | ✅ | | ✅ | ✅ | |
| UC-08 Atualizar status | ✅ | | | | ✅ | |
| UC-09 Cancelar carga | | | | | ✅ | |
| UC-10 Consultar por status | ✅ | | | ✅ | ✅ | |
| UC-11 Consultar histórico | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
