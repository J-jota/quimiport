import { ClasseRisco } from '../../domain/enums/ClasseRisco.js';
import { ResultadoInspecao } from '../../domain/enums/ResultadoInspecao.js';
import { StatusCarga } from '../../domain/enums/StatusCarga.js';
import { TipoDocumento } from '../../domain/enums/TipoDocumento.js';
import { UnidadeMedida } from '../../domain/enums/UnidadeMedida.js';

export interface RegistrarCargaInput {
  codigo: string;
  produtoQuimicoId: string;
  quantidade: number;
  unidadeMedida: string;
  responsavelTecnicoId: string;
  origem: string;
  destino: string;
  dataEntrada?: string | undefined;
}

export interface AnexarDocumentoInput {
  tipo: string;
  numero: string;
  dataEmissao: string;
  dataValidade?: string | undefined;
  urlArquivo?: string | undefined;
}

export interface AcaoCargaInput {
  ator: string;
  motivo?: string | undefined;
}

export interface AtualizarStatusInput extends AcaoCargaInput {
  status: string;
}

export interface SolicitarInspecaoInput {
  motivo: string;
  ator: string;
}

export interface RegistrarResultadoInspecaoInput {
  resultado: string;
  inspetor: string;
  ator: string;
}

export interface DocumentoOutput {
  id: string;
  tipo: TipoDocumento;
  numero: string;
  dataEmissao: Date;
  dataValidade: Date | null;
  validado: boolean;
  urlArquivo: string | null;
}

export interface InspecaoOutput {
  id: string;
  motivo: string;
  dataSolicitacao: Date;
  dataConclusao: Date | null;
  resultado: ResultadoInspecao;
  inspetor: string | null;
}

export interface EventoHistoricoOutput {
  dataHora: Date;
  statusAnterior: StatusCarga | null;
  statusNovo: StatusCarga;
  ator: string;
  motivo: string;
}

export interface CargaOutput {
  id: string;
  codigo: string;
  produtoQuimicoId: string;
  quantidade: number;
  unidadeMedida: UnidadeMedida;
  classificacaoRisco: ClasseRisco;
  responsavelTecnicoId: string;
  origem: string;
  destino: string;
  status: StatusCarga;
  documentos: DocumentoOutput[];
  inspecoes: InspecaoOutput[];
  historico: EventoHistoricoOutput[];
  dataEntrada: Date;
  criadoEm: Date;
  atualizadoEm: Date;
}
