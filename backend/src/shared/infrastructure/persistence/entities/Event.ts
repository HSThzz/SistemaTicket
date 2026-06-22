/**
 * @file Entidade TypeORM de evento (catálogo).
 * @module shared/infrastructure/persistence/entities/Event
 */

import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { EventStatus, EventType } from "../../../kernel/enums";
import { TicketLot } from "./TicketLot";
import { User } from "./User";

/** Evento criado por um produtor, com lotes de ingressos e metadados de publicação. */
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

  @Column({ type: "jsonb", default: () => "'[]'" })
  artists!: string[];

  @Column({
    type: "enum",
    enum: EventStatus,
    default: EventStatus.DRAFT,
  })
  status!: EventStatus;

  @Column({
    type: "enum",
    enum: EventType,
    default: EventType.PUBLIC,
  })
  type!: EventType;

  @Column({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt!: Date | null;

  @ManyToOne(() => User, (user) => user.events, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "producer_id" })
  producer!: User;

  @OneToMany(() => TicketLot, (ticketLot) => ticketLot.event)
  ticketLots!: TicketLot[];
}
