import { DomainError } from '../../shared/errors/errors.js';

const CONSELHOS_RECONHECIDOS = ['CRQ', 'CREA', 'CRF', 'CRM', 'CRBIO'] as const;

/**
 * VO RegistroProfissional — registro do responsável técnico em conselho
 * de classe (ex.: CRQ-12345).
 */
export class RegistroProfissional {
  private constructor(
    readonly conselho: string,
    readonly numero: string,
  ) {}

  static criar(conselho: string, numero: string): RegistroProfissional {
    const conselhoNormalizado = conselho?.trim().toUpperCase() ?? '';
    if (!(CONSELHOS_RECONHECIDOS as readonly string[]).includes(conselhoNormalizado)) {
      throw new DomainError(
        'CONSELHO_INVALIDO',
        `Conselho não reconhecido: "${conselho}". Esperado um de: ${CONSELHOS_RECONHECIDOS.join(', ')}`,
      );
    }
    if (!numero?.trim()) {
      throw new DomainError('REGISTRO_INVALIDO', 'O número do registro profissional é obrigatório');
    }
    return new RegistroProfissional(conselhoNormalizado, numero.trim());
  }

  formatado(): string {
    return `${this.conselho}-${this.numero}`;
  }

  equals(outro: RegistroProfissional): boolean {
    return this.conselho === outro.conselho && this.numero === outro.numero;
  }
}
