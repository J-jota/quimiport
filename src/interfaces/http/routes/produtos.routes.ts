import type { FastifyInstance } from 'fastify';

import type { AtualizarProdutoInput, CriarProdutoInput } from '../../../application/dtos/produto-dtos.js';
import type { CasosDeUso } from '../container.js';
import {
  idParamSchema,
  produtoBodySchema,
  produtoUpdateSchema,
  respostaLista,
  respostaObjeto,
  respostasErro,
} from '../schemas/schemas.js';

export function rotasProdutos(app: FastifyInstance, uc: CasosDeUso): void {
  app.post(
    '/produtos-quimicos',
    {
      schema: {
        tags: ['Produtos Químicos'],
        summary: 'Criar produto químico (UC-01)',
        description: 'RN-08: nome obrigatório. RN-09: classe de risco obrigatória.',
        body: produtoBodySchema,
        response: { 201: { description: 'Produto criado', ...respostaObjeto }, ...respostasErro },
      },
    },
    async (request, reply) => {
      const produto = await uc.criarProduto.executar(request.body as CriarProdutoInput);
      request.log.info({ produtoId: produto.id }, 'produto químico criado');
      return reply.status(201).send(produto);
    },
  );

  app.get(
    '/produtos-quimicos',
    {
      schema: {
        tags: ['Produtos Químicos'],
        summary: 'Listar produtos químicos',
        response: { 200: { description: 'Lista de produtos', ...respostaLista } },
      },
    },
    async () => uc.listarProdutos.executar(),
  );

  app.get(
    '/produtos-quimicos/:id',
    {
      schema: {
        tags: ['Produtos Químicos'],
        summary: 'Buscar produto químico por identificador',
        params: idParamSchema,
        response: { 200: { description: 'Produto', ...respostaObjeto }, ...respostasErro },
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      return uc.buscarProduto.executar(id);
    },
  );

  app.put(
    '/produtos-quimicos/:id',
    {
      schema: {
        tags: ['Produtos Químicos'],
        summary: 'Atualizar produto químico',
        params: idParamSchema,
        body: produtoUpdateSchema,
        response: { 200: { description: 'Produto atualizado', ...respostaObjeto }, ...respostasErro },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const produto = await uc.atualizarProduto.executar(id, request.body as AtualizarProdutoInput);
      request.log.info({ produtoId: id }, 'produto químico atualizado');
      return reply.send(produto);
    },
  );

  app.patch(
    '/produtos-quimicos/:id/inativar',
    {
      schema: {
        tags: ['Produtos Químicos'],
        summary: 'Inativar produto químico (UC-02)',
        description:
          'RN-10: produto inativo não pode ser usado em novas cargas. Cargas existentes são preservadas.',
        params: idParamSchema,
        response: { 200: { description: 'Produto inativado', ...respostaObjeto }, ...respostasErro },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const produto = await uc.inativarProduto.executar(id);
      request.log.info({ produtoId: id }, 'produto químico inativado');
      return reply.send(produto);
    },
  );
}
