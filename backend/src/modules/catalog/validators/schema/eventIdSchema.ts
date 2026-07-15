import { z } from "zod";
import { uuidSchema } from "../../../../shared/kernel/zodFields";

export const eventIdSchema = uuidSchema;

export type EventIdSchema = z.infer<typeof eventIdSchema>;

export const eventIdParamsSchema = z.object({
  eventId: eventIdSchema,
});

export type EventIdParamsSchema = z.infer<typeof eventIdParamsSchema>;

/** UUID ou slug para lookup público de evento. */
export const eventPublicIdSchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) =>
      uuidSchema.safeParse(value).success ||
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
    "Identificador de evento inválido",
  );

export type EventPublicIdSchema = z.infer<typeof eventPublicIdSchema>;

export const eventPublicIdParamsSchema = z.object({
  eventId: eventPublicIdSchema,
});

export type EventPublicIdParamsSchema = z.infer<typeof eventPublicIdParamsSchema>;

export const eventLotParamsSchema = z.object({
  eventId: eventIdSchema,
  lotId: uuidSchema,
});

export type EventLotParamsSchema = z.infer<typeof eventLotParamsSchema>;

export const eventStaffParamsSchema = z.object({
  eventId: eventIdSchema,
  userId: uuidSchema,
});

export type EventStaffParamsSchema = z.infer<typeof eventStaffParamsSchema>;
