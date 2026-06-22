import { z } from "zod";
import { ParticipationRequestStatus } from "../../../../shared/kernel/enums";

export const listParticipationRequestsQuerySchema = z.object({
  status: z
    .nativeEnum(ParticipationRequestStatus, { message: "Status inválido" })
    .optional()
    .default(ParticipationRequestStatus.PENDING),
});

export type ListParticipationRequestsQuerySchema = z.infer<
  typeof listParticipationRequestsQuerySchema
>;
