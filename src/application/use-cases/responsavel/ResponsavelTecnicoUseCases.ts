import { ResponsavelTecnico } from '../../../domain/responsavel/ResponsavelTecnico.js';
import { NotFoundError } from '../../../shared/errors/errors.js';
import { asResponsavelTecnicoId } from '../../../shared/types/branded.js';
import type { CriarResponsavelInput, ResponsavelOutput } from '../../dtos/responsavel-dtos.js';
import type { Clock } from '../../ports/Clock.js';
import type { ResponsavelTecnicoRepository } from '../../ports/ResponsavelTecnicoRepository.js';

export class CriarResponsavelTecnico {
  constructor(
    private readonly responsaveis: ResponsavelTecnicoRepository,
    private readonly clock: Clock,
  ) {}

  async executar(input: CriarResponsavelInput): Promise<ResponsavelOutput> {
    const responsavel = ResponsavelTecnico.criar({
      nome: input.nome,
      conselho: input.conselho,
      numeroRegistro: input.numeroRegistro,
      especialidade: input.especialidade,
      agora: this.clock.agora(),
    });
    await this.responsaveis.salvar(responsavel);
    return responsavel.toSnapshot();
  }
}

export class ListarResponsaveisTecnicos {
  constructor(private readonly responsaveis: ResponsavelTecnicoRepository) {}

  async executar(): Promise<ResponsavelOutput[]> {
    const responsaveis = await this.responsaveis.listar();
    return responsaveis.map((responsavel) => responsavel.toSnapshot());
  }
}

export class BuscarResponsavelTecnicoPorId {
  constructor(private readonly responsaveis: ResponsavelTecnicoRepository) {}

  async executar(id: string): Promise<ResponsavelOutput> {
    const responsavel = await this.responsaveis.buscarPorId(asResponsavelTecnicoId(id));
    if (!responsavel) {
      throw new NotFoundError('ResponsavelTecnico', id);
    }
    return responsavel.toSnapshot();
  }
}
