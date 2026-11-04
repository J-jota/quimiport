import { CargaQuimicaRepository } from '../../../application/ports/CargaQuimicaRepository.js';
import { CargaQuimica } from '../../../domain/carga/CargaQuimica.js';
import { StatusCarga } from '../../../domain/enums/StatusCarga.js';
import type { CargaId } from '../../../shared/types/branded.js';
import { prisma } from './client.js';
import { comTraducaoDeConflito } from './erros.js';
import { cargaParaDominio, type CargaRowCompleta } from './mappers.js';

const INCLUDE_AGREGADO = {
  documentos: true,
  inspecoes: true,
  historico: { orderBy: { dataHora: 'asc' } },
} as const;

/**
 * Persiste o agregado CargaQuimica inteiro (raiz + entidades internas +
 * histórico) em uma única transação — consistência forte (ADR-003).
 */
export class PrismaCargaQuimicaRepository implements CargaQuimicaRepository {
  async salvar(carga: CargaQuimica): Promise<void> {
    const snapshot = carga.toSnapshot();

    await comTraducaoDeConflito(() =>
      prisma.$transaction(async (tx) => {
      await tx.cargaQuimica.upsert({
        where: { id: snapshot.id },
        create: {
          id: snapshot.id,
          codigo: snapshot.codigo,
          produtoQuimicoId: snapshot.produtoQuimicoId,
          quantidade: snapshot.quantidade,
          unidadeMedida: snapshot.unidadeMedida,
          classificacaoRisco: snapshot.classificacaoRisco,
          responsavelTecnicoId: snapshot.responsavelTecnicoId,
          origem: snapshot.origem,
          destino: snapshot.destino,
          status: snapshot.status,
          dataEntrada: snapshot.dataEntrada,
          criadoEm: snapshot.criadoEm,
          atualizadoEm: snapshot.atualizadoEm,
        },
        update: {
          status: snapshot.status,
          atualizadoEm: snapshot.atualizadoEm,
        },
      });

      // Entidades internas: reescreve o conjunto (o agregado é a fronteira)
      await tx.documentoCarga.deleteMany({ where: { cargaId: snapshot.id } });
      if (snapshot.documentos.length > 0) {
        await tx.documentoCarga.createMany({
          data: snapshot.documentos.map((doc) => ({
            id: doc.id,
            cargaId: snapshot.id,
            tipo: doc.tipo,
            numero: doc.numero,
            dataEmissao: doc.dataEmissao,
            dataValidade: doc.dataValidade,
            validado: doc.validado,
            urlArquivo: doc.urlArquivo,
          })),
        });
      }

      await tx.inspecao.deleteMany({ where: { cargaId: snapshot.id } });
      if (snapshot.inspecoes.length > 0) {
        await tx.inspecao.createMany({
          data: snapshot.inspecoes.map((inspecao) => ({
            id: inspecao.id,
            cargaId: snapshot.id,
            motivo: inspecao.motivo,
            dataSolicitacao: inspecao.dataSolicitacao,
            dataConclusao: inspecao.dataConclusao,
            resultado: inspecao.resultado,
            inspetor: inspecao.inspetor,
          })),
        });
      }

      // Histórico é append-only (RN-17): insere apenas eventos novos
      const existentes = await tx.eventoHistorico.count({ where: { cargaId: snapshot.id } });
      const novos = snapshot.historico.slice(existentes);
      if (novos.length > 0) {
        await tx.eventoHistorico.createMany({
          data: novos.map((evento) => ({
            cargaId: snapshot.id,
            dataHora: evento.dataHora,
            statusAnterior: evento.statusAnterior,
            statusNovo: evento.statusNovo,
            ator: evento.ator,
            motivo: evento.motivo,
          })),
        });
      }
      }),
    );
  }

  async buscarPorId(id: CargaId): Promise<CargaQuimica | null> {
    const row = await prisma.cargaQuimica.findUnique({ where: { id }, include: INCLUDE_AGREGADO });
    return row ? cargaParaDominio(row as CargaRowCompleta) : null;
  }

  async buscarPorCodigo(codigo: string): Promise<CargaQuimica | null> {
    const row = await prisma.cargaQuimica.findUnique({
      where: { codigo },
      include: INCLUDE_AGREGADO,
    });
    return row ? cargaParaDominio(row as CargaRowCompleta) : null;
  }

  async listar(filtro?: { status?: StatusCarga }): Promise<CargaQuimica[]> {
    const rows = await prisma.cargaQuimica.findMany({
      where: filtro?.status ? { status: filtro.status } : {},
      include: INCLUDE_AGREGADO,
      orderBy: { criadoEm: 'desc' },
    });
    return rows.map((row) => cargaParaDominio(row as CargaRowCompleta));
  }
}
