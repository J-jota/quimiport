import { DomainError } from '../../shared/errors/errors.js';
import { UnidadeMedida } from '../enums/UnidadeMedida.js';

/**
 * VO Quantidade — RN-11: o valor deve ser sempre maior que zero.
 * Imutável; operações só entre mesma unidade.
 */
export class Quantidade {
  private constructor(
    readonly valor: number,
    readonly unidade: UnidadeMedida,
  ) {}

  static criar(valor: number, unidade: UnidadeMedida): Quantidade {
    if (!Number.isFinite(valor) || valor <= 0) {
      throw new DomainError('RN-11', 'A quantidade da carga deve ser maior que zero');
    }
    return new Quantidade(valor, unidade);
  }

  somar(outra: Quantidade): Quantidade {
    this.exigirMesmaUnidade(outra);
    return new Quantidade(this.valor + outra.valor, this.unidade);
  }

  subtrair(outra: Quantidade): Quantidade {
    this.exigirMesmaUnidade(outra);
    return Quantidade.criar(this.valor - outra.valor, this.unidade);
  }

  equals(outra: Quantidade): boolean {
    return this.valor === outra.valor && this.unidade === outra.unidade;
  }

  private exigirMesmaUnidade(outra: Quantidade): void {
    if (this.unidade !== outra.unidade) {
      throw new DomainError(
        'UNIDADE_INCOMPATIVEL',
        `Operação entre unidades distintas: ${this.unidade} e ${outra.unidade}`,
      );
    }
  }
}
