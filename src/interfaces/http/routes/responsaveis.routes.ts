import type { FastifyInstance } from 'fastify';

import type { CriarResponsavelInput } from '../../../application/dtos/responsavel-dtos.js';
import type { CasosDeUso } from '../container.js';
import { idParamSchema, respostaLista, respostaObjeto, responsavelBodySchema, respostasErro } from '../schemas/schemas.js';

export function rotasResponsaveis(app: FastifyInstance, uc: CasosDeUso): void {
  app.post(
    '/responsaveis-tecnicos',
    {
      schema: {
        tags: ['Responsáveis Técnicos'],
        summary: 'Cadastrar responsável técnico',
        body: responsavelBodySchema,
        response: { 201: { description: 'Responsável criado', ...respostaObjeto }, ...respostasErro },
      },
    },
    async (request, reply) => {
      const responsavel = await uc.criarResponsavel.executar(request.body as CriarResponsavelInput);
      request.log.info({ responsavelId: responsavel.id }, 'responsável técnico criado');
      return reply.status(201).send(responsavel);
    },
  );

  app.get(
    '/responsaveis-tecnicos',
    {
      schema: {
        tags: ['Responsáveis Técnicos'],
        summary: 'Listar responsáveis técnicos',
        response: { 200: { description: 'Lista de responsáveis', ...respostaLista } },
      },
    },
    async () => uc.listarResponsaveis.executar(),
  );

  app.get(
    '/responsaveis-tecnicos/:id',
    {
      schema: {
        tags: ['Responsáveis Técnicos'],
        summary: 'Buscar responsável técnico por identificador',
        params: idParamSchema,
        response: { 200: { description: 'Responsável', ...respostaObjeto }, ...respostasErro },
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      return uc.buscarResponsavel.executar(id);
    },
  );
}
