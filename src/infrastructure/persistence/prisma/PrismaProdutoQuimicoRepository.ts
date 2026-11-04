import { ProdutoQuimicoRepository } from '../../../application/ports/ProdutoQuimicoRepository.js';
import { ProdutoQuimico } from '../../../domain/produto/ProdutoQuimico.js';
import type { ProdutoQuimicoId } from '../../../shared/types/branded.js';
import { prisma } from './client.js';
import { produtoParaDominio } from './mappers.js';

export class PrismaProdutoQuimicoRepository implements ProdutoQuimicoRepository {
  async salvar(produto: ProdutoQuimico): Promise<void> {
    const snapshot = produto.toSnapshot();
    await prisma.produtoQuimico.upsert({
      where: { id: snapshot.id },
      create: {
        id: snapshot.id,
        nome: snapshot.nome,
        descricao: snapshot.descricao,
        numeroOnu: snapshot.numeroOnu,
        classeRisco: snapshot.classeRisco,
        grupoCompatibilidade: snapshot.grupoCompatibilidade,
        ativo: snapshot.ativo,
        criadoEm: snapshot.criadoEm,
        atualizadoEm: snapshot.atualizadoEm,
      },
      update: {
        nome: snapshot.nome,
        descricao: snapshot.descricao,
        numeroOnu: snapshot.numeroOnu,
        classeRisco: snapshot.classeRisco,
        grupoCompatibilidade: snapshot.grupoCompatibilidade,
        ativo: snapshot.ativo,
        atualizadoEm: snapshot.atualizadoEm,
      },
    });
  }

  async buscarPorId(id: ProdutoQuimicoId): Promise<ProdutoQuimico | null> {
    const row = await prisma.produtoQuimico.findUnique({ where: { id } });
    return row ? produtoParaDominio(row) : null;
  }

  async buscarPorNome(nome: string): Promise<ProdutoQuimico | null> {
    const row = await prisma.produtoQuimico.findUnique({ where: { nome } });
    return row ? produtoParaDominio(row) : null;
  }

  async listar(): Promise<ProdutoQuimico[]> {
    const rows = await prisma.produtoQuimico.findMany({ orderBy: { nome: 'asc' } });
    return rows.map(produtoParaDominio);
  }
}
