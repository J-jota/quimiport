import { randomUUID } from 'node:crypto';

import { asDocumentoId, type DocumentoId } from '../../shared/types/branded.js';
import { TipoDocumento } from '../enums/TipoDocumento.js';

export interface DocumentoCargaProps {
  id: DocumentoId;
  tipo: TipoDocumento;
  numero: string;
  dataEmissao: Date;
  dataValidade: Date | null;
  validado: boolean;
  urlArquivo: string | null;
}

/**
 * Entidade interna do agregado CargaQuimica — documento obrigatório ou
 * complementar anexado a uma carga (RN-04, RN-14).
 */
export class DocumentoCarga {
  private constructor(private props: DocumentoCargaProps) {}

  static criar(input: {
    tipo: TipoDocumento;
    numero: string;
    dataEmissao: Date;
    dataValidade?: Date | undefined;
    urlArquivo?: string | undefined;
  }): DocumentoCarga {
    return new DocumentoCarga({
      id: asDocumentoId(randomUUID()),
      tipo: input.tipo,
      numero: input.numero.trim(),
      dataEmissao: input.dataEmissao,
      dataValidade: input.dataValidade ?? null,
      validado: false,
      urlArquivo: input.urlArquivo ?? null,
    });
  }

  static reconstituir(props: DocumentoCargaProps): DocumentoCarga {
    return new DocumentoCarga(props);
  }

  get id(): DocumentoId {
    return this.props.id;
  }

  get tipo(): TipoDocumento {
    return this.props.tipo;
  }

  get validado(): boolean {
    return this.props.validado;
  }

  /** RN-14: documento vencido (validade < data atual) não é válido. */
  estaVencido(agora: Date): boolean {
    return this.props.dataValidade !== null && this.props.dataValidade.getTime() < agora.getTime();
  }

  /** Válido para liberação: validado pelo analista e não vencido. */
  estaValido(agora: Date): boolean {
    return this.props.validado && !this.estaVencido(agora);
  }

  marcarValidado(): void {
    this.props.validado = true;
  }

  toSnapshot(): {
    id: string;
    tipo: TipoDocumento;
    numero: string;
    dataEmissao: Date;
    dataValidade: Date | null;
    validado: boolean;
    urlArquivo: string | null;
  } {
    return { ...this.props };
  }
}
