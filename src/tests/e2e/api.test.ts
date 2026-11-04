import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { buildApp } from '../../interfaces/http/app.js';
import {
  InMemoryCargaQuimicaRepository,
  InMemoryProdutoQuimicoRepository,
  InMemoryResponsavelTecnicoRepository,
} from '../../infrastructure/persistence/in-memory/repositorios.js';
import { ClockFake } from '../fixtures/ClockFake.js';

/**
 * Testes e2e da API REST (Fastify inject, repositórios em memória).
 * Cobrem os critérios de aceite CA-02, CA-03 e CA-04 via HTTP.
 */
describe('API QuimiPort (e2e)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp({
      repositorios: {
        produtos: new InMemoryProdutoQuimicoRepository(),
        responsaveis: new InMemoryResponsavelTecnicoRepository(),
        cargas: new InMemoryCargaQuimicaRepository(),
      },
      clock: new ClockFake(),
      logger: false,
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  async function criarProduto(overrides: object = {}) {
    const res = await app.inject({
      method: 'POST',
      url: '/produtos-quimicos',
      payload: {
        nome: 'Ácido Sulfúrico',
        descricao: 'Ácido mineral forte',
        numeroOnu: 'ONU 1830',
        classeRisco: 'CORROSIVO',
        grupoCompatibilidade: 'B',
        ...overrides,
      },
    });
    return res;
  }

  async function criarResponsavel() {
    const res = await app.inject({
      method: 'POST',
      url: '/responsaveis-tecnicos',
      payload: { nome: 'Maria Química', conselho: 'CRQ', numeroRegistro: '12345' },
    });
    return res.json();
  }

  async function criarCarga(produtoId: string, responsavelId: string, overrides: object = {}) {
    const res = await app.inject({
      method: 'POST',
      url: '/cargas-quimicas',
      payload: {
        codigo: `CG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        produtoQuimicoId: produtoId,
        quantidade: 500,
        unidadeMedida: 'KG',
        responsavelTecnicoId: responsavelId,
        origem: 'Terminal 10 — Santos/SP',
        destino: 'Armazém B — Cubatão/SP',
        ...overrides,
      },
    });
    return res;
  }

  async function cargaComDocumentacaoValidada(cargaId: string) {
    for (const tipo of ['FISPQ', 'CONHECIMENTO_EMBARQUE']) {
      const doc = await app.inject({
        method: 'POST',
        url: `/cargas-quimicas/${cargaId}/documentos`,
        payload: {
          tipo,
          numero: `${tipo}-001`,
          dataEmissao: '2026-01-10T00:00:00.000Z',
          dataValidade: '2027-01-10T00:00:00.000Z',
        },
      });
      const carga = doc.json();
      const documentoId = carga.documentos.at(-1).id;
      await app.inject({
        method: 'PATCH',
        url: `/cargas-quimicas/${cargaId}/documentos/${documentoId}/validar`,
      });
    }
  }

  it('GET /health responde ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('ok');
  });

  it('POST /produtos-quimicos cria produto (201) e GET lista/busca', async () => {
    const criado = await criarProduto();
    expect(criado.statusCode).toBe(201);
    const produto = criado.json();
    expect(produto.ativo).toBe(true);

    const lista = await app.inject({ method: 'GET', url: '/produtos-quimicos' });
    expect(lista.json()).toHaveLength(1);

    const busca = await app.inject({ method: 'GET', url: `/produtos-quimicos/${produto.id}` });
    expect(busca.statusCode).toBe(200);

    const inexistente = await app.inject({ method: 'GET', url: '/produtos-quimicos/zzz' });
    expect(inexistente.statusCode).toBe(404);
  });

  it('RN-08: POST /produtos-quimicos sem nome retorna 400 (schema) ou 422 (domínio)', async () => {
    const semNome = await criarProduto({ nome: '' });
    expect([400, 422]).toContain(semNome.statusCode);
  });

  it('RN-09: POST /produtos-quimicos sem classe de risco retorna 400', async () => {
    const payload = await app.inject({
      method: 'POST',
      url: '/produtos-quimicos',
      payload: { nome: 'Produto X', numeroOnu: 'ONU 1993', grupoCompatibilidade: 'A' },
    });
    expect(payload.statusCode).toBe(400);
  });

  it('PUT e PATCH /inativar atualizam e inativam produto', async () => {
    const produto = (await criarProduto()).json();

    const atualizado = await app.inject({
      method: 'PUT',
      url: `/produtos-quimicos/${produto.id}`,
      payload: { descricao: 'Nova descrição' },
    });
    expect(atualizado.statusCode).toBe(200);
    expect(atualizado.json().descricao).toBe('Nova descrição');

    const inativado = await app.inject({
      method: 'PATCH',
      url: `/produtos-quimicos/${produto.id}/inativar`,
    });
    expect(inativado.statusCode).toBe(200);
    expect(inativado.json().ativo).toBe(false);
  });

  it('RN-02: POST /cargas-quimicas com produto inativo retorna 422', async () => {
    const produto = (await criarProduto()).json();
    const responsavel = await criarResponsavel();
    await app.inject({ method: 'PATCH', url: `/produtos-quimicos/${produto.id}/inativar` });

    const res = await criarCarga(produto.id, responsavel.id);
    expect(res.statusCode).toBe(422);
    expect(res.json().erro.codigo).toBe('RN-02');
  });

  it('RN-11: POST /cargas-quimicas com quantidade zero retorna 400/422', async () => {
    const produto = (await criarProduto()).json();
    const responsavel = await criarResponsavel();

    const res = await criarCarga(produto.id, responsavel.id, { quantidade: 0 });
    expect([400, 422]).toContain(res.statusCode);
  });

  it('RN-12: POST /cargas-quimicas com responsável inexistente retorna 404', async () => {
    const produto = (await criarProduto()).json();

    const res = await criarCarga(produto.id, 'a4f5c0f0-0000-4000-8000-000000000000');
    expect(res.statusCode).toBe(404);
    expect(res.json().erro.tipo).toBe('NAO_ENCONTRADO');
  });

  it('fluxo feliz: registro → documentos → análise → liberação → movimentação → finalização', async () => {
    const produto = (await criarProduto()).json();
    const responsavel = await criarResponsavel();
    const carga = (await criarCarga(produto.id, responsavel.id)).json();
    expect(carga.status).toBe('REGISTRADA');

    await cargaComDocumentacaoValidada(carga.id);

    const analise = await app.inject({
      method: 'PATCH',
      url: `/cargas-quimicas/${carga.id}/status`,
      payload: { status: 'EM_ANALISE', ator: 'analista.doc' },
    });
    expect(analise.json().status).toBe('EM_ANALISE');

    const liberada = await app.inject({
      method: 'PATCH',
      url: `/cargas-quimicas/${carga.id}/liberar`,
      payload: { ator: 'gestor.operacional', motivo: 'Documentação aprovada' },
    });
    expect(liberada.statusCode).toBe(200);
    expect(liberada.json().status).toBe('LIBERADA');

    const movimentacao = await app.inject({
      method: 'PATCH',
      url: `/cargas-quimicas/${carga.id}/status`,
      payload: { status: 'EM_MOVIMENTACAO', ator: 'operador' },
    });
    expect(movimentacao.json().status).toBe('EM_MOVIMENTACAO');

    const finalizada = await app.inject({
      method: 'PATCH',
      url: `/cargas-quimicas/${carga.id}/status`,
      payload: { status: 'FINALIZADA', ator: 'operador' },
    });
    expect(finalizada.json().status).toBe('FINALIZADA');

    const historico = await app.inject({ method: 'GET', url: `/cargas-quimicas/${carga.id}/historico` });
    expect(historico.json()).toHaveLength(5);
  });

  it('RN-04: liberação sem documentação obrigatória retorna 422', async () => {
    const produto = (await criarProduto()).json();
    const responsavel = await criarResponsavel();
    const carga = (await criarCarga(produto.id, responsavel.id)).json();

    await app.inject({
      method: 'PATCH',
      url: `/cargas-quimicas/${carga.id}/status`,
      payload: { status: 'EM_ANALISE', ator: 'analista.doc' },
    });

    const liberacao = await app.inject({
      method: 'PATCH',
      url: `/cargas-quimicas/${carga.id}/liberar`,
      payload: { ator: 'gestor' },
    });
    expect(liberacao.statusCode).toBe(422);
    expect(liberacao.json().erro.codigo).toBe('RN-04');
  });

  it('RN-05: movimentação de carga bloqueada retorna 422', async () => {
    const produto = (await criarProduto()).json();
    const responsavel = await criarResponsavel();
    const carga = (await criarCarga(produto.id, responsavel.id)).json();

    await app.inject({
      method: 'PATCH',
      url: `/cargas-quimicas/${carga.id}/status`,
      payload: { status: 'EM_ANALISE', ator: 'analista.doc' },
    });
    const bloqueio = await app.inject({
      method: 'PATCH',
      url: `/cargas-quimicas/${carga.id}/bloquear`,
      payload: { ator: 'gestor', motivo: 'Pendência documental' },
    });
    expect(bloqueio.json().status).toBe('BLOQUEADA');

    const movimentacao = await app.inject({
      method: 'PATCH',
      url: `/cargas-quimicas/${carga.id}/status`,
      payload: { status: 'EM_MOVIMENTACAO', ator: 'operador' },
    });
    expect(movimentacao.statusCode).toBe(422);
    expect(movimentacao.json().erro.codigo).toBe('TRANSICAO_INVALIDA');
  });

  it('RN-15: inspeção reprovada bloqueia a carga automaticamente', async () => {
    const produto = (await criarProduto()).json();
    const responsavel = await criarResponsavel();
    const carga = (await criarCarga(produto.id, responsavel.id)).json();
    await cargaComDocumentacaoValidada(carga.id);

    await app.inject({
      method: 'PATCH',
      url: `/cargas-quimicas/${carga.id}/status`,
      payload: { status: 'EM_ANALISE', ator: 'analista.doc' },
    });
    const emInspecao = await app.inject({
      method: 'POST',
      url: `/cargas-quimicas/${carga.id}/inspecoes`,
      payload: { motivo: 'Verificação de lacres', ator: 'analista.qualidade' },
    });
    expect(emInspecao.json().status).toBe('EM_INSPECAO');
    const inspecaoId = emInspecao.json().inspecoes.at(-1).id;

    const resultado = await app.inject({
      method: 'PATCH',
      url: `/cargas-quimicas/${carga.id}/inspecoes/${inspecaoId}/resultado`,
      payload: { resultado: 'REPROVADA', inspetor: 'inspetor.1', ator: 'inspetor.1' },
    });
    expect(resultado.json().status).toBe('BLOQUEADA');
  });

  it('RN-06/RN-16: carga cancelada é terminal — liberação retorna 422', async () => {
    const produto = (await criarProduto()).json();
    const responsavel = await criarResponsavel();
    const carga = (await criarCarga(produto.id, responsavel.id)).json();
    await cargaComDocumentacaoValidada(carga.id);
    await app.inject({
      method: 'PATCH',
      url: `/cargas-quimicas/${carga.id}/status`,
      payload: { status: 'EM_ANALISE', ator: 'analista.doc' },
    });

    const cancelada = await app.inject({
      method: 'PATCH',
      url: `/cargas-quimicas/${carga.id}/cancelar`,
      payload: { ator: 'gestor', motivo: 'Erro de registro' },
    });
    expect(cancelada.json().status).toBe('CANCELADA');

    const liberacao = await app.inject({
      method: 'PATCH',
      url: `/cargas-quimicas/${carga.id}/liberar`,
      payload: { ator: 'gestor' },
    });
    expect(liberacao.statusCode).toBe(422);
  });

  it('RN-07: finalização sem liberação retorna 422', async () => {
    const produto = (await criarProduto()).json();
    const responsavel = await criarResponsavel();
    const carga = (await criarCarga(produto.id, responsavel.id)).json();

    const finalizacao = await app.inject({
      method: 'PATCH',
      url: `/cargas-quimicas/${carga.id}/status`,
      payload: { status: 'FINALIZADA', ator: 'operador' },
    });
    expect(finalizacao.statusCode).toBe(422);
    expect(finalizacao.json().erro.codigo).toBe('TRANSICAO_INVALIDA');
  });

  it('GET /cargas-quimicas?status= filtra por status (UC-10)', async () => {
    const produto = (await criarProduto()).json();
    const responsavel = await criarResponsavel();
    const carga = (await criarCarga(produto.id, responsavel.id)).json();
    await criarCarga(produto.id, responsavel.id);
    await app.inject({
      method: 'PATCH',
      url: `/cargas-quimicas/${carga.id}/cancelar`,
      payload: { ator: 'gestor', motivo: 'Desistência' },
    });

    const todas = await app.inject({ method: 'GET', url: '/cargas-quimicas' });
    expect(todas.json()).toHaveLength(2);

    const canceladas = await app.inject({ method: 'GET', url: '/cargas-quimicas?status=CANCELADA' });
    expect(canceladas.json()).toHaveLength(1);

    const invalido = await app.inject({ method: 'GET', url: '/cargas-quimicas?status=FOO' });
    expect(invalido.statusCode).toBe(400);
  });

  it('documentação Swagger disponível em /docs e /docs/json', async () => {
    const json = await app.inject({ method: 'GET', url: '/docs/json' });
    expect(json.statusCode).toBe(200);
    const spec = json.json();
    expect(spec.info.title).toBe('QuimiPort API');
    expect(Object.keys(spec.paths)).toContain('/produtos-quimicos');
    expect(Object.keys(spec.paths)).toContain('/cargas-quimicas/{id}/liberar');
  });
});
