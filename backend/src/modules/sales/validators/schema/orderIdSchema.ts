import { z } from "zod";
import { uuidSchema } from "../../../../shared/kernel/zodFields";

export const orderIdSchema = uuidSchema;

export type OrderIdSchema = z.infer<typeof orderIdSchema>;

export const orderIdParamsSchema = z.object({
  id: orderIdSchema,
});

export type OrderIdParamsSchema = z.infer<typeof orderIdParamsSchema>;

export const reservationIdParamsSchema = z.object({
  reservationId: orderIdSchema,
});

export type ReservationIdParamsSchema = z.infer<typeof reservationIdParamsSchema>;
