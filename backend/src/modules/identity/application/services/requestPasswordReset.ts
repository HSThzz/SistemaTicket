import { Logger } from "../../../../shared/infrastructure/config/logger";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { createPasswordResetToken } from "../commands/createPasswordResetToken";
import { invalidatePasswordResetTokensForUser } from "../commands/invalidatePasswordResetTokensForUser";
import { generatePasswordResetToken } from "../helpers/passwordResetToken";
import { findOneUserByEmail } from "../queries/findOneUserByEmail";
import {
  forgotPasswordSchema,
  type ForgotPasswordInputSchema,
} from "../../validators/schema/forgotPasswordSchema";
import { sendPasswordResetEmail } from "./sendPasswordResetEmail";

const CONTEXT = "requestPasswordReset";

function buildPasswordResetUrl(rawToken: string): string {
  const configured = process.env.APP_PUBLIC_URL?.trim();
  const baseUrl = configured?.replace(/\/+$/, "") ?? "http://127.0.0.1:5173";
  return `${baseUrl}/redefinir-senha?token=${encodeURIComponent(rawToken)}`;
}

export async function requestPasswordReset(input: ForgotPasswordInputSchema) {
  const data = validateSchema(forgotPasswordSchema, input);

  const user = await findOneUserByEmail(data.email);

  if (user) {
    await invalidatePasswordResetTokensForUser(user.id);

    const { rawToken, tokenHash, expiresAt } = generatePasswordResetToken();

    await createPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    try {
      await sendPasswordResetEmail({
        to: user.email,
        userName: user.name,
        resetUrl: buildPasswordResetUrl(rawToken),
      });
    } catch (error) {
      Logger.getInstance().error(CONTEXT, "Failed to send password reset email", {
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  } else {
    Logger.getInstance().info(CONTEXT, "Password reset requested for unknown email", {
      email: data.email.toLowerCase(),
    });
  }

  return { success: true as const };
}
