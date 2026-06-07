/**
 * @file Regras de autorização para download de passes de carteira digital.
 * @module ticketing/application/WalletAccessService
 */

import type { DataSource } from "typeorm";
import { UserRole } from "../../../shared/kernel/enums";
import { findOneTicketForAccessCheck } from "./queries/findOneTicketForAccessCheck";

/**
 * Ator que solicita acesso ao pass de um ingresso.
 */
export interface WalletActor {
  userId: string;
  role: UserRole;
}

/**
 * Verifica se o usuário pode gerar pass Apple/Google para o ingresso.
 */
export class WalletAccessService {
  /**
   * @param dataSource - Conexão TypeORM.
   */
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Dono do pedido, admin global ou produtor dono do evento podem acessar.
   * @param ticketId - Identificador do ingresso.
   * @param actor - Usuário autenticado.
   * @returns `true` se o acesso for permitido.
   */
  async canAccessTicket(ticketId: string, actor: WalletActor): Promise<boolean> {
    if (actor.role === UserRole.ADMIN) {
      return true;
    }

    const ticket = await findOneTicketForAccessCheck(this.dataSource, ticketId);

    if (!ticket?.order || !ticket.ticketLot?.event) {
      return false;
    }

    if (ticket.order.userId === actor.userId) {
      return true;
    }

    if (
      actor.role === UserRole.PRODUCER &&
      ticket.ticketLot.event.producerId === actor.userId
    ) {
      return true;
    }

    return false;
  }
}
