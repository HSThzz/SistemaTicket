/**
 * @file Entidade TypeORM de lote de ingressos de um evento.
 * @module shared/infrastructure/persistence/entities/TicketLot
 */

import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Event } from "./Event";
import { Reservation } from "./Reservation";
import { Ticket } from "./Ticket";

/** Lote com preço, quantidade total e estoque disponível vinculado a um evento. */
@Entity("ticket_lots")
export class TicketLot {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "event_id", type: "uuid" })
  eventId!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "integer" })
  price!: number;

  @Column({ name: "total_quantity", type: "integer" })
  totalQuantity!: number;

  @Column({ name: "available_quantity", type: "integer" })
  availableQuantity!: number;

  @ManyToOne(() => Event, (event) => event.ticketLots, { onDelete: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event!: Event;

  @OneToMany(() => Reservation, (reservation) => reservation.ticketLot)
  reservations!: Reservation[];

  @OneToMany(() => Ticket, (ticket) => ticket.ticketLot)
  tickets!: Ticket[];
}
