/**
 * @file Payload tipado do job de notificação de participação aprovada.
 * @module modules/participation/application/types/participationApprovedJob
 */

import type { Prettify } from "../../../../shared/kernel/prettify";

export type ParticipationApprovedJobData = Prettify<{
  requestId: string;
  eventId: string;
  eventTitle: string;
  participantName: string;
  participantEmail: string;
}>;
