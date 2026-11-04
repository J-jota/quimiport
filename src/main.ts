import { PrismaCargaQuimicaRepository } from './infrastructure/persistence/prisma/PrismaCargaQuimicaRepository.js';
import { PrismaProdutoQuimicoRepository } from './infrastructure/persistence/prisma/PrismaProdutoQuimicoRepository.js';
import { PrismaResponsavelTecnicoRepository } from './infrastructure/persistence/prisma/PrismaResponsavelTecnicoRepository.js';
import { buildApp } from './interfaces/http/app.js';

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '0.0.0.0';

async function main(): Promise<void> {
  const app = await buildApp({
    repositorios: {
      produtos: new PrismaProdutoQuimicoRepository(),
      responsaveis: new PrismaResponsavelTecnicoRepository(),
      cargas: new PrismaCargaQuimicaRepository(),
    },
  });

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`QuimiPort API ouvindo em http://${HOST}:${PORT} (docs em /docs)`);
  } catch (erro) {
    app.log.error(erro);
    process.exit(1);
  }
}

void main();
