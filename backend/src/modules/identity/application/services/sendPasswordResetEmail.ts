import { Logger } from "../../../../shared/infrastructure/config/logger";
import { redactEmail } from "../../../../shared/kernel/redactEmail";
import type { EmailProvider } from "../../../notifications/infrastructure/email/EmailProvider";
import { buildPasswordResetEmail } from "../../../notifications/infrastructure/email/emailTemplates";
import { StubEmailProvider } from "../../../notifications/infrastructure/email/StubEmailProvider";

const CONTEXT = "SendPasswordResetEmail";
const logger = Logger.getInstance();

let emailProvider: EmailProvider = new StubEmailProvider();

export function setPasswordResetEmailProvider(provider: EmailProvider): void {
  emailProvider = provider;
}

export type PasswordResetEmailData = {
  to: string;
  userName: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail(
  data: PasswordResetEmailData,
): Promise<void> {
  logger.info(CONTEXT, "Sending password reset email", {
    to: redactEmail(data.to),
  });

  await emailProvider.send({
    to: data.to,
    subject: "Redefinição de senha — VIBRA",
    html: buildPasswordResetEmail(data),
  });
}
