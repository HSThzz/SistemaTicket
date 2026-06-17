/**
 * @file Payload tipado do job de notificação do formulário de contato.
 * @module modules/leads/application/types/contactFormJob
 */

import type { Prettify } from "../../../../shared/kernel/prettify";

export type ContactFormJobData = Prettify<{
  leadId: string;
  name: string;
  email: string;
  phone: string | null;
}>;
