import { z } from "zod";
import { UserRole } from "../../../../shared/kernel/enums";

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole, { message: "Papel inválido" }),
});

export type UpdateUserRoleInputSchema = z.infer<typeof updateUserRoleSchema>;
