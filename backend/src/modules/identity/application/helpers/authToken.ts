/**
 * Normaliza o marcador de troca de senha do usuário para comparação com o JWT.
 */
export function getUserPwdAt(passwordChangedAt: Date | null | undefined): number {
  return passwordChangedAt?.getTime() ?? 0;
}

/**
 * Indica se o token foi emitido antes da última troca de senha.
 */
export function isAuthTokenRevoked(
  tokenPwdAt: number | undefined,
  passwordChangedAt: Date | null | undefined,
): boolean {
  return (tokenPwdAt ?? 0) !== getUserPwdAt(passwordChangedAt);
}
