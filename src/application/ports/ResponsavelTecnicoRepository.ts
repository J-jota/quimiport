import { ResponsavelTecnico } from '../../domain/responsavel/ResponsavelTecnico.js';
import type { ResponsavelTecnicoId } from '../../shared/types/branded.js';

export interface ResponsavelTecnicoRepository {
  salvar(responsavel: ResponsavelTecnico): Promise<void>;
  buscarPorId(id: ResponsavelTecnicoId): Promise<ResponsavelTecnico | null>;
  listar(): Promise<ResponsavelTecnico[]>;
}
