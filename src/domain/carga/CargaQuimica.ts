import { randomUUID } from 'node:crypto';

import { DomainError } from '../../shared/errors/errors.js';
import {
  asCargaId,
  type CargaId,
  type DocumentoId,
  type InspecaoId,
  type ProdutoQuimicoId,
  type ResponsavelTecnicoId,
} from '../../shared/types/branded.js';
import { ClasseRisco } from '../enums/ClasseRisco.js';
import { ResultadoInspecao } from '../enums/ResultadoInspecao.js';
import { StatusCarga } from '../enums/StatusCarga.js';
import { TipoDocumento } from '../enums/TipoDocumento.js';
import { ValidadorDocumentacao } from '../services/ValidadorDocumentacao.js';
import { EventoHistorico } from '../value-objects/EventoHistorico.js';
import { Quantidade } from '../value-objects/Quantidade.js';
import { DocumentoCarga } from './DocumentoCarga.js';
import { Inspecao } from './Inspecao.js';
import { StatusCargaMachine } from './StatusCargaMachine.js';

export interface CargaQuimicaProps {
  id: CargaId;
  codigo: string;
  produtoQuimicoId: ProdutoQuimicoId;
  quantidade: Quantidade;
  classificacaoRisco: ClasseRisco;
  responsavelTecnicoId: ResponsavelTecnicoId;
  origem: string;
  destino: string;
  status: StatusCarga;
  documentos: DocumentoCarga[];
  inspecoes: Inspecao[];
  historico: EventoHistorico[];
  dataEntrada: Date;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface RegistrarCargaProps {
  codigo: string;
  produtoQuimicoId: ProdutoQuimicoId;
  quantidade: Quantidade;
  classificacaoRisco: ClasseRisco;
  responsavelTecnicoId: ResponsavelTecnicoId;
  origem: string;
  destino: string;
  dataEntrada?: Date | undefined;
  agora?: Date;
}

/**
 * Agregado raiz CargaQuimica (ADR-003) — fronteira transacional que
 * concentra status, documentos, inspeções e histórico.
 *
 * Regras protegidas na factory: RN-01 (produto associado), RN-03 (classe
 * de risco), RN-11 (quantidade > 0, invariante do VO), RN-12 (responsável
 * técnico). RN-02/RN-10 (produto ativo) ficam no caso de uso.
 */
export class CargaQuimica {
  private constructor(private props: CargaQuimicaProps) {}

  static registrar(input: RegistrarCargaProps): CargaQuimica {
    if (!input.codigo?.trim()) {
      throw new DomainError('CODIGO_OBRIGATORIO', 'O código da carga é obrigatório');
    }
    if (!input.produtoQuimicoId) {
      throw new DomainError('RN-01', 'Uma carga química não pode ser registrada sem produto químico associado');
    }
    if (!input.classificacaoRisco) {
      throw new DomainError('RN-03', 'Uma carga química não pode ser registrada sem classificação de risco');
    }
    if (!input.responsavelTecnicoId) {
      throw new DomainError('RN-12', 'Toda carga deve possuir um responsável técnico informado');
    }
    const origem = input.origem?.trim() ?? '';
    const destino = input.destino?.trim() ?? '';
    if (!origem || !destino) {
      throw new DomainError('ORIGEM_DESTINO_OBRIGATORIOS', 'Origem e destino da carga são obrigatórios');
    }

    const agora = input.agora ?? new Date();
    const registro = EventoHistorico.criar({
      statusAnterior: null,
      statusNovo: StatusCarga.REGISTRADA,
      ator: 'sistema',
      motivo: 'Registro da carga química',
      dataHora: agora,
    });

    return new CargaQuimica({
      id: asCargaId(randomUUID()),
      codigo: input.codigo.trim(),
      produtoQuimicoId: input.produtoQuimicoId,
      quantidade: input.quantidade,
      classificacaoRisco: input.classificacaoRisco,
      responsavelTecnicoId: input.responsavelTecnicoId,
      origem,
      destino,
      status: StatusCarga.REGISTRADA,
      documentos: [],
      inspecoes: [],
      historico: [registro],
      dataEntrada: input.dataEntrada ?? agora,
      criadoEm: agora,
      atualizadoEm: agora,
    });
  }

