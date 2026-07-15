import { z } from "zod";
import { uuidSchema } from "../../../../shared/kernel/zodFields";

/** Decisão do produtor sobre uma solicitação de participação. */
export enum ParticipationReviewDecision {
  APPROVE = "APPROVE",
  REJECT = "REJECT",
}

export const reviewParticipationRequestSchema = z
  .object({
    decision: z.nativeEnum(ParticipationReviewDecision, {
      message: "Decisão inválida (use APPROVE ou REJECT)",
    }),
    /** Obrigatório ao aprovar: lotes do evento que o usuário poderá comprar. */
    ticketLotIds: z.array(uuidSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.decision !== ParticipationReviewDecision.APPROVE) {
      return;
    }

    if (!data.ticketLotIds || data.ticketLotIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione ao menos um lote ao aprovar a participação",
        path: ["ticketLotIds"],
      });
    }
  });

export type ReviewParticipationRequestInputSchema = z.infer<
  typeof reviewParticipationRequestSchema
>;
