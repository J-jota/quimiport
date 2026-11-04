import { ResponsavelTecnicoRepository } from '../../../application/ports/ResponsavelTecnicoRepository.js';
import { ResponsavelTecnico } from '../../../domain/responsavel/ResponsavelTecnico.js';
import type { ResponsavelTecnicoId } from '../../../shared/types/branded.js';
import { prisma } from './client.js';
import { comTraducaoDeConflito } from './erros.js';
import { responsavelParaDominio } from './mappers.js';

export class PrismaResponsavelTecnicoRepository implements ResponsavelTecnicoRepository {
  async salvar(responsavel: ResponsavelTecnico): Promise<void> {
    const snapshot = responsavel.toSnapshot();
    await comTraducaoDeConflito(() =>
      prisma.responsavelTecnico.upsert({
      where: { id: snapshot.id },
      create: {
        id: snapshot.id,
        nome: snapshot.nome,
        conselho: snapshot.conselho,
        numeroRegistro: snapshot.numeroRegistro,
        especialidade: snapshot.especialidade,
        ativo: snapshot.ativo,
        criadoEm: snapshot.criadoEm,
        atualizadoEm: snapshot.atualizadoEm,
      },
      update: {
        nome: snapshot.nome,
        conselho: snapshot.conselho,
        numeroRegistro: snapshot.numeroRegistro,
        especialidade: snapshot.especialidade,
        ativo: snapshot.ativo,
        atualizadoEm: snapshot.atualizadoEm,
      },
      }),
    );
  }

  async buscarPorId(id: ResponsavelTecnicoId): Promise<ResponsavelTecnico | null> {
    const row = await prisma.responsavelTecnico.findUnique({ where: { id } });
    return row ? responsavelParaDominio(row) : null;
  }

  async listar(): Promise<ResponsavelTecnico[]> {
    const rows = await prisma.responsavelTecnico.findMany({ orderBy: { nome: 'asc' } });
    return rows.map(responsavelParaDominio);
  }
}
