import { z } from "zod";
import { passwordSchema } from "./passwordSchema";

export const adminResetUserPasswordSchema = z.object({
  newPassword: passwordSchema,
});

export type AdminResetUserPasswordInputSchema = z.infer<
  typeof adminResetUserPasswordSchema
>;
