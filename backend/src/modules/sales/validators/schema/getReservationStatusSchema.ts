import { z } from "zod";
import { uuidSchema } from "../../../../shared/kernel/zodFields";

export const getReservationStatusSchema = z.object({
  reservationId: uuidSchema,
  requesterUserId: uuidSchema,
});

export type GetReservationStatusInputSchema = z.infer<typeof getReservationStatusSchema>;
