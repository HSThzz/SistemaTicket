import { z } from "zod";
import { TicketStatus } from "../../../../shared/kernel/enums";
import { cursorPaginationQuerySchema } from "../../../../shared/kernel/cursorPaginationSchema";

export const listUserTicketsQuerySchema = cursorPaginationQuerySchema.extend({
  status: z.nativeEnum(TicketStatus, { message: "Status inválido" }).optional(),
});

export type ListUserTicketsQuerySchema = z.infer<typeof listUserTicketsQuerySchema>;
