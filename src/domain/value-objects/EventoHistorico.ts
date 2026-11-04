import { StatusCarga } from '../enums/StatusCarga.js';

/**
 * VO EventoHistorico — trilha de auditoria da carga (RN-13, RN-17).
 * Imutável: eventos só são adicionados, nunca alterados ou removidos.
 * `statusAnterior` é null apenas no evento de registro da carga.
 */
export class EventoHistorico {
  private constructor(
    readonly dataHora: Date,
    readonly statusAnterior: StatusCarga | null,
    readonly statusNovo: StatusCarga,
    readonly ator: string,
    readonly motivo: string,
  ) {}

  static criar(props: {
    statusAnterior: StatusCarga | null;
    statusNovo: StatusCarga;
    ator: string;
    motivo: string;
    dataHora: Date;
  }): EventoHistorico {
    return new EventoHistorico(
      props.dataHora,
      props.statusAnterior,
      props.statusNovo,
      props.ator,
      props.motivo,
    );
  }
}
