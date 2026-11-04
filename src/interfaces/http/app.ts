import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import Fastify, { type FastifyInstance } from 'fastify';

import { SystemClock, type Clock } from '../../application/ports/Clock.js';
import { montarCasosDeUso, type Repositorios } from './container.js';
import { registrarErrorHandler } from './plugins/error-handler.js';
import { rotasCargas } from './routes/cargas.routes.js';
import { rotasProdutos } from './routes/produtos.routes.js';
import { rotasResponsaveis } from './routes/responsaveis.routes.js';

export interface AppOptions {
  repositorios: Repositorios;
  clock?: Clock;
  logger?: boolean | object;
}

export async function buildApp(options: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? {
      level: process.env.LOG_LEVEL ?? 'info',
    },
  });

  const casosDeUso = montarCasosDeUso(options.repositorios, options.clock ?? new SystemClock());

  registrarErrorHandler(app);

  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'QuimiPort API',
        description:
          'API para gerenciamento de produtos e cargas químicas em contexto portuário. ' +
          'Regras de negócio (RN-XX) descritas em cada endpoint; máquina de estados da carga ' +
          'documentada em docs/diagramas/fluxo-status-carga.md.',
        version: '0.2.0',
      },
      tags: [
        { name: 'Produtos Químicos', description: 'Catálogo de produtos químicos' },
        { name: 'Responsáveis Técnicos', description: 'Profissionais habilitados (CRQ/CREA/...)' },
        { name: 'Cargas Químicas', description: 'Ciclo de vida das cargas químicas' },
      ],
    },
  });
  await app.register(fastifySwaggerUi, { routePrefix: '/docs' });

  app.get('/health', {
    schema: { tags: ['Saúde'], summary: 'Health check' },
  }, async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  rotasProdutos(app, casosDeUso);
  rotasResponsaveis(app, casosDeUso);
  rotasCargas(app, casosDeUso);

  return app;
}
