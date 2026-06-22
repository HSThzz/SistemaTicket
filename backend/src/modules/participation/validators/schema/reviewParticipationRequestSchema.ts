import { z } from "zod";

/** Decisão do produtor sobre uma solicitação de participação. */
export enum ParticipationReviewDecision {
  APPROVE = "APPROVE",
  REJECT = "REJECT",
}

export const reviewParticipationRequestSchema = z.object({
  decision: z.nativeEnum(ParticipationReviewDecision, {
    message: "Decisão inválida (use APPROVE ou REJECT)",
  }),
});

export type ReviewParticipationRequestInputSchema = z.infer<
  typeof reviewParticipationRequestSchema
>;