  static reconstituir(props: CargaQuimicaProps): CargaQuimica {
    return new CargaQuimica(props);
  }

  get id(): CargaId {
    return this.props.id;
  }

  get status(): StatusCarga {
    return this.props.status;
  }

  get documentos(): readonly DocumentoCarga[] {
    return this.props.documentos;
  }

  get inspecoes(): readonly Inspecao[] {
    return this.props.inspecoes;
  }

  /** RN-17: histórico imutável — exposto somente para leitura. */
  consultarHistorico(): readonly EventoHistorico[] {
    return this.props.historico;
  }

  anexarDocumento(input: {
    tipo: TipoDocumento;
    numero: string;
    dataEmissao: Date;
    dataValidade?: Date | undefined;
    urlArquivo?: string | undefined;
    agora?: Date;
  }): DocumentoCarga {
    this.exigirStatusNaoTerminal();
    if (!input.numero?.trim()) {
      throw new DomainError('NUMERO_DOCUMENTO_OBRIGATORIO', 'O número do documento é obrigatório');
    }
    const documento = DocumentoCarga.criar(input);
    this.props.documentos.push(documento);
    this.tocar(input.agora);
    return documento;
  }

  validarDocumento(documentoId: DocumentoId, agora: Date = new Date()): void {
    this.exigirStatusNaoTerminal();
    const documento = this.props.documentos.find((doc) => doc.id === documentoId);
    if (!documento) {
      throw new DomainError('DOCUMENTO_NAO_ENCONTRADO', `Documento não encontrado na carga: ${documentoId}`);
    }
    documento.marcarValidado();
    this.tocar(agora);
  }

  iniciarAnalise(ator: string, motivo = 'Início da análise documental', agora: Date = new Date()): void {
    this.transicionarStatus(StatusCarga.EM_ANALISE, ator, motivo, agora);
  }

  solicitarInspecao(motivo: string, ator: string, agora: Date = new Date()): Inspecao {
    const inspecao = Inspecao.solicitar(motivo, agora);
    this.transicionarStatus(StatusCarga.EM_INSPECAO, ator, `Inspeção solicitada: ${inspecao.motivo}`, agora);
    this.props.inspecoes.push(inspecao);
    return inspecao;
  }

  /**
   * Conclui uma inspeção. RN-15: resultado REPROVADA acarreta bloqueio
   * automático da carga.
   */
  registrarResultadoInspecao(
    inspecaoId: InspecaoId,
    resultado: ResultadoInspecao,
    inspetor: string,
    ator: string,
    agora: Date = new Date(),
  ): void {
    if (this.props.status !== StatusCarga.EM_INSPECAO) {
      throw new DomainError(
        'STATUS_NAO_PERMITE_INSPECAO',
        `Resultado de inspeção só pode ser registrado com a carga EM_INSPECAO (atual: ${this.props.status})`,
      );
    }
    const inspecao = this.props.inspecoes.find((item) => item.id === inspecaoId);
    if (!inspecao) {
      throw new DomainError('INSPECAO_NAO_ENCONTRADA', `Inspeção não encontrada na carga: ${inspecaoId}`);
    }
    inspecao.concluir(resultado, inspetor, agora);

    if (resultado === ResultadoInspecao.REPROVADA) {
      this.transicionarStatus(
        StatusCarga.BLOQUEADA,
        ator,
        `Inspeção reprovada pelo inspetor ${inspecao.inspetor} (bloqueio automático — RN-15)`,
        agora,
      );
    } else {
      this.tocar(agora);
    }
  }

  /**
   * RN-04: documentação obrigatória completa, válida e validada.
   * Vindo de EM_INSPECAO, exige inspeção APROVADA (T6).
   */
  liberar(ator: string, motivo: string, agora: Date = new Date()): void {
    ValidadorDocumentacao.validarParaLiberacao(this.props.documentos, agora);
    if (this.props.status === StatusCarga.EM_INSPECAO) {
      const ultimaInspecao = this.props.inspecoes.at(-1);
      if (!ultimaInspecao || ultimaInspecao.resultado !== ResultadoInspecao.APROVADA) {
        throw new DomainError(
          'INSPECAO_NAO_APROVADA',
          'A carga em inspeção só pode ser liberada com inspeção APROVADA',
        );
      }
    }
    this.transicionarStatus(StatusCarga.LIBERADA, ator, motivo, agora);
  }

