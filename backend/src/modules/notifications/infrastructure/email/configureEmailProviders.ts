/**
 * @file Bootstrap do provedor de e-mail (Resend ou stub em dev).
 * @module modules/notifications/infrastructure/email/configureEmailProviders
 */

import { env } from "../../../../shared/infrastructure/config/env";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { setContactFormEmailProvider } from "../../../leads/application/services/sendContactFormNotification";
import { setParticipationEmailProvider } from "../../../participation/application/services/sendParticipationApprovedNotification";
import { setEmailProvider } from "../../application/services/deliverTicketsEmail";
import { ResendEmailProvider } from "./ResendEmailProvider";
import { StubEmailProvider } from "./StubEmailProvider";

const CONTEXT = "ConfigureEmailProviders";
const logger = Logger.getInstance();

/**
 * Registra Resend quando `RESEND_API_KEY` está configurada; caso contrário usa stub.
 */
export function configureEmailProviders(): void {
  const apiKey = env.resend.apiKey.trim();

  if (apiKey) {
    const provider = new ResendEmailProvider(apiKey, env.resend.fromEmail);
    setEmailProvider(provider);
    setContactFormEmailProvider(provider);
    setParticipationEmailProvider(provider);
    logger.info(CONTEXT, "Resend email provider configured", {
      from: env.resend.fromEmail,
    });
    return;
  }

  const stub = new StubEmailProvider();
  setEmailProvider(stub);
  setContactFormEmailProvider(stub);
  setParticipationEmailProvider(stub);
  logger.warn(CONTEXT, "RESEND_API_KEY not set — using stub email provider");
}
