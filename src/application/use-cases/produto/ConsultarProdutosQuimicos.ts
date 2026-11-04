import { NotFoundError } from '../../../shared/errors/errors.js';
import { asProdutoQuimicoId } from '../../../shared/types/branded.js';
import type { ProdutoOutput } from '../../dtos/produto-dtos.js';
import type { ProdutoQuimicoRepository } from '../../ports/ProdutoQuimicoRepository.js';

export class ListarProdutosQuimicos {
  constructor(private readonly produtos: ProdutoQuimicoRepository) {}

  async executar(): Promise<ProdutoOutput[]> {
    const produtos = await this.produtos.listar();
    return produtos.map((produto) => produto.toSnapshot());
  }
}

export class BuscarProdutoQuimicoPorId {
  constructor(private readonly produtos: ProdutoQuimicoRepository) {}

  async executar(id: string): Promise<ProdutoOutput> {
    const produto = await this.produtos.buscarPorId(asProdutoQuimicoId(id));
    if (!produto) {
      throw new NotFoundError('ProdutoQuimico', id);
    }
    return produto.toSnapshot();
  }
}
