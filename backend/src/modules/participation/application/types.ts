/**
 * @file Tipos compartilhados do módulo de solicitações de participação.
 * @module modules/participation/application/types
 */

import type { UserRole } from "../../../shared/kernel/enums";

export type { SubmitParticipationRequestInputSchema } from "../validators/schema/submitParticipationRequestSchema";
export type { ReviewParticipationRequestInputSchema } from "../validators/schema/reviewParticipationRequestSchema";

/** Ator autenticado (produtor/equipe) que gerencia solicitações. */
export interface ParticipationActor {
  userId: string;
  role: UserRole;
}

/** Identidade opcional de quem envia a solicitação (usuário logado). */
export interface ParticipationRequester {
  userId: string | null;
}
