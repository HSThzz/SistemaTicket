import { randomBytes } from "node:crypto";
import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { TicketStatus } from "./enums";
import { Order } from "./Order";
import { TicketLot } from "./TicketLot";

@Entity("tickets")
export class Ticket {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "order_id", type: "uuid" })
  orderId!: string;

  @Column({ name: "ticket_lot_id", type: "uuid" })
  ticketLotId!: string;

  @Column({ name: "owner_name", type: "varchar", length: 255 })
  ownerName!: string;

  @Column({ name: "owner_document", type: "varchar", length: 18 })
  ownerDocument!: string;

  @Column({ name: "unique_code", type: "varchar", length: 64, unique: true })
  uniqueCode!: string;

  @Column({
    type: "enum",
    enum: TicketStatus,
    default: TicketStatus.ACTIVE,
  })
  status!: TicketStatus;

  @Column({ name: "checked_in_at", type: "timestamptz", nullable: true })
  checkedInAt!: Date | null;

  @ManyToOne(() => Order, (order) => order.tickets, { onDelete: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order!: Order;

  @ManyToOne(() => TicketLot, (ticketLot) => ticketLot.tickets, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "ticket_lot_id" })
  ticketLot!: TicketLot;

  @BeforeInsert()
  generateUniqueCode(): void {
    if (!this.uniqueCode) {
      this.uniqueCode = randomBytes(32).toString("hex");
    }
  }
}
