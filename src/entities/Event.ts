import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { EventStatus } from "./enums";
import { TicketLot } from "./TicketLot";

@Entity("events")
export class Event {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "timestamptz" })
  date!: Date;

  @Column({ type: "varchar", length: 255 })
  location!: string;

  @Column({
    type: "enum",
    enum: EventStatus,
    default: EventStatus.DRAFT,
  })
  status!: EventStatus;

  @OneToMany(() => TicketLot, (ticketLot) => ticketLot.event)
  ticketLots!: TicketLot[];
}
