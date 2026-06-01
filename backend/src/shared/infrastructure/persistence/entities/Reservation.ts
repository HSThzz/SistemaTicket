/**
 * @file Entidade TypeORM de reserva temporária de ingressos.
 * @module shared/infrastructure/persistence/entities/Reservation
 */

import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ReservationStatus } from "../../../kernel/enums";
import { TicketLot } from "./TicketLot";
import { User } from "./User";

/** Reserva de quantidade em um lote, com expiração e status de ciclo de vida. */
@Entity("reservations")
export class Reservation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ name: "ticket_lot_id", type: "uuid" })
  ticketLotId!: string;

  @Column({ type: "integer" })
  quantity!: number;

  @Column({
    type: "enum",
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status!: ReservationStatus;

  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt!: Date;

  @ManyToOne(() => User, (user) => user.reservations, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => TicketLot, (ticketLot) => ticketLot.reservations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "ticket_lot_id" })
  ticketLot!: TicketLot;
}
