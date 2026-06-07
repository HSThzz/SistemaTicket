import { z } from "zod";
import { uuidSchema } from "../../../../shared/kernel/zodFields";

export const eventIdSchema = uuidSchema;

export type EventIdSchema = z.infer<typeof eventIdSchema>;

export const eventIdParamsSchema = z.object({
  eventId: eventIdSchema,
});

export type EventIdParamsSchema = z.infer<typeof eventIdParamsSchema>;
