import { ValidationError } from '../errors/errors.js';

/**
 * Converte uma string arbitrária (vinda da borda) em valor de enum,
 * lançando ValidationError quando o valor não pertence ao domínio.
 */
export function parseEnum<E extends Record<string, string>>(
  enumTipo: E,
  valor: string,
  campo: string,
): E[keyof E] {
  const valores = Object.values(enumTipo);
  if (!valores.includes(valor)) {
    throw new ValidationError(
      `Valor inválido para ${campo}: "${valor}". Esperado um de: ${valores.join(', ')}`,
      'ENUM_INVALIDO',
    );
  }
  return valor as E[keyof E];
}
