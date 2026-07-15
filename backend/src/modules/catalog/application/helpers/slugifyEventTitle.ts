/**
 * @file Normalização de títulos de evento para slugs de URL.
 * @module modules/catalog/application/helpers/slugifyEventTitle
 */

const MAX_SLUG_LENGTH = 80;

/**
 * Converte um título em slug URL-safe (minúsculas, sem acento, hífens).
 */
export function slugifyEventTitle(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH);

  return slug.length > 0 ? slug : "evento";
}

export { MAX_SLUG_LENGTH };
