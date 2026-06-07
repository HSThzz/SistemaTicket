/**
 * @file Tipos compartilhados do módulo de catálogo.
 * @module modules/catalog/application/types
 */

import type { EventStatus } from "../../../shared/kernel/enums";
import type { UserRole } from "../../../shared/kernel/enums";

/** Ator autenticado que executa operações sobre eventos. */
export interface EventActor {
  userId: string;
  role: UserRole;
}

/** Dados para criação de um evento. */
export interface CreateEventInput {
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl?: string | null;
  status?: EventStatus;
}

/** Dados parciais para atualização de evento. */
export interface UpdateEventInput {
  title?: string;
  description?: string;
  date?: string;
  location?: string;
  imageUrl?: string | null;
  status?: EventStatus;
}

/** Dados para criação de lote de ingressos em um evento. */
export interface CreateTicketLotInput {
  name: string;
  price: number;
  totalQuantity: number;
  availableQuantity?: number;
}
