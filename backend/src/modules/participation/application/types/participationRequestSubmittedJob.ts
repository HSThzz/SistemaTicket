/**
 * @file Payload tipado do job de nova solicitação de participação (alerta ao produtor).
 * @module modules/participation/application/types/participationRequestSubmittedJob
 */

import type { Prettify } from "../../../../shared/kernel/prettify";

export type ParticipationRequestSubmittedJobData = Prettify<{
  requestId: string;
  eventId: string;
  eventTitle: string;
  producerEmail: string;
  producerName: string;
  participantName: string;
  participantEmail: string;
  participantPhone: string | null;
  participantInstagramHandle: string | null;
}>;
