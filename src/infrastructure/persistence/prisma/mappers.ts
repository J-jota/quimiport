import type {
  CargaQuimica as CargaRow,
  DocumentoCarga as DocumentoRow,
  EventoHistorico as EventoRow,
  Inspecao as InspecaoRow,
  ProdutoQuimico as ProdutoRow,
  ResponsavelTecnico as ResponsavelRow,
} from '@prisma/client';

import { CargaQuimica } from '../../../domain/carga/CargaQuimica.js';
import { DocumentoCarga } from '../../../domain/carga/DocumentoCarga.js';
import { Inspecao } from '../../../domain/carga/Inspecao.js';
import { ClasseRisco } from '../../../domain/enums/ClasseRisco.js';
import { GrupoCompatibilidade } from '../../../domain/enums/GrupoCompatibilidade.js';
import { ResultadoInspecao } from '../../../domain/enums/ResultadoInspecao.js';
import { StatusCarga } from '../../../domain/enums/StatusCarga.js';
import { TipoDocumento } from '../../../domain/enums/TipoDocumento.js';
import { UnidadeMedida } from '../../../domain/enums/UnidadeMedida.js';
import { ProdutoQuimico } from '../../../domain/produto/ProdutoQuimico.js';
import { ResponsavelTecnico } from '../../../domain/responsavel/ResponsavelTecnico.js';
import { EventoHistorico } from '../../../domain/value-objects/EventoHistorico.js';
import { NumeroONU } from '../../../domain/value-objects/NumeroONU.js';
import { Quantidade } from '../../../domain/value-objects/Quantidade.js';
import { RegistroProfissional } from '../../../domain/value-objects/RegistroProfissional.js';
import {
  asCargaId,
  asDocumentoId,
  asInspecaoId,
  asProdutoQuimicoId,
  asResponsavelTecnicoId,
} from '../../../shared/types/branded.js';

/** Mapeadores linha ↔ agregado (reconstituição sem revalidação). */

export function produtoParaDominio(row: ProdutoRow): ProdutoQuimico {
  return ProdutoQuimico.reconstituir({
    id: asProdutoQuimicoId(row.id),
    nome: row.nome,
    descricao: row.descricao,
    numeroOnu: NumeroONU.criar(row.numeroOnu),
    classeRisco: row.classeRisco as ClasseRisco,
    grupoCompatibilidade: row.grupoCompatibilidade as GrupoCompatibilidade,
    ativo: row.ativo,
    criadoEm: row.criadoEm,
    atualizadoEm: row.atualizadoEm,
  });
}

export function responsavelParaDominio(row: ResponsavelRow): ResponsavelTecnico {
  return ResponsavelTecnico.reconstituir({
    id: asResponsavelTecnicoId(row.id),
    nome: row.nome,
    registroProfissional: RegistroProfissional.criar(row.conselho, row.numeroRegistro),
    especialidade: row.especialidade,
    ativo: row.ativo,
    criadoEm: row.criadoEm,
    atualizadoEm: row.atualizadoEm,
  });
}

export type CargaRowCompleta = CargaRow & {
  documentos: DocumentoRow[];
  inspecoes: InspecaoRow[];
  historico: EventoRow[];
};

export function cargaParaDominio(row: CargaRowCompleta): CargaQuimica {
  return CargaQuimica.reconstituir({
    id: asCargaId(row.id),
    codigo: row.codigo,
    produtoQuimicoId: asProdutoQuimicoId(row.produtoQuimicoId),
    quantidade: Quantidade.criar(Number(row.quantidade), row.unidadeMedida as UnidadeMedida),
    classificacaoRisco: row.classificacaoRisco as ClasseRisco,
    responsavelTecnicoId: asResponsavelTecnicoId(row.responsavelTecnicoId),
    origem: row.origem,
    destino: row.destino,
    status: row.status as StatusCarga,
    documentos: row.documentos.map((doc) =>
      DocumentoCarga.reconstituir({
        id: asDocumentoId(doc.id),
        tipo: doc.tipo as TipoDocumento,
        numero: doc.numero,
        dataEmissao: doc.dataEmissao,
        dataValidade: doc.dataValidade,
        validado: doc.validado,
        urlArquivo: doc.urlArquivo,
      }),
    ),
    inspecoes: row.inspecoes.map((inspecao) =>
      Inspecao.reconstituir({
        id: asInspecaoId(inspecao.id),
        motivo: inspecao.motivo,
        dataSolicitacao: inspecao.dataSolicitacao,
        dataConclusao: inspecao.dataConclusao,
        resultado: inspecao.resultado as ResultadoInspecao,
        inspetor: inspecao.inspetor,
      }),
    ),
    historico: row.historico.map((evento) =>
      EventoHistorico.criar({
        dataHora: evento.dataHora,
        statusAnterior: (evento.statusAnterior as StatusCarga | null) ?? null,
        statusNovo: evento.statusNovo as StatusCarga,
        ator: evento.ator,
        motivo: evento.motivo,
      }),
    ),
    dataEntrada: row.dataEntrada,
    criadoEm: row.criadoEm,
    atualizadoEm: row.atualizadoEm,
  });
}
