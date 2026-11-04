import { randomUUID } from 'node:crypto';

import { DomainError } from '../../shared/errors/errors.js';
import { asInspecaoId, type InspecaoId } from '../../shared/types/branded.js';
import { ResultadoInspecao } from '../enums/ResultadoInspecao.js';

export interface InspecaoProps {
  id: InspecaoId;
  motivo: string;
  dataSolicitacao: Date;
  dataConclusao: Date | null;
  resultado: ResultadoInspecao;
  inspetor: string | null;
}

/**
 * Entidade interna do agregado CargaQuimica — verificação técnica da carga.
 */
export class Inspecao {
  private constructor(private props: InspecaoProps) {}

  static solicitar(motivo: string, agora: Date = new Date()): Inspecao {
    if (!motivo?.trim()) {
      throw new DomainError('MOTIVO_OBRIGATORIO', 'O motivo da inspeção é obrigatório');
    }
    return new Inspecao({
      id: asInspecaoId(randomUUID()),
      motivo: motivo.trim(),
      dataSolicitacao: agora,
      dataConclusao: null,
      resultado: ResultadoInspecao.PENDENTE,
      inspetor: null,
    });
  }

  static reconstituir(props: InspecaoProps): Inspecao {
    return new Inspecao(props);
  }

  get id(): InspecaoId {
    return this.props.id;
  }

  get motivo(): string {
    return this.props.motivo;
  }

  get inspetor(): string | null {
    return this.props.inspetor;
  }

  get resultado(): ResultadoInspecao {
    return this.props.resultado;
  }

  concluir(resultado: ResultadoInspecao, inspetor: string, agora: Date = new Date()): void {
    if (this.props.resultado !== ResultadoInspecao.PENDENTE) {
      throw new DomainError('INSPECAO_JA_CONCLUIDA', 'A inspeção já foi concluída');
    }
    if (resultado === ResultadoInspecao.PENDENTE) {
      throw new DomainError('RESULTADO_INVALIDO', 'O resultado da inspeção deve ser APROVADA ou REPROVADA');
    }
    if (!inspetor?.trim()) {
      throw new DomainError('INSPETOR_OBRIGATORIO', 'O inspetor responsável é obrigatório');
    }
    this.props.resultado = resultado;
    this.props.inspetor = inspetor.trim();
    this.props.dataConclusao = agora;
  }

  toSnapshot(): {
    id: string;
    motivo: string;
    dataSolicitacao: Date;
    dataConclusao: Date | null;
    resultado: ResultadoInspecao;
    inspetor: string | null;
  } {
    return { ...this.props };
  }
}
