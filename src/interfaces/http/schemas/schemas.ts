import { ClasseRisco } from '../../../domain/enums/ClasseRisco.js';
import { GrupoCompatibilidade } from '../../../domain/enums/GrupoCompatibilidade.js';
import { ResultadoInspecao } from '../../../domain/enums/ResultadoInspecao.js';
import { StatusCarga } from '../../../domain/enums/StatusCarga.js';
import { TipoDocumento } from '../../../domain/enums/TipoDocumento.js';
import { UnidadeMedida } from '../../../domain/enums/UnidadeMedida.js';

const valores = (e: Record<string, string>) => Object.values(e);

/** Schemas JSON compartilhados para validação de entrada e Swagger. */

export const erroResponseSchema = {
  type: 'object',
  properties: {
    erro: {
      type: 'object',
      properties: {
        tipo: { type: 'string' },
        codigo: { type: 'string', description: 'Código da regra (ex.: RN-04) ou do erro técnico' },
        mensagem: { type: 'string' },
      },
    },
  },
} as const;

export const respostasErro = {
  400: { description: 'Entrada inválida (formato)', ...erroResponseSchema },
  404: { description: 'Recurso não encontrado', ...erroResponseSchema },
  409: { description: 'Conflito (ex.: nome/código duplicado)', ...erroResponseSchema },
  422: { description: 'Violação de regra de negócio', ...erroResponseSchema },
} as const;

/**
 * Respostas de sucesso permissivas: os DTOs já são montados pelos casos de
 * uso; o schema existe apenas para documentação no Swagger, sem stripping.
 */
export const respostaObjeto = { type: 'object', additionalProperties: true } as const;
export const respostaLista = { type: 'array' } as const;

export const produtoBodySchema = {
  type: 'object',
  required: ['nome', 'numeroOnu', 'classeRisco', 'grupoCompatibilidade'],
  additionalProperties: false,
  properties: {
    nome: { type: 'string', minLength: 1, description: 'RN-08: obrigatório' },
    descricao: { type: 'string' },
    numeroOnu: { type: 'string', pattern: '^ONU \\d{4}$', description: 'Formato "ONU 1993"' },
    classeRisco: { type: 'string', enum: valores(ClasseRisco), description: 'RN-09: obrigatório' },
    grupoCompatibilidade: { type: 'string', enum: valores(GrupoCompatibilidade) },
  },
} as const;

export const produtoUpdateSchema = {
  ...produtoBodySchema,
  required: [] as string[],
};

export const responsavelBodySchema = {
  type: 'object',
  required: ['nome', 'conselho', 'numeroRegistro'],
  additionalProperties: false,
  properties: {
    nome: { type: 'string', minLength: 1 },
    conselho: { type: 'string', enum: ['CRQ', 'CREA', 'CRF', 'CRM', 'CRBIO'] },
    numeroRegistro: { type: 'string', minLength: 1 },
    especialidade: { type: 'string' },
  },
} as const;

export const cargaBodySchema = {
  type: 'object',
  required: ['codigo', 'produtoQuimicoId', 'quantidade', 'unidadeMedida', 'responsavelTecnicoId', 'origem', 'destino'],
  additionalProperties: false,
  properties: {
    codigo: { type: 'string', minLength: 1 },
    produtoQuimicoId: { type: 'string', format: 'uuid' },
    quantidade: { type: 'number', exclusiveMinimum: 0, description: 'RN-11: maior que zero' },
    unidadeMedida: { type: 'string', enum: valores(UnidadeMedida) },
    responsavelTecnicoId: { type: 'string', format: 'uuid' },
    origem: { type: 'string', minLength: 1 },
    destino: { type: 'string', minLength: 1 },
    dataEntrada: { type: 'string', format: 'date-time' },
  },
} as const;

export const documentoBodySchema = {
  type: 'object',
  required: ['tipo', 'numero', 'dataEmissao'],
  additionalProperties: false,
  properties: {
    tipo: { type: 'string', enum: valores(TipoDocumento) },
    numero: { type: 'string', minLength: 1 },
    dataEmissao: { type: 'string', format: 'date-time' },
    dataValidade: { type: 'string', format: 'date-time' },
    urlArquivo: { type: 'string' },
  },
} as const;

export const acaoCargaBodySchema = {
  type: 'object',
  required: ['ator'],
  additionalProperties: false,
  properties: {
    ator: { type: 'string', minLength: 1 },
    motivo: { type: 'string' },
  },
} as const;

export const acaoComMotivoBodySchema = {
  ...acaoCargaBodySchema,
  required: ['ator', 'motivo'],
  properties: {
    ...acaoCargaBodySchema.properties,
    motivo: { type: 'string', minLength: 1 },
  },
} as const;

export const atualizarStatusBodySchema = {
  type: 'object',
  required: ['status', 'ator'],
  additionalProperties: false,
  properties: {
    status: {
      type: 'string',
      enum: [StatusCarga.EM_ANALISE, StatusCarga.EM_MOVIMENTACAO, StatusCarga.FINALIZADA],
      description:
        'Transições operacionais. Para LIBERADA, BLOQUEADA e CANCELADA use os endpoints dedicados.',
    },
    ator: { type: 'string', minLength: 1 },
    motivo: { type: 'string' },
  },
} as const;

export const inspecaoBodySchema = {
  type: 'object',
  required: ['motivo', 'ator'],
  additionalProperties: false,
  properties: {
    motivo: { type: 'string', minLength: 1 },
    ator: { type: 'string', minLength: 1 },
  },
} as const;

export const resultadoInspecaoBodySchema = {
  type: 'object',
  required: ['resultado', 'inspetor', 'ator'],
  additionalProperties: false,
  properties: {
    resultado: { type: 'string', enum: [ResultadoInspecao.APROVADA, ResultadoInspecao.REPROVADA] },
    inspetor: { type: 'string', minLength: 1 },
    ator: { type: 'string', minLength: 1 },
  },
} as const;

export const filtroStatusQuerySchema = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: valores(StatusCarga) },
  },
} as const;

export const idParamSchema = {
  type: 'object',
  properties: { id: { type: 'string' } },
} as const;
