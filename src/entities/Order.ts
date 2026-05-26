import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { OrderStatus } from "./enums";
import { Reservation } from "./Reservation";
import { Ticket } from "./Ticket";
import { User } from "./User";

@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ name: "total_price", type: "integer" })
  totalPrice!: number;

  @Column({
    type: "enum",
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  @Column({ name: "payment_gateway_id", type: "varchar", length: 255, nullable: true })
  paymentGatewayId!: string | null;

  @Column({ name: "reservation_id", type: "uuid" })
  reservationId!: string;

  @ManyToOne(() => Reservation, { onDelete: "CASCADE" })
  @JoinColumn({ name: "reservation_id" })
  reservation!: Reservation;

  @ManyToOne(() => User, (user) => user.orders, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @OneToMany(() => Ticket, (ticket) => ticket.order)
  tickets!: Ticket[];
}
