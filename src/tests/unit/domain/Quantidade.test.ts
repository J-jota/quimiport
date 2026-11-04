import { describe, expect, it } from 'vitest';

import { UnidadeMedida } from '../../../domain/enums/UnidadeMedida.js';
import { Quantidade } from '../../../domain/value-objects/Quantidade.js';

describe('Quantidade', () => {
  it.each([0, -1, -100, Number.NaN])(
    'RN-11: não permite quantidade menor ou igual a zero (%s)',
    (valor) => {
      expect(() => Quantidade.criar(valor, UnidadeMedida.KG)).toThrowError(
        expect.objectContaining({ codigo: 'RN-11' }),
      );
    },
  );

  it('cria quantidade válida e opera entre mesma unidade', () => {
    const a = Quantidade.criar(500, UnidadeMedida.KG);
    const b = Quantidade.criar(250, UnidadeMedida.KG);

    expect(a.somar(b).valor).toBe(750);
    expect(a.subtrair(b).valor).toBe(250);
    expect(a.equals(Quantidade.criar(500, UnidadeMedida.KG))).toBe(true);
  });

  it('rejeita operação entre unidades distintas', () => {
    const kg = Quantidade.criar(500, UnidadeMedida.KG);
    const litros = Quantidade.criar(100, UnidadeMedida.LITRO);

    expect(() => kg.somar(litros)).toThrowError(
      expect.objectContaining({ codigo: 'UNIDADE_INCOMPATIVEL' }),
    );
  });
});
