import { ProdutoQuimico } from '../../domain/produto/ProdutoQuimico.js';
import type { ProdutoQuimicoId } from '../../shared/types/branded.js';

export interface ProdutoQuimicoRepository {
  salvar(produto: ProdutoQuimico): Promise<void>;
  buscarPorId(id: ProdutoQuimicoId): Promise<ProdutoQuimico | null>;
  buscarPorNome(nome: string): Promise<ProdutoQuimico | null>;
  listar(): Promise<ProdutoQuimico[]>;
}
