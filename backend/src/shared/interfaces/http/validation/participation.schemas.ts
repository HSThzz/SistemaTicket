/**
 * @file Schemas Zod para rotas HTTP de participação (reexportam validators de domínio).
 * @module shared/interfaces/http/validation/participation.schemas
 */

export { submitParticipationRequestSchema as submitParticipationRequestBodySchema } from "../../../../modules/participation/validators/schema/submitParticipationRequestSchema";
export { reviewParticipationRequestSchema as reviewParticipationRequestBodySchema } from "../../../../modules/participation/validators/schema/reviewParticipationRequestSchema";
export { updateAllowedTicketLotsSchema as updateAllowedTicketLotsBodySchema } from "../../../../modules/participation/validators/schema/updateAllowedTicketLotsSchema";
export { listParticipationRequestsQuerySchema } from "../../../../modules/participation/validators/schema/listParticipationRequestsQuerySchema";
export {
  eventIdParamsSchema as participationEventIdParamsSchema,
  eventRequestParamsSchema as participationEventRequestParamsSchema,
} from "../../../../modules/participation/validators/schema/participationParamsSchema";
