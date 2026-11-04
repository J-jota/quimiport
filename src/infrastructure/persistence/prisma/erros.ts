import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { ConflictError } from '../../../shared/errors/errors.js';

/**
 * Executa uma operação Prisma traduzindo violação de unicidade (P2002)
 * para ConflictError — erro técnico nunca vaza como 500 para o cliente.
 */
export async function comTraducaoDeConflito<T>(operacao: () => Promise<T>): Promise<T> {
  try {
    return await operacao();
  } catch (erro) {
    if (erro instanceof PrismaClientKnownRequestError && erro.code === 'P2002') {
      const alvo = (erro.meta?.target as string[] | undefined)?.join(', ') ?? 'campo único';
      throw new ConflictError(`Violação de unicidade em: ${alvo}`);
    }
    throw erro;
  }
}
