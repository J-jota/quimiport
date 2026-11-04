/**
 * Estados do ciclo de vida da CargaQuimica (Fase 2).
 *
 * Decisão: o enunciado da Fase 2 prevalece sobre a modelagem da Fase 1 —
 * `EM_ANALISE` corresponde ao antigo `EM_VALIDACAO` e `EM_MOVIMENTACAO`
 * foi adicionado entre LIBERADA e FINALIZADA. Ver docs/fase-2/.
 */
export enum StatusCarga {
  REGISTRADA = 'REGISTRADA',
  EM_ANALISE = 'EM_ANALISE',
  EM_INSPECAO = 'EM_INSPECAO',
  LIBERADA = 'LIBERADA',
  BLOQUEADA = 'BLOQUEADA',
  EM_MOVIMENTACAO = 'EM_MOVIMENTACAO',
  FINALIZADA = 'FINALIZADA',
  CANCELADA = 'CANCELADA',
}
