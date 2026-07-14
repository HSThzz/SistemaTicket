import { z } from "zod";

export const addCheckInStaffSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
});

export type AddCheckInStaffInputSchema = z.infer<typeof addCheckInStaffSchema>;
