import { beforeEach, describe, expect, it } from 'vitest';

import {
  AtualizarStatusCarga,
  BloquearCargaQuimica,
  CancelarCargaQuimica,
  LiberarCargaQuimica,
} from '../../../application/use-cases/carga/AcaoStatusUseCases.js';
import {
  BuscarCargaQuimicaPorId,
  ConsultarHistoricoCarga,
  ListarCargasQuimicas,
} from '../../../application/use-cases/carga/ConsultarCargasQuimicas.js';
import {
  AnexarDocumentoCarga,
  ValidarDocumentoCarga,
} from '../../../application/use-cases/carga/DocumentacaoInspecaoUseCases.js';
import { RegistrarCargaQuimica } from '../../../application/use-cases/carga/RegistrarCargaQuimica.js';
import {
  InMemoryCargaQuimicaRepository,
  InMemoryProdutoQuimicoRepository,
  InMemoryResponsavelTecnicoRepository,
} from '../../../infrastructure/persistence/in-memory/repositorios.js';
import { ClockFake } from '../../fixtures/ClockFake.js';
import { ProdutoBuilder, AGORA } from '../../fixtures/builders/ProdutoBuilder.js';
import { ResponsavelTecnico } from '../../../domain/responsavel/ResponsavelTecnico.js';
import type { CriarResponsavelInput } from '../../../application/dtos/responsavel-dtos.js';

const RESPONSAVEL_INPUT: CriarResponsavelInput = {
  nome: 'Maria Química',
  conselho: 'CRQ',
  numeroRegistro: '12345',
  especialidade: 'Química industrial',
};

