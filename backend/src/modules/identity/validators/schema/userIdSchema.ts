import { z } from "zod";
import { uuidSchema } from "../../../../shared/kernel/zodFields";

export const userIdSchema = uuidSchema;

export type UserIdSchema = z.infer<typeof userIdSchema>;

export const userIdParamsSchema = z.object({
  userId: userIdSchema,
});

export type UserIdParamsSchema = z.infer<typeof userIdParamsSchema>;
