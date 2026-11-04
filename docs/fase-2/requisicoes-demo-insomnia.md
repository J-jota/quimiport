# Requisições da Demonstração — Insomnia

Sequência ordenada de chamadas para a gravação, alinhada ao [roteiro do vídeo](./roteiro-video.md) (seções 4:10 em diante). Base URL: `http://localhost:3000`.

**Preparação:** `docker compose up -d db` e `npm run dev` rodando. Todas as chamadas com corpo usam header `Content-Type: application/json`.

**Dica Insomnia:** após cada `POST` de criação, use a tag *Response → Body Attribute* (`_.id`) para referenciar o ID criado nas chamadas seguintes, sem copiar e colar. Se preferir, copie manualmente os IDs para os placeholders `{{produtoId}}`, `{{responsavelId}}`, `{{cargaId}}`, `{{docFispqId}}`, `{{docCeId}}` e `{{carga2Id}}`.

---

## Parte 1 — Produtos químicos (roteiro 4:10)

### 1. Criar produto químico
`POST /produtos-quimicos` → **201**
```json
{
  "nome": "Metanol",
  "descricao": "Álcool metílico",
  "numeroOnu": "ONU 1230",
  "classeRisco": "INFLAMAVEL",
  "grupoCompatibilidade": "A"
}
```
> Guarde o `id` da resposta → `{{produtoId}}`

### 2. Listar produtos
`GET /produtos-quimicos` → **200**

### 3. (Erro) Criar produto sem nome — RN-08
`POST /produtos-quimicos` → **400** ou **422**
```json
{
  "nome": "",
  "numeroOnu": "ONU 1993",
  "classeRisco": "TOXICO",
  "grupoCompatibilidade": "C"
}
```

### 4. (Erro) Criar produto sem classe de risco — RN-09
`POST /produtos-quimicos` → **400**
```json
{
  "nome": "Produto sem classe",
  "numeroOnu": "ONU 1993",
  "grupoCompatibilidade": "C"
}
```

---

## Parte 2 — Responsável técnico (roteiro 4:50)

### 5. Criar responsável técnico
`POST /responsaveis-tecnicos` → **201**
```json
{
  "nome": "Maria Química",
  "conselho": "CRQ",
  "numeroRegistro": "12345",
  "especialidade": "Química industrial"
}
```
> Guarde o `id` da resposta → `{{responsavelId}}`

---

## Parte 3 — Cargas químicas (roteiro 4:50)

### 6. Registrar carga química
`POST /cargas-quimicas` → **201** (status inicial `REGISTRADA`)
```json
{
  "codigo": "CG-2026-0001",
  "produtoQuimicoId": "{{produtoId}}",
  "quantidade": 1200,
  "unidadeMedida": "KG",
  "responsavelTecnicoId": "{{responsavelId}}",
  "origem": "Terminal 10 — Santos/SP",
  "destino": "Armazém B — Cubatão/SP"
}
```
> Guarde o `id` da resposta → `{{cargaId}}`

### 7. Listar cargas (com filtro por status — UC-10)
`GET /cargas-quimicas` → **200**
`GET /cargas-quimicas?status=REGISTRADA` → **200**

### 8. (Erro) Registrar carga com quantidade zero — RN-11
`POST /cargas-quimicas` → **400** ou **422**
```json
{
  "codigo": "CG-2026-0002",
  "produtoQuimicoId": "{{produtoId}}",
  "quantidade": 0,
  "unidadeMedida": "KG",
  "responsavelTecnicoId": "{{responsavelId}}",
  "origem": "Terminal 10 — Santos/SP",
  "destino": "Armazém B — Cubatão/SP"
}
```

---

## Parte 4 — Regra em destaque: RN-04 e máquina de estados (roteiro 5:40)

### 9. Iniciar análise documental
`PATCH /cargas-quimicas/{{cargaId}}/status` → **200** (`EM_ANALISE`)
```json
{
  "status": "EM_ANALISE",
  "ator": "analista.doc"
}
```

### 10. (Erro) Liberar sem documentação obrigatória — RN-04
`PATCH /cargas-quimicas/{{cargaId}}/liberar` → **422** (`erro.codigo: "RN-04"`)
```json
{
  "ator": "gestor.operacional",
  "motivo": "Tentativa sem documentação"
}
```

### 11. Anexar FISPQ
`POST /cargas-quimicas/{{cargaId}}/documentos` → **201**
```json
{
  "tipo": "FISPQ",
  "numero": "FISPQ-2026-001",
  "dataEmissao": "2026-01-10T00:00:00.000Z",
  "dataValidade": "2027-01-10T00:00:00.000Z"
}
```
> Guarde o `id` do último item de `documentos` na resposta → `{{docFispqId}}`