describe('Casos de uso — CargaQuimica', () => {
  let cargas: InMemoryCargaQuimicaRepository;
  let produtos: InMemoryProdutoQuimicoRepository;
  let responsaveis: InMemoryResponsavelTecnicoRepository;
  let clock: ClockFake;
  let produtoId: string;
  let responsavelId: string;

  const cargaInput = () => ({
    codigo: 'CG-2026-0001',
    produtoQuimicoId: produtoId,
    quantidade: 500,
    unidadeMedida: 'KG',
    responsavelTecnicoId: responsavelId,
    origem: 'Terminal 10 — Santos/SP',
    destino: 'Armazém B — Cubatão/SP',
  });

  beforeEach(async () => {
    cargas = new InMemoryCargaQuimicaRepository();
    produtos = new InMemoryProdutoQuimicoRepository();
    responsaveis = new InMemoryResponsavelTecnicoRepository();
    clock = new ClockFake();

    const produto = ProdutoBuilder.valido().build();
    await produtos.salvar(produto);
    produtoId = produto.id;

    const responsavel = ResponsavelTecnico.criar({ ...RESPONSAVEL_INPUT, agora: AGORA });
    await responsaveis.salvar(responsavel);
    responsavelId = responsavel.id;
  });

  const registrar = () => new RegistrarCargaQuimica(cargas, produtos, responsaveis, clock);

  it('UC-03: registra carga química herdando a classificação de risco do produto (RN-03)', async () => {
    const output = await registrar().executar(cargaInput());

    expect(output.status).toBe('REGISTRADA');
    expect(output.classificacaoRisco).toBe('CORROSIVO');
    expect(output.historico).toHaveLength(1);
  });

  it('RN-01: rejeita carga com produto inexistente (NotFoundError)', async () => {
    await expect(
      registrar().executar({ ...cargaInput(), produtoQuimicoId: 'inexistente' }),
    ).rejects.toMatchObject({ tipo: 'NAO_ENCONTRADO' });
  });

  it('RN-02/RN-10: rejeita carga com produto químico inativo', async () => {
    const produto = await produtos.buscarPorId(produtoId as never);
    produto!.inativar(AGORA);
    await produtos.salvar(produto!);

    await expect(registrar().executar(cargaInput())).rejects.toMatchObject({
      codigo: 'RN-02',
    });
  });

  it('RN-11: rejeita carga com quantidade menor ou igual a zero', async () => {
    await expect(registrar().executar({ ...cargaInput(), quantidade: 0 })).rejects.toMatchObject({
      codigo: 'RN-11',
    });
  });

  it('RN-12: rejeita carga com responsável técnico inexistente', async () => {
    await expect(
      registrar().executar({ ...cargaInput(), responsavelTecnicoId: 'inexistente' }),
    ).rejects.toMatchObject({ tipo: 'NAO_ENCONTRADO' });
  });

  it('rejeita código de carga duplicado (ConflictError)', async () => {
    await registrar().executar(cargaInput());

    await expect(registrar().executar(cargaInput())).rejects.toMatchObject({
      tipo: 'CONFLITO',
    });
  });

  it('UC-04: anexa e valida documentos, habilitando a liberação (RN-04)', async () => {
    const carga = await registrar().executar(cargaInput());

    const anexar = new AnexarDocumentoCarga(cargas, clock);
    const comFispq = await anexar.executar(carga.id, {
      tipo: 'FISPQ',
      numero: 'FISPQ-001',
      dataEmissao: '2026-01-10T00:00:00.000Z',
      dataValidade: '2027-01-10T00:00:00.000Z',
    });
    await anexar.executar(carga.id, {
      tipo: 'CONHECIMENTO_EMBARQUE',
      numero: 'CE-001',
      dataEmissao: '2026-01-10T00:00:00.000Z',
    });

    const fispqId = comFispq.documentos.find((doc) => doc.tipo === 'FISPQ')!.id;
    await new ValidarDocumentoCarga(cargas, clock).executar(carga.id, fispqId);

    // ainda falta validar o conhecimento de embarque → RN-04 bloqueia
    await new AtualizarStatusCarga(cargas, clock).executar(carga.id, {
      status: 'EM_ANALISE',
      ator: 'analista.doc',
    });
    await expect(
      new LiberarCargaQuimica(cargas, clock).executar(carga.id, { ator: 'gestor' }),
    ).rejects.toMatchObject({ codigo: 'RN-04' });
  });

  it('UC-06/UC-08: fluxo completo até FINALIZADA passando pela movimentação', async () => {
    const carga = await registrar().executar(cargaInput());
    const anexar = new AnexarDocumentoCarga(cargas, clock);
    const validar = new ValidarDocumentoCarga(cargas, clock);

    for (const tipo of ['FISPQ', 'CONHECIMENTO_EMBARQUE']) {
      const atualizada = await anexar.executar(carga.id, {
        tipo,
        numero: `${tipo}-001`,
        dataEmissao: '2026-01-10T00:00:00.000Z',
      });
      const doc = atualizada.documentos.at(-1)!;
      await validar.executar(carga.id, doc.id);
    }

    const atualizarStatus = new AtualizarStatusCarga(cargas, clock);
    await atualizarStatus.executar(carga.id, { status: 'EM_ANALISE', ator: 'analista.doc' });

    const liberada = await new LiberarCargaQuimica(cargas, clock).executar(carga.id, {
      ator: 'gestor.operacional',
      motivo: 'Documentação aprovada',
    });
    expect(liberada.status).toBe('LIBERADA');

    const emMovimentacao = await atualizarStatus.executar(carga.id, {
      status: 'EM_MOVIMENTACAO',
      ator: 'operador',
      motivo: 'Saída para o terminal',
    });
    expect(emMovimentacao.status).toBe('EM_MOVIMENTACAO');

    const finalizada = await atualizarStatus.executar(carga.id, {
      status: 'FINALIZADA',
      ator: 'operador',
      motivo: 'Operação concluída',
    });
    expect(finalizada.status).toBe('FINALIZADA');
  });

  it('UC-08: rejeita destino que exige endpoint dedicado (LIBERADA via /status)', async () => {
    const carga = await registrar().executar(cargaInput());

    await expect(
      new AtualizarStatusCarga(cargas, clock).executar(carga.id, {
        status: 'LIBERADA',
        ator: 'gestor',
      }),
    ).rejects.toMatchObject({ codigo: 'TRANSICAO_DEDICADA' });
  });

  it('UC-07: bloqueia carga e RN-05 impede movimentação até o desbloqueio', async () => {
    const carga = await registrar().executar(cargaInput());
    await new AtualizarStatusCarga(cargas, clock).executar(carga.id, {
      status: 'EM_ANALISE',
      ator: 'analista.doc',
    });

    const bloqueada = await new BloquearCargaQuimica(cargas, clock).executar(carga.id, {
      ator: 'gestor.operacional',
      motivo: 'Pendência documental',
    });
    expect(bloqueada.status).toBe('BLOQUEADA');

    // RN-05: tentativa de movimentar carga bloqueada
    await expect(
      new AtualizarStatusCarga(cargas, clock).executar(carga.id, {
        status: 'EM_MOVIMENTACAO',
        ator: 'operador',
      }),
    ).rejects.toMatchObject({ codigo: 'TRANSICAO_INVALIDA' });

    // bloqueio exige motivo
    await expect(
      new BloquearCargaQuimica(cargas, clock).executar(carga.id, { ator: 'gestor' }),
    ).rejects.toMatchObject({ codigo: 'MOTIVO_OBRIGATORIO' });

    // desbloqueio retorna para EM_ANALISE
    const desbloqueada = await new AtualizarStatusCarga(cargas, clock).executar(carga.id, {
      status: 'EM_ANALISE',
      ator: 'gestor.operacional',
      motivo: 'Pendência regularizada',
    });
    expect(desbloqueada.status).toBe('EM_ANALISE');
  });

  it('UC-09: cancela carga e RN-06 impede liberação posterior', async () => {
    const carga = await registrar().executar(cargaInput());

    const cancelada = await new CancelarCargaQuimica(cargas, clock).executar(carga.id, {
      ator: 'gestor.operacional',
      motivo: 'Erro de registro',
    });
    expect(cancelada.status).toBe('CANCELADA');

    await expect(
      new LiberarCargaQuimica(cargas, clock).executar(carga.id, { ator: 'gestor' }),
    ).rejects.toMatchObject({ codigo: 'RN-04' });
  });

  it('UC-10: lista cargas com filtro por status', async () => {
    const carga = await registrar().executar(cargaInput());
    await new CancelarCargaQuimica(cargas, clock).executar(carga.id, {
      ator: 'gestor',
      motivo: 'Cancelamento',
    });
    await registrar().executar({ ...cargaInput(), codigo: 'CG-2026-0002' });

    const listar = new ListarCargasQuimicas(cargas);
    expect(await listar.executar()).toHaveLength(2);
    expect(await listar.executar({ status: 'CANCELADA' })).toHaveLength(1);
    expect(await listar.executar({ status: 'REGISTRADA' })).toHaveLength(1);
    await expect(listar.executar({ status: 'INVALIDO' })).rejects.toMatchObject({
      tipo: 'VALIDACAO',
    });
  });

  it('UC-11: consulta histórico completo da carga', async () => {
    const carga = await registrar().executar(cargaInput());
    await new AtualizarStatusCarga(cargas, clock).executar(carga.id, {
      status: 'EM_ANALISE',
      ator: 'analista.doc',
    });

    const historico = await new ConsultarHistoricoCarga(cargas).executar(carga.id);
    expect(historico).toHaveLength(2);
    expect(historico[1]).toMatchObject({
      statusAnterior: 'REGISTRADA',
      statusNovo: 'EM_ANALISE',
      ator: 'analista.doc',
    });

    await expect(new ConsultarHistoricoCarga(cargas).executar('inexistente')).rejects.toMatchObject({
      tipo: 'NAO_ENCONTRADO',
    });
  });

  it('busca carga por id e falha com inexistente', async () => {
    const carga = await registrar().executar(cargaInput());

    const encontrada = await new BuscarCargaQuimicaPorId(cargas).executar(carga.id);
    expect(encontrada.codigo).toBe('CG-2026-0001');

    await expect(new BuscarCargaQuimicaPorId(cargas).executar('inexistente')).rejects.toMatchObject({
      tipo: 'NAO_ENCONTRADO',
    });
  });
});
