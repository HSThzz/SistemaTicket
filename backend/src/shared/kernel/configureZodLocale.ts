/**
 * @file Configura mensagens de validação Zod em português (locale `pt`).
 * @module shared/kernel/configureZodLocale
 */

import { z } from "zod";

let configured = false;

/** Aplica o locale português do Zod uma única vez no processo. */
export function configureZodLocale(): void {
  if (configured) {
    return;
  }

  z.config(z.locales.pt());
  configured = true;
}

configureZodLocale();
