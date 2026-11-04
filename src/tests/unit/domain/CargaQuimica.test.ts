import { describe, expect, it } from 'vitest';

import { ResultadoInspecao } from '../../../domain/enums/ResultadoInspecao.js';
import { StatusCarga } from '../../../domain/enums/StatusCarga.js';
import { TipoDocumento } from '../../../domain/enums/TipoDocumento.js';
import { AGORA, VALIDADE_PASSADA } from '../../fixtures/builders/ProdutoBuilder.js';
import { CargaBuilder } from '../../fixtures/builders/CargaBuilder.js';

describe('CargaQuimica — registro', () => {
  it('registra carga válida com status REGISTRADA e primeiro evento no histórico', () => {
    const carga = CargaBuilder.valida().build();

    const snapshot = carga.toSnapshot();
    expect(snapshot.status).toBe(StatusCarga.REGISTRADA);
    expect(snapshot.codigo).toBe('CG-2026-0001');
    expect(snapshot.quantidade).toBe(500);
    expect(snapshot.classificacaoRisco).toBe('CORROSIVO');
    expect(snapshot.historico).toHaveLength(1);
    expect(snapshot.historico[0]).toMatchObject({
      statusAnterior: null,
      statusNovo: StatusCarga.REGISTRADA,
    });
  });

  it('RN-01: não registra carga sem produto químico associado', () => {
    expect(() => CargaBuilder.valida().semProduto().build()).toThrowError(
      expect.objectContaining({ codigo: 'RN-01' }),
    );
  });

  it('RN-12: não registra carga sem responsável técnico', () => {
    expect(() => CargaBuilder.valida().semResponsavel().build()).toThrowError(
      expect.objectContaining({ codigo: 'RN-12' }),
    );
  });

  it('RN-11: não registra carga com quantidade menor ou igual a zero', () => {
    expect(() => CargaBuilder.valida().comQuantidade(0).build()).toThrowError(
      expect.objectContaining({ codigo: 'RN-11' }),
    );
  });
});

describe('CargaQuimica — liberação (RN-04)', () => {
  it('não libera carga sem documentação obrigatória', () => {
    const carga = CargaBuilder.valida().build();
    carga.iniciarAnalise('analista.doc', 'análise', AGORA);

    expect(() => carga.liberar('gestor', 'liberação', AGORA)).toThrowError(
      expect.objectContaining({ codigo: 'RN-04' }),
    );
  });

  it('não libera carga com documentos obrigatórios ainda não validados', () => {
    const carga = CargaBuilder.valida().build();
    carga.anexarDocumento({ tipo: TipoDocumento.FISPQ, numero: 'FISPQ-1', dataEmissao: AGORA });
    carga.anexarDocumento({
      tipo: TipoDocumento.CONHECIMENTO_EMBARQUE,
      numero: 'CE-1',
      dataEmissao: AGORA,
    });
    carga.iniciarAnalise('analista.doc', 'análise', AGORA);

    expect(() => carga.liberar('gestor', 'liberação', AGORA)).toThrowError(
      expect.objectContaining({ codigo: 'RN-04' }),
    );
  });

  it('RN-14: não libera carga com documento obrigatório vencido', () => {
    const carga = CargaBuilder.valida().build();
    const fispq = carga.anexarDocumento({
      tipo: TipoDocumento.FISPQ,
      numero: 'FISPQ-1',
      dataEmissao: new Date('2024-01-01'),
      dataValidade: VALIDADE_PASSADA,
    });
    carga.validarDocumento(fispq.id, AGORA);
    const ce = carga.anexarDocumento({
      tipo: TipoDocumento.CONHECIMENTO_EMBARQUE,
      numero: 'CE-1',
      dataEmissao: AGORA,
    });
    carga.validarDocumento(ce.id, AGORA);
    carga.iniciarAnalise('analista.doc', 'análise', AGORA);

    expect(() => carga.liberar('gestor', 'liberação', AGORA)).toThrowError(
      expect.objectContaining({ codigo: 'RN-04' }),
    );
  });

  it('libera carga com documentação completa, válida e validada', () => {
    const carga = CargaBuilder.valida().buildEmAnalise();

    carga.liberar('gestor.operacional', 'Documentação aprovada', AGORA);

    expect(carga.status).toBe(StatusCarga.LIBERADA);
  });

  it('não libera carga em inspeção sem inspeção APROVADA (T6)', () => {
    const carga = CargaBuilder.valida().buildEmInspecao();

    expect(() => carga.liberar('gestor', 'liberação', AGORA)).toThrowError(
      expect.objectContaining({ codigo: 'INSPECAO_NAO_APROVADA' }),
    );
  });

  it('libera carga em inspeção após inspeção APROVADA (T6)', () => {
    const carga = CargaBuilder.valida().buildEmInspecao();
    CargaBuilder.aprovarUltimaInspecao(carga);

    carga.liberar('gestor', 'Inspeção e documentação aprovadas', AGORA);

    expect(carga.status).toBe(StatusCarga.LIBERADA);
  });
});

