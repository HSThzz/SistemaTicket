import { z } from "zod";

export const listAdminAuditLogsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export type ListAdminAuditLogsQuerySchema = z.infer<
  typeof listAdminAuditLogsQuerySchema
>;
