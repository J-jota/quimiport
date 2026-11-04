import { DomainError } from '../../shared/errors/errors.js';
import { StatusCarga } from '../enums/StatusCarga.js';

/**
 * Máquina de estados da CargaQuimica (ADR-006).
 *
 * Fonte de verdade das transições: tabela em
 * docs/diagramas/fluxo-status-carga.md (atualizada para a Fase 2).
 *
 * Fluxo principal:
 *   REGISTRADA → EM_ANALISE → EM_INSPECAO → LIBERADA → EM_MOVIMENTACAO → FINALIZADA
 */
const TRANSICOES: Readonly<Record<StatusCarga, readonly StatusCarga[]>> = {
  [StatusCarga.REGISTRADA]: [StatusCarga.EM_ANALISE, StatusCarga.CANCELADA],
  [StatusCarga.EM_ANALISE]: [
    StatusCarga.EM_INSPECAO,
    StatusCarga.LIBERADA,
    StatusCarga.BLOQUEADA,
    StatusCarga.CANCELADA,
  ],
  [StatusCarga.EM_INSPECAO]: [StatusCarga.LIBERADA, StatusCarga.BLOQUEADA, StatusCarga.CANCELADA],
  [StatusCarga.BLOQUEADA]: [StatusCarga.EM_ANALISE, StatusCarga.CANCELADA],
  [StatusCarga.LIBERADA]: [StatusCarga.EM_MOVIMENTACAO, StatusCarga.CANCELADA],
  [StatusCarga.EM_MOVIMENTACAO]: [StatusCarga.FINALIZADA],
  [StatusCarga.FINALIZADA]: [], // estado terminal (RN-16)
  [StatusCarga.CANCELADA]: [], // estado terminal (RN-06)
} as const;

export class StatusCargaMachine {
  static transicoesPermitidas(origem: StatusCarga): readonly StatusCarga[] {
    return TRANSICOES[origem];
  }

  static podeTransicionar(origem: StatusCarga, destino: StatusCarga): boolean {
    return TRANSICOES[origem].includes(destino);
  }

  static isTerminal(status: StatusCarga): boolean {
    return TRANSICOES[status].length === 0;
  }

  static validarTransicao(origem: StatusCarga, destino: StatusCarga): void {
    if (!StatusCargaMachine.podeTransicionar(origem, destino)) {
      throw new DomainError(
        'TRANSICAO_INVALIDA',
        `Transição de status não permitida: ${origem} → ${destino}`,
      );
    }
  }
}
