import { ClasseRisco } from '../../../domain/enums/ClasseRisco.js';
import { GrupoCompatibilidade } from '../../../domain/enums/GrupoCompatibilidade.js';
import { ProdutoQuimico } from '../../../domain/produto/ProdutoQuimico.js';
import { ConflictError } from '../../../shared/errors/errors.js';
import { parseEnum } from '../../../shared/types/parse-enum.js';
import type { CriarProdutoInput, ProdutoOutput } from '../../dtos/produto-dtos.js';
import type { Clock } from '../../ports/Clock.js';
import type { ProdutoQuimicoRepository } from '../../ports/ProdutoQuimicoRepository.js';

/** UC-01 — Cadastrar Produto Químico (RN-08, RN-09). */
export class CriarProdutoQuimico {
  constructor(
    private readonly produtos: ProdutoQuimicoRepository,
    private readonly clock: Clock,
  ) {}

  async executar(input: CriarProdutoInput): Promise<ProdutoOutput> {
    const nome = input.nome?.trim() ?? '';
    if (nome) {
      const existente = await this.produtos.buscarPorNome(nome);
      if (existente) {
        throw new ConflictError(`Já existe um produto químico cadastrado com o nome "${nome}"`);
      }
    }

    const produto = ProdutoQuimico.criar({
      nome: input.nome,
      descricao: input.descricao,
      numeroOnu: input.numeroOnu,
      classeRisco: parseEnum(ClasseRisco, input.classeRisco, 'classeRisco'),
      grupoCompatibilidade: parseEnum(
        GrupoCompatibilidade,
        input.grupoCompatibilidade,
        'grupoCompatibilidade',
      ),
      agora: this.clock.agora(),
    });

    await this.produtos.salvar(produto);
    return produto.toSnapshot();
  }
}
