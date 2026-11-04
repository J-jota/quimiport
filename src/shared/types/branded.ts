/**
 * Branded types para IDs (ADR-004): impede trocas acidentais entre
 * identificadores de agregados distintos em tempo de compilação.
 */

export type Brand<T, B> = T & { readonly __brand: B };

export type ProdutoQuimicoId = Brand<string, 'ProdutoQuimicoId'>;
export type CargaId = Brand<string, 'CargaId'>;
export type ResponsavelTecnicoId = Brand<string, 'ResponsavelTecnicoId'>;
export type DocumentoId = Brand<string, 'DocumentoId'>;
export type InspecaoId = Brand<string, 'InspecaoId'>;

export const asProdutoQuimicoId = (valor: string): ProdutoQuimicoId => valor as ProdutoQuimicoId;
export const asCargaId = (valor: string): CargaId => valor as CargaId;
export const asResponsavelTecnicoId = (valor: string): ResponsavelTecnicoId => valor as ResponsavelTecnicoId;
export const asDocumentoId = (valor: string): DocumentoId => valor as DocumentoId;
export const asInspecaoId = (valor: string): InspecaoId => valor as InspecaoId;
