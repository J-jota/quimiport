import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { CargaQuimica } from '../../domain/carga/CargaQuimica.js';
import { StatusCarga } from '../../domain/enums/StatusCarga.js';
import { ResponsavelTecnico } from '../../domain/responsavel/ResponsavelTecnico.js';
import { prisma } from '../../infrastructure/persistence/prisma/client.js';
import { PrismaCargaQuimicaRepository } from '../../infrastructure/persistence/prisma/PrismaCargaQuimicaRepository.js';
import { PrismaProdutoQuimicoRepository } from '../../infrastructure/persistence/prisma/PrismaProdutoQuimicoRepository.js';
import { PrismaResponsavelTecnicoRepository } from '../../infrastructure/persistence/prisma/PrismaResponsavelTecnicoRepository.js';
import { AGORA, ProdutoBuilder } from '../fixtures/builders/ProdutoBuilder.js';
import { CargaBuilder } from '../fixtures/builders/CargaBuilder.js';

/**
 * Testes de integração dos repositórios Prisma contra PostgreSQL real
 * (plano de qualidade, seção 6). Exigem banco disponível:
 *   RUN_DB_TESTS=1 DATABASE_URL=... npx vitest run
 */
const RUN = process.env.RUN_DB_TESTS === '1';
const describeDb = RUN ? describe : describe.skip;

describeDb('Repositórios Prisma (integração com PostgreSQL)', () => {
  const produtos = new PrismaProdutoQuimicoRepository();
  const responsaveis = new PrismaResponsavelTecnicoRepository();
  const cargas = new PrismaCargaQuimicaRepository();

  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await prisma.eventoHistorico.deleteMany();
    await prisma.inspecao.deleteMany();
    await prisma.documentoCarga.deleteMany();
    await prisma.cargaQuimica.deleteMany();
    await prisma.produtoQuimico.deleteMany();
    await prisma.responsavelTecnico.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('persiste e recupera produto químico (incluindo busca por nome)', async () => {
    const produto = ProdutoBuilder.valido().build();
    await produtos.salvar(produto);

    const porId = await produtos.buscarPorId(produto.id);
    expect(porId?.toSnapshot()).toMatchObject({
      nome: 'Ácido Sulfúrico',
      numeroOnu: 'ONU 1830',
      ativo: true,
    });

    const porNome = await produtos.buscarPorNome('Ácido Sulfúrico');
    expect(porNome?.id).toBe(produto.id);

    expect(await produtos.listar()).toHaveLength(1);

    // atualização (upsert)
    produto.inativar(AGORA);
    await produtos.salvar(produto);
    const inativo = await produtos.buscarPorId(produto.id);
    expect(inativo?.ativo).toBe(false);
  });

  it('persiste e recupera responsável técnico', async () => {
    const responsavel = ResponsavelTecnico.criar({
      nome: 'Maria Química',
      conselho: 'CRQ',
      numeroRegistro: '12345',
      especialidade: 'Química industrial',
      agora: AGORA,
    });
    await responsaveis.salvar(responsavel);

    const recuperado = await responsaveis.buscarPorId(responsavel.id);
    expect(recuperado?.toSnapshot().registroProfissional).toBe('CRQ-12345');
  });

  it('persiste o agregado inteiro atomicamente: registro → documentos → análise → liberação', async () => {
    const produto = ProdutoBuilder.valido().build();
    await produtos.salvar(produto);
    const responsavel = ResponsavelTecnico.criar({
      nome: 'Maria Química',
      conselho: 'CRQ',
      numeroRegistro: '12345',
      agora: AGORA,
    });
    await responsaveis.salvar(responsavel);

    // carga montada pelo builder, vinculada aos agregados persistidos
    const montada = CargaBuilder.valida().buildComDocumentacaoCompleta();
    const carga = CargaQuimica.reconstituir({
      ...montada.toPersistence(),
      produtoQuimicoId: produto.id,
      responsavelTecnicoId: responsavel.id,
    });
    const codigo = carga.toSnapshot().codigo;

    await cargas.salvar(carga);

    carga.iniciarAnalise('analista.doc', 'análise', AGORA);
    await cargas.salvar(carga);

    carga.liberar('gestor.operacional', 'Documentação aprovada', AGORA);
    await cargas.salvar(carga);

    const recuperada = await cargas.buscarPorId(carga.id);
    expect(recuperada?.status).toBe(StatusCarga.LIBERADA);
    expect(recuperada?.documentos).toHaveLength(2);
    expect(recuperada?.consultarHistorico()).toHaveLength(3);

    const porCodigo = await cargas.buscarPorCodigo(codigo);
    expect(porCodigo?.id).toBe(carga.id);

    expect(await cargas.listar({ status: StatusCarga.LIBERADA })).toHaveLength(1);
    expect(await cargas.listar({ status: StatusCarga.CANCELADA })).toHaveLength(0);
  });
});
