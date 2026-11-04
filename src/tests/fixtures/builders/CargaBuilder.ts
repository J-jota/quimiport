import { CargaQuimica } from '../../../domain/carga/CargaQuimica.js';
import { ClasseRisco } from '../../../domain/enums/ClasseRisco.js';
import { ResultadoInspecao } from '../../../domain/enums/ResultadoInspecao.js';
import { TipoDocumento } from '../../../domain/enums/TipoDocumento.js';
import { UnidadeMedida } from '../../../domain/enums/UnidadeMedida.js';
import { Quantidade } from '../../../domain/value-objects/Quantidade.js';
import {
  asProdutoQuimicoId,
  asResponsavelTecnicoId,
  type InspecaoId,
  type ProdutoQuimicoId,
  type ResponsavelTecnicoId,
} from '../../../shared/types/branded.js';
import { AGORA, VALIDADE_FUTURA } from './ProdutoBuilder.js';

export class CargaBuilder {
  private props = {
    codigo: 'CG-2026-0001',
    produtoQuimicoId: asProdutoQuimicoId('produto-1'),
    quantidade: Quantidade.criar(500, UnidadeMedida.KG),
    classificacaoRisco: ClasseRisco.CORROSIVO,
    responsavelTecnicoId: asResponsavelTecnicoId('responsavel-1'),
    origem: 'Terminal 10 — Santos/SP',
    destino: 'Armazém B — Cubatão/SP',
    agora: AGORA,
  };

  static valida(): CargaBuilder {
    return new CargaBuilder();
  }

  semProduto(): CargaBuilder {
    this.props.produtoQuimicoId = undefined as unknown as ProdutoQuimicoId;
    return this;
  }

  semResponsavel(): CargaBuilder {
    this.props.responsavelTecnicoId = undefined as unknown as ResponsavelTecnicoId;
    return this;
  }

  comQuantidade(valor: number): CargaBuilder {
    this.props.quantidade = Quantidade.criar(valor, UnidadeMedida.KG);
    return this;
  }

  build(): CargaQuimica {
    return CargaQuimica.registrar(this.props);
  }

  /** Carga com FISPQ e Conhecimento de Embarque validados e vigentes (RN-04). */
  buildComDocumentacaoCompleta(): CargaQuimica {
    const carga = this.build();
    for (const tipo of [TipoDocumento.FISPQ, TipoDocumento.CONHECIMENTO_EMBARQUE]) {
      const documento = carga.anexarDocumento({
        tipo,
        numero: `${tipo}-001`,
        dataEmissao: AGORA,
        dataValidade: VALIDADE_FUTURA,
        agora: AGORA,
      });
      carga.validarDocumento(documento.id, AGORA);
    }
    return carga;
  }

  buildEmAnalise(): CargaQuimica {
    const carga = this.buildComDocumentacaoCompleta();
    carga.iniciarAnalise('analista.doc', 'Início da análise', AGORA);
    return carga;
  }

  buildEmInspecao(): CargaQuimica {
    const carga = this.buildEmAnalise();
    carga.solicitarInspecao('Verificação de lacres', 'analista.qualidade', AGORA);
    return carga;
  }

  buildLiberada(): CargaQuimica {
    const carga = this.buildEmAnalise();
    carga.liberar('gestor.operacional', 'Documentação aprovada', AGORA);
    return carga;
  }

  buildBloqueada(): CargaQuimica {
    const carga = this.buildEmAnalise();
    carga.bloquear('gestor.operacional', 'Pendência documental identificada', AGORA);
    return carga;
  }

  static aprovarUltimaInspecao(carga: CargaQuimica, agora: Date = AGORA): void {
    const inspecao = carga.inspecoes.at(-1);
    if (!inspecao) throw new Error('Carga sem inspeção');
    carga.registrarResultadoInspecao(
      inspecao.id as InspecaoId,
      ResultadoInspecao.APROVADA,
      'inspetor.1',
      'inspetor.1',
      agora,
    );
  }
}
