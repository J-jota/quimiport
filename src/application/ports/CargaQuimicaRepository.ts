import { CargaQuimica } from '../../domain/carga/CargaQuimica.js';
import { StatusCarga } from '../../domain/enums/StatusCarga.js';
import type { CargaId } from '../../shared/types/branded.js';

export interface CargaQuimicaRepository {
  salvar(carga: CargaQuimica): Promise<void>;
  buscarPorId(id: CargaId): Promise<CargaQuimica | null>;
  buscarPorCodigo(codigo: string): Promise<CargaQuimica | null>;
  listar(filtro?: { status?: StatusCarga }): Promise<CargaQuimica[]>;
}
