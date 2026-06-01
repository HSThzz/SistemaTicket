import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { EventStatus } from "../../../kernel/enums";
import { TicketLot } from "./TicketLot";
import { User } from "./User";

@Entity("events")
export class Event {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "producer_id", type: "uuid", nullable: true })
  producerId!: string | null;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "timestamptz" })
  date!: Date;

  @Column({ type: "varchar", length: 255 })
  location!: string;

  @Column({ name: "image_url", type: "varchar", length: 2048, nullable: true })
  imageUrl!: string | null;

  @Column({
    type: "enum",
    enum: EventStatus,
    default: EventStatus.DRAFT,
  })
  status!: EventStatus;

  @ManyToOne(() => User, (user) => user.events, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "producer_id" })
  producer!: User;

  @OneToMany(() => TicketLot, (ticketLot) => ticketLot.event)
  ticketLots!: TicketLot[];
}
