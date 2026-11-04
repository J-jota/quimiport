/**
 * Hierarquia de erros tipados (ADR-005).
 *
 * - ValidationError: entrada malformada na borda (HTTP 400)
 * - NotFoundError: recurso inexistente (HTTP 404)
 * - ConflictError: conflito de estado/unicidade (HTTP 409)
 * - DomainError: violação de regra de negócio RN-XX (HTTP 422)
 */

export abstract class AppError extends Error {
  abstract readonly tipo: string;

  constructor(
    readonly codigo: string,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  readonly tipo = 'VALIDACAO';

  constructor(message: string, codigo = 'ENTRADA_INVALIDA') {
    super(codigo, message);
  }
}

export class NotFoundError extends AppError {
  readonly tipo = 'NAO_ENCONTRADO';

  constructor(recurso: string, id: string) {
    super('NAO_ENCONTRADO', `${recurso} não encontrado(a): ${id}`);
  }
}

export class ConflictError extends AppError {
  readonly tipo = 'CONFLITO';

  constructor(message: string, codigo = 'CONFLITO') {
    super(codigo, message);
  }
}

export class DomainError extends AppError {
  readonly tipo = 'REGRA_DE_NEGOCIO';

  constructor(codigo: string, message: string) {
    super(codigo, message);
  }
}
