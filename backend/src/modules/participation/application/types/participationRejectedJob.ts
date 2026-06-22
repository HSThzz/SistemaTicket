/**
 * @file Payload tipado do job de notificação de participação recusada.
 * @module modules/participation/application/types/participationRejectedJob
 */

import type { Prettify } from "../../../../shared/kernel/prettify";

export type ParticipationRejectedJobData = Prettify<{
  requestId: string;
  eventId: string;
  eventTitle: string;
  participantName: string;
  participantEmail: string;
}>;
