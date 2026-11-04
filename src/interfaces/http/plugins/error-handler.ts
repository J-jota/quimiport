import type { FastifyError, FastifyInstance } from 'fastify';

import {
  AppError,
  ConflictError,
  DomainError,
  NotFoundError,
  ValidationError,
} from '../../../shared/errors/errors.js';

/** Mapeamento da hierarquia de erros tipados para HTTP (ADR-005). */
export function registrarErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((erro, request, reply) => {
    if (erro instanceof ValidationError) {
      request.log.warn({ codigo: erro.codigo }, 'erro de validação de entrada');
      return reply.status(400).send({ erro: { tipo: erro.tipo, codigo: erro.codigo, mensagem: erro.message } });
    }
    if (erro instanceof NotFoundError) {
      return reply.status(404).send({ erro: { tipo: erro.tipo, codigo: erro.codigo, mensagem: erro.message } });
    }
    if (erro instanceof ConflictError) {
      request.log.warn({ codigo: erro.codigo }, 'conflito de estado');
      return reply.status(409).send({ erro: { tipo: erro.tipo, codigo: erro.codigo, mensagem: erro.message } });
    }
    if (erro instanceof DomainError) {
      request.log.warn({ codigo: erro.codigo }, 'violação de regra de negócio');
      return reply.status(422).send({ erro: { tipo: erro.tipo, codigo: erro.codigo, mensagem: erro.message } });
    }
    if (erro instanceof AppError) {
      return reply.status(400).send({ erro: { tipo: erro.tipo, codigo: erro.codigo, mensagem: erro.message } });
    }

    // erro de validação de schema do Fastify (formato de entrada)
    const fastifyErro = erro as FastifyError;
    if (fastifyErro.validation) {
      request.log.warn({ detalhes: fastifyErro.message }, 'payload inválido');
      return reply.status(400).send({
        erro: { tipo: 'VALIDACAO', codigo: 'PAYLOAD_INVALIDO', mensagem: fastifyErro.message },
      });
    }

    request.log.error({ err: erro }, 'erro interno não tratado');
    return reply.status(500).send({
      erro: { tipo: 'ERRO_INTERNO', codigo: 'ERRO_INTERNO', mensagem: 'Erro interno do servidor' },
    });
  });
}
