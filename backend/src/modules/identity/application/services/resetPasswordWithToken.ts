import bcrypt from "bcrypt";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import {
  InvalidPasswordResetTokenError,
  PasswordReuseError,
} from "../../domain/errors/AuthError";
import {
  resetPasswordSchema,
  type ResetPasswordInputSchema,
} from "../../validators/schema/resetPasswordSchema";
import { invalidatePasswordResetTokensForUser } from "../commands/invalidatePasswordResetTokensForUser";
import { markPasswordResetTokenUsed } from "../commands/markPasswordResetTokenUsed";
import { updateUser } from "../commands/updateUser";
import { buildAuthResponse } from "../helpers/buildAuthResponse";
import { hashPasswordResetToken } from "../helpers/passwordResetToken";
import { findValidPasswordResetTokenByHash } from "../queries/findValidPasswordResetTokenByHash";

const CONTEXT = "resetPasswordWithToken";
const BCRYPT_ROUNDS = 12;

export async function resetPasswordWithToken(input: ResetPasswordInputSchema) {
  const data = validateSchema(resetPasswordSchema, input);
  const tokenHash = hashPasswordResetToken(data.token);

  const resetToken = await findValidPasswordResetTokenByHash(tokenHash);

  if (!resetToken || resetToken.usedAt) {
    throw new InvalidPasswordResetTokenError();
  }

  if (resetToken.expiresAt.getTime() <= Date.now()) {
    Logger.getInstance().warn(CONTEXT, "Password reset rejected", {
      userId: resetToken.userId,
      reason: "expired_token",
    });
    throw new InvalidPasswordResetTokenError();
  }

  const user = resetToken.user;

  const reusesCurrentPassword = await bcrypt.compare(
    data.newPassword,
    user.passwordHash,
  );

  if (reusesCurrentPassword) {
    throw new PasswordReuseError();
  }

  const passwordHash = await bcrypt.hash(data.newPassword, BCRYPT_ROUNDS);
  const passwordChangedAt = new Date();

  const updatedUser = await updateUser(user, { passwordHash, passwordChangedAt });
  await markPasswordResetTokenUsed(resetToken);
  await invalidatePasswordResetTokensForUser(user.id);

  Logger.getInstance().info(CONTEXT, "Password reset completed", {
    userId: user.id,
  });

  return buildAuthResponse(updatedUser);
}
