import type { DataSource } from "typeorm";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { UserNotFoundError } from "../../domain/errors/AuthError";
import {
  lookupUserByEmailSchema,
  type LookupUserByEmailInputSchema,
} from "../../validators/schema/lookupUserByEmailSchema";
import { findOneUserByEmail } from "../queries/findOneUserByEmail";
import type { AuthUserProfile } from "../types";

export async function lookupUserByEmail(
  dataSource: DataSource,
  input: LookupUserByEmailInputSchema,
): Promise<AuthUserProfile> {
  const data = validateSchema(lookupUserByEmailSchema, input);
  const user = await findOneUserByEmail(dataSource, data.email);

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
