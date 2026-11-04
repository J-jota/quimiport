import { CargaQuimica } from '../../../domain/carga/CargaQuimica.js';
import { UnidadeMedida } from '../../../domain/enums/UnidadeMedida.js';
import { Quantidade } from '../../../domain/value-objects/Quantidade.js';
import { ConflictError, DomainError, NotFoundError } from '../../../shared/errors/errors.js';
import { asProdutoQuimicoId, asResponsavelTecnicoId } from '../../../shared/types/branded.js';
import { parseEnum } from '../../../shared/types/parse-enum.js';
import type { CargaOutput, RegistrarCargaInput } from '../../dtos/carga-dtos.js';
import type { CargaQuimicaRepository } from '../../ports/CargaQuimicaRepository.js';
import type { Clock } from '../../ports/Clock.js';
import type { ProdutoQuimicoRepository } from '../../ports/ProdutoQuimicoRepository.js';
import type { ResponsavelTecnicoRepository } from '../../ports/ResponsavelTecnicoRepository.js';

/**
 * UC-03 — Registrar Carga Química.
 * Orquestra os agregados (RN-02/RN-10: produto ativo) e delega as
 * invariantes à factory do agregado (RN-01, RN-03, RN-11, RN-12).
 */
export class RegistrarCargaQuimica {
  constructor(
    private readonly cargas: CargaQuimicaRepository,
    private readonly produtos: ProdutoQuimicoRepository,
    private readonly responsaveis: ResponsavelTecnicoRepository,
    private readonly clock: Clock,
  ) {}

  async executar(input: RegistrarCargaInput): Promise<CargaOutput> {
    const produto = await this.produtos.buscarPorId(asProdutoQuimicoId(input.produtoQuimicoId));
    if (!produto) {
      throw new NotFoundError('ProdutoQuimico', input.produtoQuimicoId);
    }
    if (!produto.ativo) {
      throw new DomainError(
        'RN-02',
        `O produto químico "${produto.nome}" está inativo e não pode ser usado em novas cargas`,
      );
    }

    const responsavel = await this.responsaveis.buscarPorId(
      asResponsavelTecnicoId(input.responsavelTecnicoId),
    );
    if (!responsavel) {
      throw new NotFoundError('ResponsavelTecnico', input.responsavelTecnicoId);
    }

    const codigo = input.codigo?.trim() ?? '';
    if (codigo) {
      const existente = await this.cargas.buscarPorCodigo(codigo);
      if (existente) {
        throw new ConflictError(`Já existe uma carga registrada com o código "${codigo}"`);
      }
    }

    const carga = CargaQuimica.registrar({
      codigo: input.codigo,
      produtoQuimicoId: produto.id,
      quantidade: Quantidade.criar(input.quantidade, parseEnum(UnidadeMedida, input.unidadeMedida, 'unidadeMedida')),
      classificacaoRisco: produto.classeRisco, // RN-03: herdada do produto
      responsavelTecnicoId: responsavel.id,
      origem: input.origem,
      destino: input.destino,
      dataEntrada: input.dataEntrada ? new Date(input.dataEntrada) : undefined,
      agora: this.clock.agora(),
    });

    await this.cargas.salvar(carga);
    return carga.toSnapshot();
  }
}
