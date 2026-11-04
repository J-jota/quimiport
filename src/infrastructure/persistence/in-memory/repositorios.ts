import { CargaQuimicaRepository } from '../../../application/ports/CargaQuimicaRepository.js';
import { ProdutoQuimicoRepository } from '../../../application/ports/ProdutoQuimicoRepository.js';
import { ResponsavelTecnicoRepository } from '../../../application/ports/ResponsavelTecnicoRepository.js';
import { CargaQuimica } from '../../../domain/carga/CargaQuimica.js';
import { StatusCarga } from '../../../domain/enums/StatusCarga.js';
import { ProdutoQuimico } from '../../../domain/produto/ProdutoQuimico.js';
import { ResponsavelTecnico } from '../../../domain/responsavel/ResponsavelTecnico.js';
import type { CargaId, ProdutoQuimicoId, ResponsavelTecnicoId } from '../../../shared/types/branded.js';

/**
 * Repositórios em memória (fakes) — implementam as portas com Map.
 * Usados nos testes de caso de uso e como fallback de desenvolvimento
 * (plano de qualidade, seção 8).
 */
export class InMemoryProdutoQuimicoRepository implements ProdutoQuimicoRepository {
  private readonly itens = new Map<string, ProdutoQuimico>();

  async salvar(produto: ProdutoQuimico): Promise<void> {
    this.itens.set(produto.id, produto);
  }

  async buscarPorId(id: ProdutoQuimicoId): Promise<ProdutoQuimico | null> {
    return this.itens.get(id) ?? null;
  }

  async buscarPorNome(nome: string): Promise<ProdutoQuimico | null> {
    for (const produto of this.itens.values()) {
      if (produto.nome.toLowerCase() === nome.toLowerCase()) return produto;
    }
    return null;
  }

  async listar(): Promise<ProdutoQuimico[]> {
    return [...this.itens.values()];
  }
}

export class InMemoryResponsavelTecnicoRepository implements ResponsavelTecnicoRepository {
  private readonly itens = new Map<string, ResponsavelTecnico>();

  async salvar(responsavel: ResponsavelTecnico): Promise<void> {
    this.itens.set(responsavel.id, responsavel);
  }

  async buscarPorId(id: ResponsavelTecnicoId): Promise<ResponsavelTecnico | null> {
    return this.itens.get(id) ?? null;
  }

  async listar(): Promise<ResponsavelTecnico[]> {
    return [...this.itens.values()];
  }
}

export class InMemoryCargaQuimicaRepository implements CargaQuimicaRepository {
  private readonly itens = new Map<string, CargaQuimica>();

  async salvar(carga: CargaQuimica): Promise<void> {
    this.itens.set(carga.id, carga);
  }

  async buscarPorId(id: CargaId): Promise<CargaQuimica | null> {
    return this.itens.get(id) ?? null;
  }

  async buscarPorCodigo(codigo: string): Promise<CargaQuimica | null> {
    for (const carga of this.itens.values()) {
      if (carga.toSnapshot().codigo === codigo) return carga;
    }
    return null;
  }

  async listar(filtro?: { status?: StatusCarga }): Promise<CargaQuimica[]> {
    const todas = [...this.itens.values()];
    return filtro?.status ? todas.filter((carga) => carga.status === filtro.status) : todas;
  }
}
