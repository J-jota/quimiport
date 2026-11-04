import { CargaQuimica } from '../../../domain/carga/CargaQuimica.js';
import { StatusCarga } from '../../../domain/enums/StatusCarga.js';
import { NotFoundError } from '../../../shared/errors/errors.js';
import { asCargaId } from '../../../shared/types/branded.js';
import { parseEnum } from '../../../shared/types/parse-enum.js';
import type { CargaOutput, EventoHistoricoOutput } from '../../dtos/carga-dtos.js';
import type { CargaQuimicaRepository } from '../../ports/CargaQuimicaRepository.js';

export async function buscarCargaOuFalhar(
  cargas: CargaQuimicaRepository,
  id: string,
): Promise<CargaQuimica> {
  const carga = await cargas.buscarPorId(asCargaId(id));
  if (!carga) {
    throw new NotFoundError('CargaQuimica', id);
  }
  return carga;
}

/** UC-10 — Consultar Cargas (com filtro opcional por status). */
export class ListarCargasQuimicas {
  constructor(private readonly cargas: CargaQuimicaRepository) {}

  async executar(filtro?: { status?: string }): Promise<CargaOutput[]> {
    const status =
      filtro?.status !== undefined ? parseEnum(StatusCarga, filtro.status, 'status') : undefined;
    const cargas = await this.cargas.listar(status !== undefined ? { status } : undefined);
    return cargas.map((carga) => carga.toSnapshot());
  }
}

export class BuscarCargaQuimicaPorId {
  constructor(private readonly cargas: CargaQuimicaRepository) {}

  async executar(id: string): Promise<CargaOutput> {
    const carga = await buscarCargaOuFalhar(this.cargas, id);
    return carga.toSnapshot();
  }
}

/** UC-11 — Consultar Histórico da Carga (RN-17: somente leitura). */
export class ConsultarHistoricoCarga {
  constructor(private readonly cargas: CargaQuimicaRepository) {}

  async executar(id: string): Promise<EventoHistoricoOutput[]> {
    const carga = await buscarCargaOuFalhar(this.cargas, id);
    return carga.consultarHistorico().map((evento) => ({
      dataHora: evento.dataHora,
      statusAnterior: evento.statusAnterior,
      statusNovo: evento.statusNovo,
      ator: evento.ator,
      motivo: evento.motivo,
    }));
  }
}
