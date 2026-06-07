/**
 * @file Schemas Zod para rotas HTTP de catálogo (reexportam validators de domínio).
 * @module shared/interfaces/http/validation/catalog.schemas
 */

export { createEventSchema as createEventBodySchema } from "../../../../modules/catalog/validators/schema/createEventSchema";
export { updateEventSchema as updateEventBodySchema } from "../../../../modules/catalog/validators/schema/updateEventSchema";
export { createTicketLotSchema as createTicketLotBodySchema } from "../../../../modules/catalog/validators/schema/createTicketLotSchema";
export { eventIdParamsSchema } from "../../../../modules/catalog/validators/schema/eventIdSchema";
