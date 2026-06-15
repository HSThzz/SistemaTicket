import { Logger } from "../../../../shared/infrastructure/config/logger";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import {
  DocumentAlreadyExistsError,
  EmailAlreadyExistsError,
  UserNotFoundError,
} from "../../domain/errors/AuthError";
import {
  updateProfileSchema,
  type UpdateProfileInputSchema,
} from "../../validators/schema/updateProfileSchema";
import { userIdSchema } from "../../validators/schema/userIdSchema";
import { updateUser } from "../commands/updateUser";
import { toUserProfile } from "../helpers/toUserProfile";
import { findOneUserByDocument } from "../queries/findOneUserByDocument";
import { findOneUserByEmail } from "../queries/findOneUserByEmail";
import { findOneUserById } from "../queries/findOneUserById";

const CONTEXT = "updateProfile";

export async function updateProfile(
  userId: string,
  input: UpdateProfileInputSchema,
) {
  const id = validateSchema(userIdSchema, userId);
  const data = validateSchema(updateProfileSchema, input);

  const user = await findOneUserById(id);

  if (!user) {
    throw new UserNotFoundError(id);
  }

  const email = data.email.toLowerCase();
  const document = data.document;

  if (email !== user.email) {
    const existingUser = await findOneUserByEmail(email);

    if (existingUser && existingUser.id !== id) {
      throw new EmailAlreadyExistsError(email);
    }
  }

  if (document !== user.document) {
    const existingDocument = await findOneUserByDocument(document);

    if (existingDocument && existingDocument.id !== id) {
      throw new DocumentAlreadyExistsError(document);
    }
  }

  const updatedUser = await updateUser(user, {
    name: data.name,
    email,
    document,
  });

  Logger.getInstance().info(CONTEXT, "Profile updated", {
    userId: updatedUser.id,
    email: updatedUser.email,
  });

  return toUserProfile(updatedUser);
}
