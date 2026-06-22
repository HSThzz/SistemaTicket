import { z } from "zod";
import { uuidSchema } from "../../../../shared/kernel/zodFields";

export const eventIdParamsSchema = z.object({
  eventId: uuidSchema,
});

export type EventIdParamsSchema = z.infer<typeof eventIdParamsSchema>;

export const eventRequestParamsSchema = z.object({
  eventId: uuidSchema,
  requestId: uuidSchema,
});

export type EventRequestParamsSchema = z.infer<typeof eventRequestParamsSchema>;
