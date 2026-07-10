const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

const HAS_LOWERCASE = /[a-z]/;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_DIGIT = /\d/;
const HAS_SPECIAL = /[^a-zA-Z0-9]/;

export const PASSWORD_REQUIREMENTS_HINT =
  "Mínimo 8 caracteres, com letra maiúscula, minúscula, número e caractere especial.";

/**
 * Valida complexidade da senha (espelha regras do backend).
 * @returns Mensagem de erro ou `null` se válida.
 */
export function validatePassword(value: string): string | null {
  if (value.length > MAX_LENGTH) {
    return `Senha deve ter no máximo ${MAX_LENGTH} caracteres`;
  }

  if (value.length < MIN_LENGTH) {
    return `Senha deve ter ao menos ${MIN_LENGTH} caracteres`;
  }

  if (!HAS_LOWERCASE.test(value)) {
    return "Senha deve conter ao menos uma letra minúscula";
  }

  if (!HAS_UPPERCASE.test(value)) {
    return "Senha deve conter ao menos uma letra maiúscula";
  }

  if (!HAS_DIGIT.test(value)) {
    return "Senha deve conter ao menos um número";
  }

  if (!HAS_SPECIAL.test(value)) {
    return "Senha deve conter ao menos um caractere especial";
  }

  return null;
}
