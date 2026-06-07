import { z } from "zod";
import { OrderStatus } from "../../../../shared/kernel/enums";
import { cursorPaginationQuerySchema } from "../../../../shared/kernel/cursorPaginationSchema";

export const listUserOrdersQuerySchema = cursorPaginationQuerySchema.extend({
  status: z.nativeEnum(OrderStatus, { message: "Status inválido" }).optional(),
});

export type ListUserOrdersQuerySchema = z.infer<typeof listUserOrdersQuerySchema>;
