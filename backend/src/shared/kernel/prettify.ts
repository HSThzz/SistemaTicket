/**
 * @file Utilitário de tipos para expandir interseções em objetos legíveis.
 * @module shared/kernel/prettify
 */

/** Expande tipos intersectados (`Pick` + `Partial`, etc.) para leitura no editor. */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
