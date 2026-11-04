import { ResultadoInspecao } from '../../../domain/enums/ResultadoInspecao.js';
import { TipoDocumento } from '../../../domain/enums/TipoDocumento.js';
import { asDocumentoId, asInspecaoId } from '../../../shared/types/branded.js';
import { parseEnum } from '../../../shared/types/parse-enum.js';
import type {
  AnexarDocumentoInput,
  CargaOutput,
  RegistrarResultadoInspecaoInput,
  SolicitarInspecaoInput,
} from '../../dtos/carga-dtos.js';
import type { CargaQuimicaRepository } from '../../ports/CargaQuimicaRepository.js';
import type { Clock } from '../../ports/Clock.js';
import { buscarCargaOuFalhar } from './ConsultarCargasQuimicas.js';

/** UC-04 (parcial) — anexar documento à carga. */
export class AnexarDocumentoCarga {
  constructor(
    private readonly cargas: CargaQuimicaRepository,
    private readonly clock: Clock,
  ) {}

  async executar(cargaId: string, input: AnexarDocumentoInput): Promise<CargaOutput> {
    const carga = await buscarCargaOuFalhar(this.cargas, cargaId);
    carga.anexarDocumento({
      tipo: parseEnum(TipoDocumento, input.tipo, 'tipo'),
      numero: input.numero,
      dataEmissao: new Date(input.dataEmissao),
      dataValidade: input.dataValidade ? new Date(input.dataValidade) : undefined,
      urlArquivo: input.urlArquivo,
      agora: this.clock.agora(),
    });
    await this.cargas.salvar(carga);
    return carga.toSnapshot();
  }
}

/** UC-04 (parcial) — marcar documento como validado pelo analista. */
export class ValidarDocumentoCarga {
  constructor(
    private readonly cargas: CargaQuimicaRepository,
    private readonly clock: Clock,
  ) {}

  async executar(cargaId: string, documentoId: string): Promise<CargaOutput> {
    const carga = await buscarCargaOuFalhar(this.cargas, cargaId);
    carga.validarDocumento(asDocumentoId(documentoId), this.clock.agora());
    await this.cargas.salvar(carga);
    return carga.toSnapshot();
  }
}

/** UC-05 — Solicitar Inspeção (carga transiciona para EM_INSPECAO). */
export class SolicitarInspecao {
  constructor(
    private readonly cargas: CargaQuimicaRepository,
    private readonly clock: Clock,
  ) {}

  async executar(cargaId: string, input: SolicitarInspecaoInput): Promise<CargaOutput> {
    const carga = await buscarCargaOuFalhar(this.cargas, cargaId);
    carga.solicitarInspecao(input.motivo, input.ator, this.clock.agora());
    await this.cargas.salvar(carga);
    return carga.toSnapshot();
  }
}

/** UC-05 (continuação) — registrar resultado da inspeção (RN-15). */
export class RegistrarResultadoInspecao {
  constructor(
    private readonly cargas: CargaQuimicaRepository,
    private readonly clock: Clock,
  ) {}

  async executar(
    cargaId: string,
    inspecaoId: string,
    input: RegistrarResultadoInspecaoInput,
  ): Promise<CargaOutput> {
    const carga = await buscarCargaOuFalhar(this.cargas, cargaId);
    carga.registrarResultadoInspecao(
      asInspecaoId(inspecaoId),
      parseEnum(ResultadoInspecao, input.resultado, 'resultado'),
      input.inspetor,
      input.ator,
      this.clock.agora(),
    );
    await this.cargas.salvar(carga);
    return carga.toSnapshot();
  }
}
