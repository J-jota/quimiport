import { StatusCarga } from '../../../domain/enums/StatusCarga.js';
import { DomainError } from '../../../shared/errors/errors.js';
import { parseEnum } from '../../../shared/types/parse-enum.js';
import type {
  AcaoCargaInput,
  AtualizarStatusInput,
  CargaOutput,
} from '../../dtos/carga-dtos.js';
import type { CargaQuimicaRepository } from '../../ports/CargaQuimicaRepository.js';
import type { Clock } from '../../ports/Clock.js';
import { buscarCargaOuFalhar } from './ConsultarCargasQuimicas.js';

/** UC-06 — Liberar Carga Química (RN-04, RN-05, RN-06). */
export class LiberarCargaQuimica {
  constructor(
    private readonly cargas: CargaQuimicaRepository,
    private readonly clock: Clock,
  ) {}

  async executar(cargaId: string, input: AcaoCargaInput): Promise<CargaOutput> {
    const carga = await buscarCargaOuFalhar(this.cargas, cargaId);
    carga.liberar(input.ator, input.motivo ?? 'Liberação da carga', this.clock.agora());
    await this.cargas.salvar(carga);
    return carga.toSnapshot();
  }
}

/** UC-07 — Bloquear Carga Química (motivo obrigatório). */
export class BloquearCargaQuimica {
  constructor(
    private readonly cargas: CargaQuimicaRepository,
    private readonly clock: Clock,
  ) {}

  async executar(cargaId: string, input: AcaoCargaInput): Promise<CargaOutput> {
    const carga = await buscarCargaOuFalhar(this.cargas, cargaId);
    carga.bloquear(input.ator, input.motivo ?? '', this.clock.agora());
    await this.cargas.salvar(carga);
    return carga.toSnapshot();
  }
}

/** UC-09 — Cancelar Carga Química (RN-06, RN-16; motivo obrigatório). */
export class CancelarCargaQuimica {
  constructor(
    private readonly cargas: CargaQuimicaRepository,
    private readonly clock: Clock,
  ) {}

  async executar(cargaId: string, input: AcaoCargaInput): Promise<CargaOutput> {
    const carga = await buscarCargaOuFalhar(this.cargas, cargaId);
    carga.cancelar(input.ator, input.motivo ?? '', this.clock.agora());
    await this.cargas.salvar(carga);
    return carga.toSnapshot();
  }
}

/**
 * UC-08 — Atualizar Status da Carga: transições operacionais
 * (iniciar análise, desbloquear, iniciar movimentação, finalizar).
 * Liberação, bloqueio e cancelamento usam endpoints dedicados, pois
 * possuem regras adicionais (RN-04, motivo obrigatório).
 */
export class AtualizarStatusCarga {
  constructor(
    private readonly cargas: CargaQuimicaRepository,
    private readonly clock: Clock,
  ) {}

  async executar(cargaId: string, input: AtualizarStatusInput): Promise<CargaOutput> {
    const carga = await buscarCargaOuFalhar(this.cargas, cargaId);
    const destino = parseEnum(StatusCarga, input.status, 'status');
    const agora = this.clock.agora();

    switch (destino) {
      case StatusCarga.EM_ANALISE:
        if (carga.status === StatusCarga.BLOQUEADA) {
          carga.desbloquear(input.ator, input.motivo ?? '', agora);
        } else {
          carga.iniciarAnalise(input.ator, input.motivo ?? undefined, agora);
        }
        break;
      case StatusCarga.EM_MOVIMENTACAO:
        carga.iniciarMovimentacao(input.ator, input.motivo ?? 'Início da movimentação', agora);
        break;
      case StatusCarga.FINALIZADA:
        carga.finalizar(input.ator, input.motivo ?? 'Movimentação concluída', agora);
        break;
      default:
        throw new DomainError(
          'TRANSICAO_DEDICADA',
          `Para ${destino}, utilize o endpoint dedicado (/liberar, /bloquear, /cancelar ou /inspecoes)`,
        );
    }

    await this.cargas.salvar(carga);
    return carga.toSnapshot();
  }
}
