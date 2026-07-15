/**
 * @file Garante unicidade de slug de evento no banco.
 * @module modules/catalog/application/helpers/ensureUniqueEventSlug
 */

import { Not } from "typeorm";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { MAX_SLUG_LENGTH, slugifyEventTitle } from "./slugifyEventTitle";

/**
 * Gera um slug único a partir do título (ou base já slugificada).
 * Colisões recebem sufixo `-2`, `-3`, …
 */
export async function ensureUniqueEventSlug(
  titleOrBase: string,
  excludeEventId?: string,
): Promise<string> {
  const base = slugifyEventTitle(titleOrBase);
  const repository = AppDataSource.getRepository(Event);

  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await repository.findOne({
      where: excludeEventId
        ? { slug: candidate, id: Not(excludeEventId) }
        : { slug: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    const suffixText = `-${suffix}`;
    candidate = `${base.slice(0, Math.max(1, MAX_SLUG_LENGTH - suffixText.length))}${suffixText}`;
    suffix += 1;
  }
}