### 12. Anexar Conhecimento de Embarque
`POST /cargas-quimicas/{{cargaId}}/documentos` → **201**
```json
{
  "tipo": "CONHECIMENTO_EMBARQUE",
  "numero": "CE-2026-001",
  "dataEmissao": "2026-01-10T00:00:00.000Z"
}
```
> Guarde o `id` do último documento → `{{docCeId}}`

### 13. Validar os dois documentos
`PATCH /cargas-quimicas/{{cargaId}}/documentos/{{docFispqId}}/validar` → **200**
`PATCH /cargas-quimicas/{{cargaId}}/documentos/{{docCeId}}/validar` → **200**

### 14. Liberar a carga (agora com documentação completa)
`PATCH /cargas-quimicas/{{cargaId}}/liberar` → **200** (`LIBERADA`)
```json
{
  "ator": "gestor.operacional",
  "motivo": "Documentação aprovada"
}
```

### 15. Iniciar movimentação
`PATCH /cargas-quimicas/{{cargaId}}/status` → **200** (`EM_MOVIMENTACAO`)
```json
{
  "status": "EM_MOVIMENTACAO",
  "ator": "operador.portuario",
  "motivo": "Saída para o terminal"
}
```

### 16. Finalizar a carga
`PATCH /cargas-quimicas/{{cargaId}}/status` → **200** (`FINALIZADA`)
```json
{
  "status": "FINALIZADA",
  "ator": "operador.portuario",
  "motivo": "Operação concluída"
}
```

### 17. Consultar histórico (trilha de auditoria — RN-13/RN-17)
`GET /cargas-quimicas/{{cargaId}}/historico` → **200** (5 eventos em ordem cronológica)

---

## Parte 5 (opcional) — Bloqueio, inspeção e cancelamento

Reforça RN-05, RN-15 e RN-06 se houver tempo na gravação.

### 18. Registrar segunda carga
`POST /cargas-quimicas` → **201** (mesmo corpo do passo 6, trocando `"codigo"` para `"CG-2026-0003"`)
> Guarde o `id` → `{{carga2Id}}`

### 19. Iniciar análise da segunda carga
`PATCH /cargas-quimicas/{{carga2Id}}/status` → **200**
```json
{ "status": "EM_ANALISE", "ator": "analista.doc" }
```

### 20. Bloquear a carga
`PATCH /cargas-quimicas/{{carga2Id}}/bloquear` → **200** (`BLOQUEADA`)
```json
{
  "ator": "gestor.operacional",
  "motivo": "Pendência documental identificada"
}
```

### 21. (Erro) Movimentar carga bloqueada — RN-05
`PATCH /cargas-quimicas/{{carga2Id}}/status` → **422** (`TRANSICAO_INVALIDA`)
```json
{ "status": "EM_MOVIMENTACAO", "ator": "operador.portuario" }
```

### 22. Desbloquear (retorna para EM_ANALISE)
`PATCH /cargas-quimicas/{{carga2Id}}/status` → **200**
```json
{ "status": "EM_ANALISE", "ator": "gestor.operacional", "motivo": "Pendência regularizada" }
```

### 23. Solicitar inspeção
`POST /cargas-quimicas/{{carga2Id}}/inspecoes` → **201** (`EM_INSPECAO`)
```json
{
  "motivo": "Verificação de lacres e avarias",
  "ator": "analista.qualidade"
}
```
> Guarde o `id` do último item de `inspecoes` → `{{inspecaoId}}`

### 24. Registrar inspeção REPROVADA — RN-15 (bloqueio automático)
`PATCH /cargas-quimicas/{{carga2Id}}/inspecoes/{{inspecaoId}}/resultado` → **200** (`BLOQUEADA`)
```json
{
  "resultado": "REPROVADA",
  "inspetor": "inspetor.1",
  "ator": "inspetor.1"
}
```

### 25. Cancelar a carga
`PATCH /cargas-quimicas/{{carga2Id}}/cancelar` → **200** (`CANCELADA`)
```json
{
  "ator": "gestor.operacional",
  "motivo": "Desistência do embarque"
}
```

### 26. (Erro) Liberar carga cancelada — RN-06
`PATCH /cargas-quimicas/{{carga2Id}}/liberar` → **422**
```json
{ "ator": "gestor.operacional" }
```

---

## Referência rápida de erros esperados

| Passo | HTTP | Código |
|---|---|---|
| 3 | 400/422 | RN-08 |
| 4 | 400 | classe de risco ausente (RN-09) |
| 8 | 400/422 | RN-11 |
| 10 | 422 | RN-04 |
| 21 | 422 | TRANSICAO_INVALIDA (RN-05) |
| 26 | 422 | TRANSICAO_INVALIDA / RN-04 (RN-06) |