  bloquear(ator: string, motivo: string, agora: Date = new Date()): void {
    this.exigirMotivo(motivo);
    this.transicionarStatus(StatusCarga.BLOQUEADA, ator, motivo, agora);
  }

  desbloquear(ator: string, motivo: string, agora: Date = new Date()): void {
    this.exigirMotivo(motivo);
    this.transicionarStatus(StatusCarga.EM_ANALISE, ator, motivo, agora);
  }

  iniciarMovimentacao(ator: string, motivo: string, agora: Date = new Date()): void {
    this.transicionarStatus(StatusCarga.EM_MOVIMENTACAO, ator, motivo, agora);
  }

  finalizar(ator: string, motivo: string, agora: Date = new Date()): void {
    this.transicionarStatus(StatusCarga.FINALIZADA, ator, motivo, agora);
  }

  cancelar(ator: string, motivo: string, agora: Date = new Date()): void {
    this.exigirMotivo(motivo);
    this.transicionarStatus(StatusCarga.CANCELADA, ator, motivo, agora);
  }

  /** RN-13: toda transição gera registro no histórico (data, ator, motivo). */
  private transicionarStatus(destino: StatusCarga, ator: string, motivo: string, agora: Date): void {
    StatusCargaMachine.validarTransicao(this.props.status, destino);
    if (!ator?.trim()) {
      throw new DomainError('ATOR_OBRIGATORIO', 'O ator da transição de status é obrigatório');
    }
    this.props.historico.push(
      EventoHistorico.criar({
        statusAnterior: this.props.status,
        statusNovo: destino,
        ator: ator.trim(),
        motivo,
        dataHora: agora,
      }),
    );
    this.props.status = destino;
    this.tocar(agora);
  }

  private exigirMotivo(motivo: string): void {
    if (!motivo?.trim()) {
      throw new DomainError('MOTIVO_OBRIGATORIO', 'O motivo é obrigatório para esta operação');
    }
  }

  private exigirStatusNaoTerminal(): void {
    if (StatusCargaMachine.isTerminal(this.props.status)) {
      throw new DomainError(
        'STATUS_TERMINAL',
        `A carga está em estado terminal (${this.props.status}) e não pode ser alterada`,
      );
    }
  }

  private tocar(agora: Date = new Date()): void {
    this.props.atualizadoEm = agora;
  }

  toSnapshot(): {
    id: string;
    codigo: string;
    produtoQuimicoId: string;
    quantidade: number;
    unidadeMedida: Quantidade['unidade'];
    classificacaoRisco: ClasseRisco;
    responsavelTecnicoId: string;
    origem: string;
    destino: string;
    status: StatusCarga;
    documentos: ReturnType<DocumentoCarga['toSnapshot']>[];
    inspecoes: ReturnType<Inspecao['toSnapshot']>[];
    historico: {
      dataHora: Date;
      statusAnterior: StatusCarga | null;
      statusNovo: StatusCarga;
      ator: string;
      motivo: string;
    }[];
    dataEntrada: Date;
    criadoEm: Date;
    atualizadoEm: Date;
  } {
    return {
      id: this.props.id,
      codigo: this.props.codigo,
      produtoQuimicoId: this.props.produtoQuimicoId,
      quantidade: this.props.quantidade.valor,
      unidadeMedida: this.props.quantidade.unidade,
      classificacaoRisco: this.props.classificacaoRisco,
      responsavelTecnicoId: this.props.responsavelTecnicoId,
      origem: this.props.origem,
      destino: this.props.destino,
      status: this.props.status,
      documentos: this.props.documentos.map((doc) => doc.toSnapshot()),
      inspecoes: this.props.inspecoes.map((inspecao) => inspecao.toSnapshot()),
      historico: this.props.historico.map((evento) => ({
        dataHora: evento.dataHora,
        statusAnterior: evento.statusAnterior,
        statusNovo: evento.statusNovo,
        ator: evento.ator,
        motivo: evento.motivo,
      })),
      dataEntrada: this.props.dataEntrada,
      criadoEm: this.props.criadoEm,
      atualizadoEm: this.props.atualizadoEm,
    };
  }

  /** Acesso interno para mapeadores de persistência. */
  toPersistence(): CargaQuimicaProps {
    return this.props;
  }
}
