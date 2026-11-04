import type { FastifyInstance } from 'fastify';

import type {
  AcaoCargaInput,
  AnexarDocumentoInput,
  AtualizarStatusInput,
  RegistrarCargaInput,
  RegistrarResultadoInspecaoInput,
  SolicitarInspecaoInput,
} from '../../../application/dtos/carga-dtos.js';
import type { CasosDeUso } from '../container.js';
import {
  acaoCargaBodySchema,
  acaoComMotivoBodySchema,
  atualizarStatusBodySchema,
  cargaBodySchema,
  documentoBodySchema,
  filtroStatusQuerySchema,
  idParamSchema,
  inspecaoBodySchema,
  respostaLista,
  respostaObjeto,
  resultadoInspecaoBodySchema,
  respostasErro,
} from '../schemas/schemas.js';

export function rotasCargas(app: FastifyInstance, uc: CasosDeUso): void {
  app.post(
    '/cargas-quimicas',
    {
      schema: {
        tags: ['Cargas Químicas'],
        summary: 'Registrar carga química (UC-03)',
        description:
          'RN-01: produto associado obrigatório. RN-02/RN-10: produto deve estar ativo. ' +
          'RN-11: quantidade > 0. RN-12: responsável técnico obrigatório. ' +
          'RN-03: classificação de risco herdada do produto.',
        body: cargaBodySchema,
        response: { 201: { description: 'Carga registrada', ...respostaObjeto }, ...respostasErro },
      },
    },
    async (request, reply) => {
      const carga = await uc.registrarCarga.executar(request.body as RegistrarCargaInput);
      request.log.info({ cargaId: carga.id, codigo: carga.codigo }, 'carga química registrada');
      return reply.status(201).send(carga);
    },
  );

  app.get(
    '/cargas-quimicas',
    {
      schema: {
        tags: ['Cargas Químicas'],
        summary: 'Listar cargas químicas (UC-10)',
        description: 'Filtro opcional por status (?status=REGISTRADA).',
        querystring: filtroStatusQuerySchema,
        response: { 200: { description: 'Lista de cargas', ...respostaLista }, ...respostasErro },
      },
    },
    async (request) => {
      const { status } = request.query as { status?: string };
      return uc.listarCargas.executar(status !== undefined ? { status } : undefined);
    },
  );

  app.get(
    '/cargas-quimicas/:id',
    {
      schema: {
        tags: ['Cargas Químicas'],
        summary: 'Buscar carga química por identificador',
        params: idParamSchema,
        response: { 200: { description: 'Carga', ...respostaObjeto }, ...respostasErro },
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      return uc.buscarCarga.executar(id);
    },
  );

  app.get(
    '/cargas-quimicas/:id/historico',
    {
      schema: {
        tags: ['Cargas Químicas'],
        summary: 'Consultar histórico da carga (UC-11)',
        description: 'RN-17: trilha de auditoria imutável, somente leitura.',
        params: idParamSchema,
        response: { 200: { description: 'Eventos do histórico', ...respostaLista }, ...respostasErro },
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      return uc.consultarHistorico.executar(id);
    },
  );

  app.post(
    '/cargas-quimicas/:id/documentos',
    {
      schema: {
        tags: ['Cargas Químicas'],
        summary: 'Anexar documento à carga (UC-04)',
        description:
          'RN-04: liberação exige FISPQ e CONHECIMENTO_EMBARQUE válidos e validados. ' +
          'RN-14: documento vencido não conta como válido.',
        params: idParamSchema,
        body: documentoBodySchema,
        response: { 201: { description: 'Carga com o documento anexado', ...respostaObjeto }, ...respostasErro },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const carga = await uc.anexarDocumento.executar(id, request.body as AnexarDocumentoInput);
      request.log.info({ cargaId: id }, 'documento anexado à carga');
      return reply.status(201).send(carga);
    },
  );

  app.patch(
    '/cargas-quimicas/:id/documentos/:documentoId/validar',
    {
      schema: {
        tags: ['Cargas Químicas'],
        summary: 'Validar documento da carga (UC-04)',
        params: {
          type: 'object',
          properties: { id: { type: 'string' }, documentoId: { type: 'string' } },
        },
        response: { 200: { description: 'Carga atualizada', ...respostaObjeto }, ...respostasErro },
      },
    },
    async (request, reply) => {
      const { id, documentoId } = request.params as { id: string; documentoId: string };
      const carga = await uc.validarDocumento.executar(id, documentoId);
      request.log.info({ cargaId: id, documentoId }, 'documento validado');
      return reply.send(carga);
    },
  );

  app.post(
    '/cargas-quimicas/:id/inspecoes',
    {
      schema: {
        tags: ['Cargas Químicas'],
        summary: 'Solicitar inspeção (UC-05)',
        description: 'A carga transiciona para EM_INSPECAO.',
        params: idParamSchema,
        body: inspecaoBodySchema,
        response: { 201: { description: 'Carga em inspeção', ...respostaObjeto }, ...respostasErro },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const carga = await uc.solicitarInspecao.executar(id, request.body as SolicitarInspecaoInput);
      request.log.info({ cargaId: id }, 'inspeção solicitada');
      return reply.status(201).send(carga);
    },
  );

  app.patch(
    '/cargas-quimicas/:id/inspecoes/:inspecaoId/resultado',
    {
      schema: {
        tags: ['Cargas Químicas'],
        summary: 'Registrar resultado da inspeção',
        description: 'RN-15: resultado REPROVADA bloqueia automaticamente a carga.',
        params: {
          type: 'object',
          properties: { id: { type: 'string' }, inspecaoId: { type: 'string' } },
        },
        body: resultadoInspecaoBodySchema,
        response: { 200: { description: 'Carga atualizada', ...respostaObjeto }, ...respostasErro },
      },
    },
    async (request, reply) => {
      const { id, inspecaoId } = request.params as { id: string; inspecaoId: string };
      const carga = await uc.registrarResultadoInspecao.executar(
        id,
        inspecaoId,
        request.body as RegistrarResultadoInspecaoInput,
      );
      request.log.info({ cargaId: id, inspecaoId, status: carga.status }, 'resultado de inspeção registrado');
      return reply.send(carga);
    },
  );

  app.patch(
    '/cargas-quimicas/:id/status',
    {
      schema: {
        tags: ['Cargas Químicas'],
        summary: 'Atualizar status da carga (UC-08)',
        description:
          'Transições operacionais: iniciar análise (EM_ANALISE), desbloquear (EM_ANALISE a partir de BLOQUEADA), ' +
          'iniciar movimentação (EM_MOVIMENTACAO) e finalizar (FINALIZADA).',
        params: idParamSchema,
        body: atualizarStatusBodySchema,
        response: { 200: { description: 'Carga atualizada', ...respostaObjeto }, ...respostasErro },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const carga = await uc.atualizarStatusCarga.executar(id, request.body as AtualizarStatusInput);
      request.log.info({ cargaId: id, status: carga.status }, 'status da carga atualizado');
      return reply.send(carga);
    },
  );

  app.patch(
    '/cargas-quimicas/:id/liberar',
    {
      schema: {
        tags: ['Cargas Químicas'],
        summary: 'Liberar carga química (UC-06)',
        description:
          'RN-04: documentação obrigatória completa, válida e validada. ' +
          'Vinda de inspeção, exige resultado APROVADA. RN-06: carga cancelada não pode ser liberada.',
        params: idParamSchema,
        body: acaoCargaBodySchema,
        response: { 200: { description: 'Carga liberada', ...respostaObjeto }, ...respostasErro },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const carga = await uc.liberarCarga.executar(id, request.body as AcaoCargaInput);
      request.log.info({ cargaId: id }, 'carga liberada');
      return reply.send(carga);
    },
  );

  app.patch(
    '/cargas-quimicas/:id/bloquear',
    {
      schema: {
        tags: ['Cargas Químicas'],
        summary: 'Bloquear carga química (UC-07)',
        description: 'Motivo obrigatório. RN-05: carga bloqueada não pode entrar em movimentação.',
        params: idParamSchema,
        body: acaoComMotivoBodySchema,
        response: { 200: { description: 'Carga bloqueada', ...respostaObjeto }, ...respostasErro },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const carga = await uc.bloquearCarga.executar(id, request.body as AcaoCargaInput);
      request.log.info({ cargaId: id }, 'carga bloqueada');
      return reply.send(carga);
    },
  );

  app.patch(
    '/cargas-quimicas/:id/cancelar',
    {
      schema: {
        tags: ['Cargas Químicas'],
        summary: 'Cancelar carga química (UC-09)',
        description: 'RN-06/RN-16: CANCELADA é estado terminal. Motivo obrigatório.',
        params: idParamSchema,
        body: acaoComMotivoBodySchema,
        response: { 200: { description: 'Carga cancelada', ...respostaObjeto }, ...respostasErro },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const carga = await uc.cancelarCarga.executar(id, request.body as AcaoCargaInput);
      request.log.info({ cargaId: id }, 'carga cancelada');
      return reply.send(carga);
    },
  );
}