describe('CargaQuimica — inspeção e bloqueio (RN-15)', () => {
  it('RN-15: inspeção REPROVADA bloqueia automaticamente a carga', () => {
    const carga = CargaBuilder.valida().buildEmInspecao();
    const inspecao = carga.inspecoes.at(-1)!;

    carga.registrarResultadoInspecao(
      inspecao.id,
      ResultadoInspecao.REPROVADA,
      'inspetor.1',
      'inspetor.1',
      AGORA,
    );

    expect(carga.status).toBe(StatusCarga.BLOQUEADA);
    expect(carga.consultarHistorico().at(-1)?.motivo).toContain('RN-15');
  });

  it('não registra resultado de inspeção com carga fora de EM_INSPECAO', () => {
    const carga = CargaBuilder.valida().build();

    expect(() =>
      carga.registrarResultadoInspecao(
        'inexistente' as never,
        ResultadoInspecao.APROVADA,
        'inspetor.1',
        'inspetor.1',
        AGORA,
      ),
    ).toThrowError(expect.objectContaining({ codigo: 'STATUS_NAO_PERMITE_INSPECAO' }));
  });
});

describe('CargaQuimica — ciclo de vida e estados terminais', () => {
  it('RN-05: carga bloqueada não pode entrar em movimentação', () => {
    const carga = CargaBuilder.valida().buildBloqueada();

    expect(() => carga.iniciarMovimentacao('operador', 'movimentação', AGORA)).toThrowError(
      expect.objectContaining({ codigo: 'TRANSICAO_INVALIDA' }),
    );
  });

  it('RN-06: carga cancelada não pode ser liberada', () => {
    const carga = CargaBuilder.valida().build();
    carga.cancelar('gestor', 'Desistência do embarque', AGORA);

    expect(() => carga.liberar('gestor', 'tentativa', AGORA)).toThrowError(
      expect.objectContaining({ codigo: 'RN-04' }),
    );
    // mesmo com documentação válida, a máquina de estados bloqueia
    const documentada = CargaBuilder.valida().buildEmAnalise();
    documentada.cancelar('gestor', 'Erro de registro', AGORA);
    expect(() => documentada.liberar('gestor', 'tentativa', AGORA)).toThrowError(
      expect.objectContaining({ codigo: 'TRANSICAO_INVALIDA' }),
    );
  });

  it('RN-07: carga em inspeção não pode ser finalizada sem antes ser liberada', () => {
    const carga = CargaBuilder.valida().buildEmInspecao();

    expect(() => carga.finalizar('operador', 'finalização', AGORA)).toThrowError(
      expect.objectContaining({ codigo: 'TRANSICAO_INVALIDA' }),
    );
  });

  it('RN-16: carga finalizada não sofre novas alterações de status', () => {
    const carga = CargaBuilder.valida().buildLiberada();
    carga.iniciarMovimentacao('operador', 'Saída para o terminal', AGORA);
    carga.finalizar('operador', 'Movimentação concluída', AGORA);

    expect(carga.status).toBe(StatusCarga.FINALIZADA);
    expect(() => carga.cancelar('gestor', 'tentativa', AGORA)).toThrowError(
      expect.objectContaining({ codigo: 'TRANSICAO_INVALIDA' }),
    );
  });

  it('bloqueio exige motivo obrigatório', () => {
    const carga = CargaBuilder.valida().buildEmAnalise();

    expect(() => carga.bloquear('gestor', '', AGORA)).toThrowError(
      expect.objectContaining({ codigo: 'MOTIVO_OBRIGATORIO' }),
    );
  });

  it('desbloqueia carga bloqueada retornando para EM_ANALISE (T8)', () => {
    const carga = CargaBuilder.valida().buildBloqueada();

    carga.desbloquear('gestor', 'Pendência regularizada', AGORA);

    expect(carga.status).toBe(StatusCarga.EM_ANALISE);
  });

  it('percorre o fluxo principal completo até FINALIZADA', () => {
    const carga = CargaBuilder.valida().buildComDocumentacaoCompleta();
    carga.iniciarAnalise('analista.doc', 'análise', AGORA);
    carga.solicitarInspecao('Verificação de rotina', 'analista.qualidade', AGORA);
    CargaBuilder.aprovarUltimaInspecao(carga);
    carga.liberar('gestor', 'Aptidão confirmada', AGORA);
    carga.iniciarMovimentacao('operador', 'Embarque autorizado', AGORA);
    carga.finalizar('operador', 'Operação concluída', AGORA);

    expect(carga.status).toBe(StatusCarga.FINALIZADA);
  });
});

describe('CargaQuimica — histórico (RN-13, RN-17)', () => {
  it('RN-13: toda transição de status registra evento com data, ator e motivo', () => {
    const carga = CargaBuilder.valida().buildEmAnalise();
    carga.liberar('gestor.operacional', 'Documentação aprovada', AGORA);

    const historico = carga.consultarHistorico();
    expect(historico).toHaveLength(3); // registro, análise, liberação
    const ultimo = historico.at(-1)!;
    expect(ultimo.statusAnterior).toBe(StatusCarga.EM_ANALISE);
    expect(ultimo.statusNovo).toBe(StatusCarga.LIBERADA);
    expect(ultimo.ator).toBe('gestor.operacional');
    expect(ultimo.motivo).toBe('Documentação aprovada');
    expect(ultimo.dataHora).toEqual(AGORA);
  });

  it('RN-17: o histórico exposto é somente leitura (cópia defensiva no snapshot)', () => {
    const carga = CargaBuilder.valida().build();
    const snapshot = carga.toSnapshot();

    snapshot.historico.length = 0;

    expect(carga.consultarHistorico()).toHaveLength(1);
  });
});
