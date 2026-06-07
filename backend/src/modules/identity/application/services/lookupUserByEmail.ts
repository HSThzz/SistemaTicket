import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { UserNotFoundError } from "../../domain/errors/AuthError";
import {
  lookupUserByEmailSchema,
  type LookupUserByEmailInputSchema,
} from "../../validators/schema/lookupUserByEmailSchema";
import { findOneUserByEmail } from "../queries/findOneUserByEmail";

export async function lookupUserByEmail(
  input: LookupUserByEmailInputSchema,
) {
  const data = validateSchema(lookupUserByEmailSchema, input);
  const user = await findOneUserByEmail(data.email);

  if (!user) {
    throw new UserNotFoundError(data.email);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
