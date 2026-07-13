import { Logger } from "../../../../shared/infrastructure/config/logger";
import {
  isUniqueViolation,
  isUniqueViolationOn,
} from "../../../../shared/infrastructure/persistence/isUniqueViolation";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import {
  CurrentPasswordRequiredError,
  DocumentAlreadyExistsError,
  EmailAlreadyExistsError,
  InvalidCurrentPasswordError,
  UserNotFoundError,
} from "../../domain/errors/AuthError";
import {
  updateProfileSchema,
  type UpdateProfileInputSchema,
} from "../../validators/schema/updateProfileSchema";
import { userIdSchema } from "../../validators/schema/userIdSchema";
import { updateUser } from "../commands/updateUser";
import { verifyPassword } from "../helpers/passwordHash";
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
    if (!data.currentPassword) {
      throw new CurrentPasswordRequiredError();
    }

    const passwordMatches = await verifyPassword(
      data.currentPassword,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new InvalidCurrentPasswordError();
    }

    const existingUser = await findOneUserByEmail(email);

    if (existingUser && existingUser.id !== id) {
      throw new EmailAlreadyExistsError();
    }
  }

  if (document !== user.document) {
    const existingDocument = await findOneUserByDocument(document);

    if (existingDocument && existingDocument.id !== id) {
      throw new DocumentAlreadyExistsError();
    }
  }

  try {
    const updatedUser = await updateUser(user, {
      name: data.name,
      email,
      document,
    });

    Logger.getInstance().info(CONTEXT, "Profile updated", {
      userId: updatedUser.id,
      email: updatedUser.email,
    });

    return toUserProfile(updatedUser, { includeDocument: true });
  } catch (error) {
    if (isUniqueViolationOn(error, "email")) {
      throw new EmailAlreadyExistsError();
    }

    if (isUniqueViolationOn(error, "document") || isUniqueViolation(error)) {
      throw new DocumentAlreadyExistsError();
    }

    throw error;
  }
}
