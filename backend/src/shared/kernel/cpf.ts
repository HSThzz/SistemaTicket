/**
 * @file Validação e normalização de CPF brasileiro.
 * @module shared/kernel/cpf
 */

/** Remove caracteres não numéricos de CPF/CNPJ. */
export function sanitizeDocument(document: string): string {
  return document.replace(/\D/g, "");
}

/** Valida dígitos verificadores de um CPF brasileiro (11 dígitos). */
export function isValidCpf(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(cpf[index]) * (10 - index);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }
  if (remainder !== Number(cpf[9])) {
    return false;
  }

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(cpf[index]) * (11 - index);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }

  return remainder === Number(cpf[10]);
}
