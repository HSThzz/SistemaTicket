/**
 * @file Schemas Zod dos jobs de notificação de participação.
 * @module modules/participation/validators/schema/participationNotificationJobSchemas
 */

import { z } from "zod";
import { uuidSchema } from "../../../../shared/kernel/zodFields";

export const participationApprovedJobSchema = z.object({
  requestId: uuidSchema,
  eventId: uuidSchema,
  eventTitle: z.string().trim().min(1).max(255),
  participantName: z.string().trim().min(1).max(255),
  participantEmail: z.string().trim().email().max(255),
});

export const participationRejectedJobSchema = participationApprovedJobSchema;

export const participationRequestSubmittedJobSchema = z.object({
  requestId: uuidSchema,
  eventId: uuidSchema,
  eventTitle: z.string().trim().min(1).max(255),
  producerEmail: z.string().trim().email().max(255),
  producerName: z.string().trim().min(1).max(255),
  participantName: z.string().trim().min(1).max(255),
  participantEmail: z.string().trim().email().max(255),
  participantPhone: z.string().trim().max(32).nullable(),
  participantInstagramHandle: z.string().trim().max(30).nullable(),
});
