import { ClasseRisco } from '../../../domain/enums/ClasseRisco.js';
import { GrupoCompatibilidade } from '../../../domain/enums/GrupoCompatibilidade.js';
import { ConflictError, NotFoundError } from '../../../shared/errors/errors.js';
import { asProdutoQuimicoId } from '../../../shared/types/branded.js';
import { parseEnum } from '../../../shared/types/parse-enum.js';
import type { AtualizarProdutoInput, ProdutoOutput } from '../../dtos/produto-dtos.js';
import type { Clock } from '../../ports/Clock.js';
import type { ProdutoQuimicoRepository } from '../../ports/ProdutoQuimicoRepository.js';

export class AtualizarProdutoQuimico {
  constructor(
    private readonly produtos: ProdutoQuimicoRepository,
    private readonly clock: Clock,
  ) {}

  async executar(id: string, input: AtualizarProdutoInput): Promise<ProdutoOutput> {
    const produto = await this.produtos.buscarPorId(asProdutoQuimicoId(id));
    if (!produto) {
      throw new NotFoundError('ProdutoQuimico', id);
    }

    if (input.nome !== undefined && input.nome.trim() && input.nome.trim() !== produto.nome) {
      const existente = await this.produtos.buscarPorNome(input.nome.trim());
      if (existente && existente.id !== produto.id) {
        throw new ConflictError(`Já existe um produto químico cadastrado com o nome "${input.nome.trim()}"`);
      }
    }

    produto.atualizar({
      nome: input.nome,
      descricao: input.descricao,
      numeroOnu: input.numeroOnu,
      classeRisco:
        input.classeRisco !== undefined
          ? parseEnum(ClasseRisco, input.classeRisco, 'classeRisco')
          : undefined,
      grupoCompatibilidade:
        input.grupoCompatibilidade !== undefined
          ? parseEnum(GrupoCompatibilidade, input.grupoCompatibilidade, 'grupoCompatibilidade')
          : undefined,
      agora: this.clock.agora(),
    });

    await this.produtos.salvar(produto);
    return produto.toSnapshot();
  }
}
