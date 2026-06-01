import type { DataSource } from "typeorm";
import { Ticket } from "../../../shared/infrastructure/persistence/entities/Ticket";
import { UserRole } from "../../../shared/kernel/enums";

export interface WalletActor {
  userId: string;
  role: UserRole;
}

export class WalletAccessService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Owner can access their ticket.
   * ADMIN can access any ticket.
   * PRODUCER can access tickets for events they own.
   */
  async canAccessTicket(ticketId: string, actor: WalletActor): Promise<boolean> {
    if (actor.role === UserRole.ADMIN) {
      return true;
    }

    const ticket = await this.dataSource.getRepository(Ticket).findOne({
      where: { id: ticketId },
      relations: {
        order: true,
        ticketLot: { event: true },
      },
      select: {
        id: true,
        orderId: true,
        ticketLotId: true,
      },
    });

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

