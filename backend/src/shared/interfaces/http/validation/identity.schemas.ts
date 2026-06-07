/**
 * @file Schemas Zod para rotas HTTP de identidade (reexportam validators de domínio).
 * @module shared/interfaces/http/validation/identity.schemas
 */

export { registerUserSchema as registerBodySchema } from "../../../../modules/identity/validators/schema/registerUserSchema";
export { loginUserSchema as loginBodySchema } from "../../../../modules/identity/validators/schema/loginUserSchema";
export { updateUserRoleSchema as updateRoleBodySchema } from "../../../../modules/identity/validators/schema/updateUserRoleSchema";
export { lookupUserByEmailSchema as lookupUserQuerySchema } from "../../../../modules/identity/validators/schema/lookupUserByEmailSchema";
export { userIdParamsSchema } from "../../../../modules/identity/validators/schema/userIdSchema";
