/**
 * @file Normalização e validação de handle do Instagram.
 * @module modules/participation/application/helpers/normalizeInstagramHandle
 */

/** Limite oficial de username no Instagram. */
export const INSTAGRAM_HANDLE_MAX_LENGTH = 30;

const HANDLE_PATTERN = /^[a-zA-Z0-9._]{1,30}$/;

/**
 * Extrai o username (sem `@`) de texto livre, URL ou handle com `@`.
 * Retorna `undefined` se vazio após limpeza.
 */
export function normalizeInstagramHandle(
  value: string | undefined | null,
): string | undefined {
  if (value == null) {
    return undefined;
  }

  let handle = value.trim();
  if (!handle) {
    return undefined;
  }

  handle = handle.replace(/^@+/, "");

  const urlMatch = handle.match(
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)/i,
  );
  if (urlMatch?.[1]) {
    handle = urlMatch[1];
  }

  handle = handle.replace(/\/+$/, "").split(/[/?#]/)[0] ?? "";
  handle = handle.replace(/^@+/, "").trim();

  return handle || undefined;
}

/** Indica se o handle normalizado é um username Instagram válido. */
export function isValidInstagramHandle(handle: string): boolean {
  return HANDLE_PATTERN.test(handle);
}

/** URL pública do perfil a partir do handle já normalizado (sem `@`). */
export function buildInstagramProfileUrl(handle: string): string {
  return `https://www.instagram.com/${encodeURIComponent(handle)}/`;
}
