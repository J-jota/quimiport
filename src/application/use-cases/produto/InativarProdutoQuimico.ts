import { NotFoundError } from '../../../shared/errors/errors.js';
import { asProdutoQuimicoId } from '../../../shared/types/branded.js';
import type { ProdutoOutput } from '../../dtos/produto-dtos.js';
import type { Clock } from '../../ports/Clock.js';
import type { ProdutoQuimicoRepository } from '../../ports/ProdutoQuimicoRepository.js';

/** UC-02 — Inativar Produto Químico (efeito de RN-10). */
export class InativarProdutoQuimico {
  constructor(
    private readonly produtos: ProdutoQuimicoRepository,
    private readonly clock: Clock,
  ) {}

  async executar(id: string): Promise<ProdutoOutput> {
    const produto = await this.produtos.buscarPorId(asProdutoQuimicoId(id));
    if (!produto) {
      throw new NotFoundError('ProdutoQuimico', id);
    }
    produto.inativar(this.clock.agora());
    await this.produtos.salvar(produto);
    return produto.toSnapshot();
  }
}
