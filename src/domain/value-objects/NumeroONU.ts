import { DomainError } from '../../shared/errors/errors.js';

const FORMATO_ONU = /^ONU \d{4}$/;

/**
 * VO NumeroONU — identificação regulatória da substância
 * (formato "ONU " + 4 dígitos, ex.: "ONU 1993").
 */
export class NumeroONU {
  private constructor(readonly codigo: string) {}

  static criar(codigo: string): NumeroONU {
    if (!FORMATO_ONU.test(codigo?.trim() ?? '')) {
      throw new DomainError(
        'NUMERO_ONU_INVALIDO',
        `Número ONU em formato inválido: "${codigo}". Esperado: "ONU " + 4 dígitos (ex.: ONU 1993)`,
      );
    }
    return new NumeroONU(codigo.trim());
  }

  equals(outro: NumeroONU): boolean {
    return this.codigo === outro.codigo;
  }
}
