/**
 * @file Schemas Zod para rotas HTTP de vendas (reexportam validators de domínio).
 * @module shared/interfaces/http/validation/sales.schemas
 */

export { reserveTicketsBodySchema as reserveBodySchema } from "../../../../modules/sales/validators/schema/reserveTicketsBodySchema";
export { orderIdParamsSchema } from "../../../../modules/sales/validators/schema/orderIdSchema";
export { reservationIdParamsSchema } from "../../../../modules/sales/validators/schema/orderIdSchema";
