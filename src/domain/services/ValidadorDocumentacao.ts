import { DomainError } from '../../shared/errors/errors.js';
import { DocumentoCarga } from '../carga/DocumentoCarga.js';
import { TipoDocumento } from '../enums/TipoDocumento.js';

/**
 * Serviço de domínio — RN-04: uma carga só pode ser liberada se todos os
 * tipos de documento obrigatórios estiverem presentes, válidos (não
 * vencidos — RN-14) e validados pelo analista de documentação.
 */
export class ValidadorDocumentacao {
  static readonly TIPOS_OBRIGATORIOS: readonly TipoDocumento[] = [
    TipoDocumento.FISPQ,
    TipoDocumento.CONHECIMENTO_EMBARQUE,
  ] as const;

  static validarParaLiberacao(documentos: readonly DocumentoCarga[], agora: Date): void {
    const pendentes = ValidadorDocumentacao.TIPOS_OBRIGATORIOS.filter((tipo) => {
      const documento = documentos.find((doc) => doc.tipo === tipo);
      return !documento || !documento.estaValido(agora);
    });

    if (pendentes.length > 0) {
      throw new DomainError(
        'RN-04',
        `Documentação obrigatória incompleta ou inválida para liberação: ${pendentes.join(', ')}`,
      );
    }
  }
}
