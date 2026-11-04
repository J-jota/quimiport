import { describe, expect, it } from 'vitest';

import { StatusCargaMachine } from '../../../domain/carga/StatusCargaMachine.js';
import { StatusCarga } from '../../../domain/enums/StatusCarga.js';

/**
 * Testes exaustivos da máquina de estados — cada linha da tabela de
 * transições (docs/diagramas/fluxo-status-carga.md) vira um teste,
 * incluindo as transições proibidas (plano de qualidade, seção 5).
 */

const PERMITIDAS: ReadonlyArray<readonly [StatusCarga, StatusCarga]> = [
  [StatusCarga.REGISTRADA, StatusCarga.EM_ANALISE],
  [StatusCarga.REGISTRADA, StatusCarga.CANCELADA],
  [StatusCarga.EM_ANALISE, StatusCarga.EM_INSPECAO],
  [StatusCarga.EM_ANALISE, StatusCarga.LIBERADA],
  [StatusCarga.EM_ANALISE, StatusCarga.BLOQUEADA],
  [StatusCarga.EM_ANALISE, StatusCarga.CANCELADA],
  [StatusCarga.EM_INSPECAO, StatusCarga.LIBERADA],
  [StatusCarga.EM_INSPECAO, StatusCarga.BLOQUEADA],
  [StatusCarga.EM_INSPECAO, StatusCarga.CANCELADA],
  [StatusCarga.BLOQUEADA, StatusCarga.EM_ANALISE],
  [StatusCarga.BLOQUEADA, StatusCarga.CANCELADA],
  [StatusCarga.LIBERADA, StatusCarga.EM_MOVIMENTACAO],
  [StatusCarga.LIBERADA, StatusCarga.CANCELADA],
  [StatusCarga.EM_MOVIMENTACAO, StatusCarga.FINALIZADA],
];

const TODOS = Object.values(StatusCarga);

describe('StatusCargaMachine', () => {
  it.each(PERMITIDAS)('permite a transição %s → %s', (origem, destino) => {
    expect(() => StatusCargaMachine.validarTransicao(origem, destino)).not.toThrow();
  });

  const proibidas = TODOS.flatMap((origem) =>
    TODOS.filter(
      (destino) => !PERMITIDAS.some(([o, d]) => o === origem && d === destino),
    ).map((destino) => [origem, destino] as const),
  );

  it.each(proibidas)('bloqueia a transição proibida %s → %s', (origem, destino) => {
    expect(() => StatusCargaMachine.validarTransicao(origem, destino)).toThrowError(
      expect.objectContaining({ codigo: 'TRANSICAO_INVALIDA' }),
    );
  });

  it.each([
    // exemplos explícitos do enunciado da Fase 2
    [StatusCarga.CANCELADA, StatusCarga.LIBERADA],
    [StatusCarga.FINALIZADA, StatusCarga.EM_MOVIMENTACAO],
    [StatusCarga.BLOQUEADA, StatusCarga.EM_MOVIMENTACAO],
    [StatusCarga.REGISTRADA, StatusCarga.FINALIZADA],
    [StatusCarga.EM_INSPECAO, StatusCarga.FINALIZADA],
    [StatusCarga.LIBERADA, StatusCarga.REGISTRADA],
  ] as const)('RN-05/06/07/16: proíbe %s → %s (exemplo do enunciado)', (origem, destino) => {
    expect(StatusCargaMachine.podeTransicionar(origem, destino)).toBe(false);
  });

  it('RN-06/RN-16: CANCELADA e FINALIZADA são estados terminais', () => {
    expect(StatusCargaMachine.isTerminal(StatusCarga.CANCELADA)).toBe(true);
    expect(StatusCargaMachine.isTerminal(StatusCarga.FINALIZADA)).toBe(true);
    expect(StatusCargaMachine.isTerminal(StatusCarga.REGISTRADA)).toBe(false);
  });
});
