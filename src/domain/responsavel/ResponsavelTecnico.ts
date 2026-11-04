import { randomUUID } from 'node:crypto';

import { DomainError } from '../../shared/errors/errors.js';
import {
  asResponsavelTecnicoId,
  type ResponsavelTecnicoId,
} from '../../shared/types/branded.js';
import { RegistroProfissional } from '../value-objects/RegistroProfissional.js';

export interface ResponsavelTecnicoProps {
  id: ResponsavelTecnicoId;
  nome: string;
  registroProfissional: RegistroProfissional;
  especialidade: string | null;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

/**
 * Agregado ResponsavelTecnico — profissional habilitado que responde
 * tecnicamente por uma carga.
 */
export class ResponsavelTecnico {
  private constructor(private props: ResponsavelTecnicoProps) {}

  static criar(input: {
    nome: string;
    conselho: string;
    numeroRegistro: string;
    especialidade?: string | undefined;
    agora?: Date;
  }): ResponsavelTecnico {
    const nome = input.nome?.trim() ?? '';
    if (!nome) {
      throw new DomainError('NOME_OBRIGATORIO', 'O nome do responsável técnico é obrigatório');
    }
    const agora = input.agora ?? new Date();
    return new ResponsavelTecnico({
      id: asResponsavelTecnicoId(randomUUID()),
      nome,
      registroProfissional: RegistroProfissional.criar(input.conselho, input.numeroRegistro),
      especialidade: input.especialidade?.trim() || null,
      ativo: true,
      criadoEm: agora,
      atualizadoEm: agora,
    });
  }

  static reconstituir(props: ResponsavelTecnicoProps): ResponsavelTecnico {
    return new ResponsavelTecnico(props);
  }

  get id(): ResponsavelTecnicoId {
    return this.props.id;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  toSnapshot(): {
    id: string;
    nome: string;
    conselho: string;
    numeroRegistro: string;
    registroProfissional: string;
    especialidade: string | null;
    ativo: boolean;
    criadoEm: Date;
    atualizadoEm: Date;
  } {
    return {
      id: this.props.id,
      nome: this.props.nome,
      conselho: this.props.registroProfissional.conselho,
      numeroRegistro: this.props.registroProfissional.numero,
      registroProfissional: this.props.registroProfissional.formatado(),
      especialidade: this.props.especialidade,
      ativo: this.props.ativo,
      criadoEm: this.props.criadoEm,
      atualizadoEm: this.props.atualizadoEm,
    };
  }
}
